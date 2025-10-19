require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Expo } = require("expo-server-sdk");
const Database = require("better-sqlite3");
const OpenAI = require("openai");
const cron = require("node-cron");

const app = express();
const expo = new Expo();
const PORT = process.env.PORT || 4000;

// Initialize OpenAI
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Initialize SQLite database
// Use /app/data directory for better containerization support
const dbPath =
	process.env.DATABASE_PATH || path.join(__dirname, "data", "hackathon.db");
console.log(`📂 Database path: ${dbPath}`);
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    push_token TEXT,
    notifications_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    email TEXT,
    course_id TEXT,
    title TEXT,
    course TEXT,
    date TEXT,
    time TEXT,
    description TEXT,
    action_url TEXT,
    type TEXT,
    component TEXT,
    extracted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES users(email)
  );

  CREATE TABLE IF NOT EXISTS screentime (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    app_usage TEXT,
    total_usage_minutes INTEGER,
    date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email) REFERENCES users(email)
  );
`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint for Docker/Coolify
app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve dashboard as home page
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Helper function to ensure user exists (creates if doesn't exist)
function ensureUserExists(email, pushToken = null) {
	try {
		const stmt = db.prepare(`
      INSERT INTO users (email, push_token, last_seen)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        push_token = COALESCE(?, push_token),
        last_seen = CURRENT_TIMESTAMP
    `);

		stmt.run(email, pushToken, pushToken);
		return true;
	} catch (error) {
		console.error("Error ensuring user exists:", error);
		return false;
	}
}

// Register or update user
app.post("/api/register", (req, res) => {
	const { email, pushToken, notificationsEnabled } = req.body;

	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	// Validate push token if provided
	if (pushToken && !Expo.isExpoPushToken(pushToken)) {
		return res.status(400).json({ error: "Invalid Expo push token" });
	}

	try {
		// Use the shared function for basic user creation
		ensureUserExists(email, pushToken);

		// Update notifications_enabled if provided
		if (notificationsEnabled !== undefined) {
			const updateStmt = db.prepare(`
        UPDATE users SET notifications_enabled = ? WHERE email = ?
      `);
			updateStmt.run(notificationsEnabled ? 1 : 0, email);
		}

		res.json({
			success: true,
			message: "User registered successfully",
			email,
		});
	} catch (error) {
		console.error("Error registering user:", error);
		res.status(500).json({ error: "Failed to register user" });
	}
});

// Toggle notifications for a user
app.post("/api/toggle-notifications", (req, res) => {
	const { email, enabled } = req.body;

	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	if (typeof enabled !== "boolean") {
		return res.status(400).json({ error: "Enabled must be a boolean" });
	}

	try {
		const stmt = db.prepare(`
      UPDATE users SET notifications_enabled = ? WHERE email = ?
    `);

		stmt.run(enabled ? 1 : 0, email);

		res.json({
			success: true,
			message: `Notifications ${enabled ? "enabled" : "disabled"}`,
			email,
			enabled,
		});
	} catch (error) {
		console.error("Error toggling notifications:", error);
		res.status(500).json({ error: "Failed to toggle notifications" });
	}
});

// Send notification endpoint
app.post("/api/send-notification", async (req, res) => {
	const { title, body, data, email } = req.body;

	if (!title || !body) {
		return res.status(400).json({ error: "Title and body are required" });
	}

	try {
		// Get push tokens from database
		let users;
		if (email) {
			// Send to specific email
			users = db
				.prepare(
					"SELECT push_token FROM users WHERE email = ? AND push_token IS NOT NULL",
				)
				.all(email);
		} else {
			// Send to all users
			users = db
				.prepare("SELECT push_token FROM users WHERE push_token IS NOT NULL")
				.all();
		}

		if (users.length === 0) {
			return res.status(400).json({ error: "No registered push tokens found" });
		}

		// Create the messages
		let messages = [];
		for (let user of users) {
			const pushToken = user.push_token;

			if (!Expo.isExpoPushToken(pushToken)) {
				console.error(`Invalid push token: ${pushToken}`);
				continue;
			}

			messages.push({
				to: pushToken,
				sound: "default",
				title: title,
				body: body,
				data: data || {},
			});
		}

		// Send the notifications in chunks
		let chunks = expo.chunkPushNotifications(messages);
		let tickets = [];

		for (let chunk of chunks) {
			let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
			tickets.push(...ticketChunk);
		}

		res.json({
			success: true,
			message: "Notifications sent successfully",
			count: messages.length,
			tickets: tickets,
		});
	} catch (error) {
		console.error("Error sending notifications:", error);
		res.status(500).json({ error: "Failed to send notifications" });
	}
});

// Get all users
app.get("/api/users", (req, res) => {
	try {
		const users = db
			.prepare("SELECT email, push_token, created_at, last_seen FROM users")
			.all();
		res.json({ count: users.length, users });
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: "Failed to fetch users" });
	}
});

// Receive assignments from Chrome extension
app.post("/api/assignments", (req, res) => {
	const { assignments: newAssignments, extractedAt, email } = req.body;

	if (!newAssignments || !Array.isArray(newAssignments)) {
		return res.status(400).json({ error: "Assignments array is required" });
	}

	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	try {
		// Ensure user exists (create if doesn't exist)
		const userCreated = ensureUserExists(email);
		if (!userCreated) {
			return res.status(500).json({ error: "Failed to create/update user" });
		}

		// Delete old assignments for this user
		db.prepare("DELETE FROM assignments WHERE email = ?").run(email);

		// Insert new assignments
		const stmt = db.prepare(`
      INSERT INTO assignments (id, email, course_id, title, course, date, time, description, action_url, type, component, extracted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

		for (const a of newAssignments) {
			const assignmentId = `${email}-${a.id || Date.now()}-${Math.random()}`;
			stmt.run(
				assignmentId,
				email,
				a.courseId || null,
				a.title || null,
				a.course || null,
				a.date || null,
				a.time || null,
				a.description || null,
				a.actionUrl || null,
				a.type || null,
				a.component || null,
				extractedAt || new Date().toISOString(),
			);
		}

		console.log(`✅ Received ${newAssignments.length} assignments for ${email}`);

		res.json({
			success: true,
			message: `Received ${newAssignments.length} assignments`,
			count: newAssignments.length,
		});
	} catch (error) {
		console.error("Error storing assignments:", error);
		res.status(500).json({ error: "Failed to store assignments" });
	}
});

