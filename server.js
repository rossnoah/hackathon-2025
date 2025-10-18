const express = require("express");
const cors = require("cors");
const { Expo } = require("expo-server-sdk");

const app = express();
const expo = new Expo();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Store push tokens (in production, use a database)
let pushTokens = [];

// Health check endpoint
app.get("/", (req, res) => {
	res.json({ message: "Notification server is running" });
});

// Register a push token
app.post("/api/register-token", (req, res) => {
	const { token } = req.body;

	if (!token) {
		return res.status(400).json({ error: "Token is required" });
	}

	// Validate that the token is a valid Expo push token
	if (!Expo.isExpoPushToken(token)) {
		return res.status(400).json({ error: "Invalid Expo push token" });
	}

	// Add token if it doesn't exist
	if (!pushTokens.includes(token)) {
		pushTokens.push(token);
	}

	res.json({ success: true, message: "Token registered successfully" });
});

// Send notification endpoint
app.post("/api/send-notification", async (req, res) => {
	const { title, body, data } = req.body;

	if (!title || !body) {
		return res.status(400).json({ error: "Title and body are required" });
	}

	if (pushTokens.length === 0) {
		return res.status(400).json({ error: "No registered push tokens" });
	}

	// Create the messages
	let messages = [];
	for (let pushToken of pushTokens) {
		// Check that all your push tokens appear to be valid Expo push tokens
		if (!Expo.isExpoPushToken(pushToken)) {
			console.error(`Push token ${pushToken} is not a valid Expo push token`);
			continue;
		}

		// Construct a message
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

	try {
		for (let chunk of chunks) {
			let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
			tickets.push(...ticketChunk);
		}

		res.json({
			success: true,
			message: "Notifications sent successfully",
			tickets: tickets,
		});
	} catch (error) {
		console.error("Error sending notifications:", error);
		res.status(500).json({ error: "Failed to send notifications" });
	}
});

// Get registered tokens
app.get("/api/tokens", (req, res) => {
	res.json({
		count: pushTokens.length,
		tokens: pushTokens,
	});
});

// Clear all tokens
app.delete("/api/tokens", (req, res) => {
	pushTokens = [];
	res.json({ success: true, message: "All tokens cleared" });
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
