const express = require("express");
const cors = require("cors");
const path = require("path");
const { Expo } = require("expo-server-sdk");
const Database = require("better-sqlite3");

const app = express();
const expo = new Expo();
const PORT = process.env.PORT || 4000;

// Initialize SQLite database
const db = new Database("hackathon.db");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    push_token TEXT,
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
`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Serve dashboard as home page
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Register or update user
app.post("/api/register", (req, res) => {
	const { email, pushToken } = req.body;

	if (!email) {
		return res.status(400).json({ error: "Email is required" });
	}

	// Validate push token if provided
	if (pushToken && !Expo.isExpoPushToken(pushToken)) {
		return res.status(400).json({ error: "Invalid Expo push token" });
	}

	try {
		const stmt = db.prepare(`
      INSERT INTO users (email, push_token, last_seen)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        push_token = COALESCE(?, push_token),
        last_seen = CURRENT_TIMESTAMP
    `);

		stmt.run(email, pushToken || null, pushToken || null);

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
			users = db.prepare("SELECT push_token FROM users WHERE email = ? AND push_token IS NOT NULL").all(email);
		} else {
			// Send to all users
			users = db.prepare("SELECT push_token FROM users WHERE push_token IS NOT NULL").all();
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
		const users = db.prepare("SELECT email, push_token, created_at, last_seen FROM users").all();
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
				extractedAt || new Date().toISOString()
			);
		}

		console.log(`Received ${newAssignments.length} assignments for ${email}`);

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
			assignments = db.prepare("SELECT * FROM assignments WHERE email = ? ORDER BY created_at DESC").all(email);
		} else {
			assignments = db.prepare("SELECT * FROM assignments ORDER BY created_at DESC").all();
		}

		res.json({ count: assignments.length, assignments });
	} catch (error) {
		console.error("Error fetching assignments:", error);
		res.status(500).json({ error: "Failed to fetch assignments" });
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