// Get all assignments
app.get("/api/assignments", (req, res) => {
	try {
		const { email } = req.query;
		let assignments;

		if (email) {
			assignments = db
				.prepare(
					"SELECT * FROM assignments WHERE email = ? ORDER BY created_at DESC",
				)
				.all(email);
		} else {
			assignments = db
				.prepare("SELECT * FROM assignments ORDER BY created_at DESC")
				.all();
		}

		res.json({ count: assignments.length, assignments });
	} catch (error) {
		console.error("Error fetching assignments:", error);
		res.status(500).json({ error: "Failed to fetch assignments" });
	}
});

// Get user's screentime insights with AI message
app.get("/api/insights/:email", async (req, res) => {
	const { email } = req.params;

	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	try {
		// Get latest screentime data
		const latestScreentime = db
			.prepare(
				`SELECT app_usage, total_usage_minutes FROM screentime 
       WHERE email = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
			)
			.get(email);

		// Get user's assignments
		const assignments = db
			.prepare(
				"SELECT * FROM assignments WHERE email = ? ORDER BY created_at DESC",
			)
			.all(email);

		if (!latestScreentime) {
			return res.json({
				hasSocialMediaData: false,
				message:
					"Start tracking your screen time to get personalized insights!",
				assignments: assignments || [],
			});
		}

		const appUsage = JSON.parse(latestScreentime.app_usage);
		const totalMinutesInDay = 24 * 60;
		const socialMediaPercentage = Math.round(
			(latestScreentime.total_usage_minutes / totalMinutesInDay) * 100,
		);

		// Generate AI message about procrastination
		let aiMessage = "";
		try {
			const appsList = appUsage
				.map((app) => `${app.appName} (${app.usageMinutes}m)`)
				.join(", ");

			const assignmentsList = assignments
				.map((a) => `- ${a.title} (${a.course}) due ${a.date}`)
				.join("\n");

			const completion = await openai.chat.completions.create({
				model: "gpt-4o",
				messages: [
					{
						role: "system",
						content: `You are a witty and slightly aggressive academic coach. Your job is to give students a reality check about their procrastination. Be direct, slightly guilt-inducing, but funny and motivating. Keep it to 1-2 sentences max. The tone should be like a concerned friend who's a bit sarcastic.`,
					},
					{
						role: "user",
						content: `This student has spent ${socialMediaPercentage}% of their day on social media apps: ${appsList}. They have these assignments due soon:\n${assignmentsList || "No specific assignments yet"}\n\nGive them a reality check about how their day is going.`,
					},
				],
				temperature: 0.9,
				max_tokens: 80,
			});

			aiMessage = completion.choices[0].message.content.trim();
		} catch (error) {
			console.error("Error generating AI message:", error);
			const fallbacks = [
				`You've spent ${socialMediaPercentage}% of your day on social media... maybe it's time to focus on those assignments? 📚`,
				`Social media: ${socialMediaPercentage}% of your day. Assignments: Still waiting for you. The math checks out. 📱➡️📚`,
				`${socialMediaPercentage}% on TikTok/Instagram? Buddy, those assignments aren't going to do themselves! ⏰`,
			];
			aiMessage = fallbacks[Math.floor(Math.random() * fallbacks.length)];
		}

		res.json({
			hasSocialMediaData: true,
			socialMediaPercentage,
			totalScreenTimeMinutes: latestScreentime.total_usage_minutes,
			topApps: appUsage.slice(0, 3),
			message: aiMessage,
			assignments: assignments || [],
		});
	} catch (error) {
		console.error("Error fetching insights:", error);
		res.status(500).json({ error: "Failed to fetch insights" });
	}
});

