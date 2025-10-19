// Content script to scrape Moodle assignments
console.log("Blinky Moodle Assignment Tracker: Content script loaded");

function extractAssignments() {
	const assignments = [];

	// Find all event cards in the upcoming events view
	const eventCards = document.querySelectorAll('[data-type="event"]');

	eventCards.forEach((card) => {
		try {
			const assignment = {
				id: card.getAttribute("data-event-id"),
				courseId: card.getAttribute("data-course-id"),
				title: card.getAttribute("data-event-title"),
				type: card.getAttribute("data-event-eventtype"),
				component: card.getAttribute("data-event-component"),
			};

			// Extract date and time
			const dateLink = card.querySelector('.row a[href*="view.php?view=day"]');
			const timeText = card.querySelector(".row .col-11");
			if (dateLink && timeText) {
				assignment.date = dateLink.textContent.trim();
				// Extract only the time portion, skip the date that's already in assignment.date
				const fullText = timeText.textContent.trim();
				const parts = fullText.split(",");
				// If there are 3+ parts (e.g., "Tuesday, October 21, 11:59 PM"), take everything after the second comma
				// If there are 2 parts, take the second part (the time)
				assignment.time =
					parts.length >= 2
						? parts.slice(2).join(",").trim() || parts[1].trim()
						: "";
			}

			// Extract course name
			const courseLink = card.querySelector('a[href*="course/view.php"]');
			if (courseLink) {
				assignment.course = courseLink.textContent.trim();
			}

			// Extract description
			const descriptionDiv = card.querySelector(".description-content");
			if (descriptionDiv) {
				assignment.description = descriptionDiv.textContent.trim();
			}

			// Extract link
			const actionLink = card.querySelector(".card-footer a");
			if (actionLink) {
				assignment.actionUrl = actionLink.href;
				assignment.actionText = actionLink.textContent.trim();
			}

			assignments.push(assignment);
		} catch (error) {
			console.error("Error extracting assignment:", error);
		}
	});

	return assignments;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "extractAssignments") {
		const assignments = extractAssignments();
		sendResponse({ assignments });
	}
	return true; // Keep the message channel open for async response
});

// Auto-extract on page load and store in chrome storage
async function autoExtractAndStore() {
	console.log("🔍 Auto-extract function running...");

	// Wait a bit for the page to fully render
	await new Promise((resolve) => setTimeout(resolve, 1500));

	const assignments = extractAssignments();
	console.log(`📚 Extracted ${assignments.length} assignments`);

	if (assignments.length > 0) {
		chrome.storage.local.set({
			lastExtractedAssignments: assignments,
			lastExtractedTime: new Date().toISOString(),
		});
	}

	// Check if there's a pending sync request
	const result = await chrome.storage.local.get(["pendingSync", "syncEmail"]);
	console.log("📦 Storage check:", result);

	if (result.pendingSync && result.syncEmail) {
		console.log("✅ Pending sync detected, triggering auto-sync...");
		await performAutoSync(assignments, result.syncEmail);
	} else {
		console.log("❌ No pending sync found");
	}
}

// Perform automatic sync when page loads with pending sync flag
async function performAutoSync(assignments, email) {
	console.log("🚀 Starting auto-sync for", email);

	try {
		// Use CONFIG from injected config.js
		const SERVER_URL = CONFIG.API_URL;

		console.log("📡 Syncing assignments to server:", SERVER_URL);

		// Send assignments to server
		const apiResponse = await fetch(`${SERVER_URL}/api/assignments`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"ngrok-skip-browser-warning": "true",
			},
			body: JSON.stringify({
				email,
				assignments,
				extractedAt: new Date().toISOString(),
			}),
		});

		const data = await apiResponse.json();

		if (apiResponse.ok) {
			console.log(`✅ Successfully synced ${assignments.length} assignments!`);

			// Send notification
			await fetch(`${SERVER_URL}/api/send-notification`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"ngrok-skip-browser-warning": "true",
				},
				body: JSON.stringify({
					email,
					title: "Assignments Updated",
					body: `${assignments.length} assignments synced from Moodle`,
					data: { type: "assignments", count: assignments.length },
				}),
			});
		} else {
			console.error("Error syncing:", data.error || "Unknown error");
		}
	} catch (error) {
		console.error("Network error:", error);
	} finally {
		// Clear the pending sync flag
		chrome.storage.local.set({ pendingSync: false });
	}
}

// Run on page load
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", autoExtractAndStore);
} else {
	autoExtractAndStore();
}