// Receive screen time data from mobile app
app.post("/api/screentime", (req, res) => {
	const { email, appUsage, date } = req.body;

	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	if (!appUsage || !Array.isArray(appUsage)) {
		return res.status(400).json({ error: "appUsage array is required" });
	}

	try {
		const screentimeData = {
			email,
			date: date || new Date().toISOString().split("T")[0],
			timestamp: new Date().toISOString(),
			appUsage,
			totalApps: appUsage.length,
			totalUsageMinutes: appUsage.reduce(
				(sum, app) => sum + (app.usageMinutes || 0),
				0,
			),
		};

		// Ensure user exists in users table
		const userCheckStmt = db.prepare("SELECT email FROM users WHERE email = ?");
		const userExists = userCheckStmt.get(email);

		if (!userExists) {
			const userInsertStmt = db.prepare("INSERT INTO users (email) VALUES (?)");
			userInsertStmt.run(email);
		}

		// Store in database
		const stmt = db.prepare(`
      INSERT INTO screentime (email, app_usage, total_usage_minutes, date)
      VALUES (?, ?, ?, ?)
    `);

		stmt.run(
			email,
			JSON.stringify(appUsage),
			screentimeData.totalUsageMinutes,
			screentimeData.date,
		);

		console.log(
			"📱 SCREEN TIME DATA STORED:",
			JSON.stringify(screentimeData, null, 2),
		);

		res.json({
			success: true,
			message: "Screen time data received and stored",
			received: screentimeData,
		});
	} catch (error) {
		console.error("Error processing screen time data:", error);
		res.status(500).json({ error: "Failed to process screen time data" });
	}
});

// Function to generate Duolingo-style notification using GPT-4o
async function generateDuolingoNotification(assignments, email) {
	try {
		const assignmentContext = assignments
			.map((a) => `- ${a.title} (${a.course}) due ${a.date} ${a.time}`)
			.join("\n");

		// Get latest screentime data for this user
		let screentimeContext = "";
		try {
			const latestScreentime = db
				.prepare(
					`SELECT app_usage FROM screentime WHERE email = ? ORDER BY created_at DESC LIMIT 1`,
				)
				.get(email);

			if (latestScreentime) {
				const appUsage = JSON.parse(latestScreentime.app_usage);
				const topApps = appUsage
					.slice(0, 3)
					.map((app) => `${app.appName} (${app.usageMinutes}m)`)
					.join(", ");
				screentimeContext = `\n\nThe student's top apps today: ${topApps}. Consider mentioning these in a cheeky way to guilt them about procrastinating!`;
			}
		} catch (err) {
			console.error("Error fetching screentime context:", err);
		}

		const completion = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content: `You are a witty, highly aggressive notification bot similar to Duolingo's owl. Your job is to remind students about their assignments in a fun, motivating, but slightly guilt-inducing way. Keep it short (max 2 sentences), funny, and personalized. Be creative and vary your approach - sometimes encouraging, very playfully threatening, sometimes disappointed. Make it feel personal and urgent but lighthearted. If you know what apps they've been using, call them out on it (e.g., "stop wasting time on TikTok, you have an assignment due!"). The messages should be vaguely threatening and short. Do not call them by their name or by [Student Name] or anything similar to that.`,
				},
				{
					role: "user",
					content: `Generate a short notification message for a student with these upcoming assignments:\n${assignmentContext}${screentimeContext}`,
				},
			],
			temperature: 1.0,
			max_tokens: 100,
		});

		return completion.choices[0].message.content.trim();
	} catch (error) {
		console.error("Error generating notification:", error);
		// Fallback messages if GPT fails
		const fallbacks = [
			"Your assignments are piling up... just saying 👀",
			"I'm not mad, just disappointed you haven't checked your assignments yet 📚",
			"Those assignments aren't going to complete themselves... unfortunately 🎓",
			"Me: Hey, check your assignments!\nYou: *ignores*\nMe: 😢",
			"Stop scrolling and get back to work! 📱➡️📚",
		];
		return fallbacks[Math.floor(Math.random() * fallbacks.length)];
	}
}

// Scheduled job to send reminders every 60 seconds
cron.schedule("*/1 * * * *", async () => {
	console.log("🔔 Running scheduled notification job...");

	try {
		// Get all users with push tokens AND notifications enabled
		const users = db
			.prepare(
				"SELECT email, push_token FROM users WHERE push_token IS NOT NULL AND notifications_enabled = 1",
			)
			.all();

		for (const user of users) {
			// Get assignments for this user
			const assignments = db
				.prepare(
					"SELECT * FROM assignments WHERE email = ? ORDER BY created_at DESC",
				)
				.all(user.email);

			// Only send if user has assignments
			if (assignments.length === 0) {
				console.log(`Skipping ${user.email} - no assignments`);
				continue;
			}

			// Generate personalized notification with screentime context
			const notificationBody = await generateDuolingoNotification(
				assignments,
				user.email,
			);

			// Send notification
			if (Expo.isExpoPushToken(user.push_token)) {
				try {
					await expo.sendPushNotificationsAsync([
						{
							to: user.push_token,
							sound: "default",
							title: "📚 Assignment Reminder",
							body: notificationBody,
							data: {
								type: "reminder",
								assignmentCount: assignments.length,
								email: user.email,
							},
						},
					]);
					console.log(
						`✅ Sent notification to ${user.email}: "${notificationBody}"`,
					);
				} catch (error) {
					console.error(`Error sending to ${user.email}:`, error);
				}
			}
		}
	} catch (error) {
		console.error("Error in scheduled job:", error);
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
	console.log(`📬 Scheduled notifications running every 60 seconds`);
});
