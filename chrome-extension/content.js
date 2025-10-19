// Content script to scrape Moodle assignments
console.log('Moodle Assignment Tracker: Content script loaded');

function extractAssignments() {
  const assignments = [];

  // Find all event cards in the upcoming events view
  const eventCards = document.querySelectorAll('[data-type="event"]');

  eventCards.forEach(card => {
    try {
      const assignment = {
        id: card.getAttribute('data-event-id'),
        courseId: card.getAttribute('data-course-id'),
        title: card.getAttribute('data-event-title'),
        type: card.getAttribute('data-event-eventtype'),
        component: card.getAttribute('data-event-component'),
      };

      // Extract date and time
      const dateLink = card.querySelector('.row a[href*="view.php?view=day"]');
      const timeText = card.querySelector('.row .col-11');
      if (dateLink && timeText) {
        assignment.date = dateLink.textContent.trim();
        // Extract only the time portion, skip the date that's already in assignment.date
        const fullText = timeText.textContent.trim();
        const parts = fullText.split(',');
        // If there are 3+ parts (e.g., "Tuesday, October 21, 11:59 PM"), take everything after the second comma
        // If there are 2 parts, take the second part (the time)
        assignment.time = parts.length >= 2 ? parts.slice(2).join(',').trim() || parts[1].trim() : '';
      }

      // Extract course name
      const courseLink = card.querySelector('a[href*="course/view.php"]');
      if (courseLink) {
        assignment.course = courseLink.textContent.trim();
      }

      // Extract description
      const descriptionDiv = card.querySelector('.description-content');
      if (descriptionDiv) {
        assignment.description = descriptionDiv.textContent.trim();
      }

      // Extract link
      const actionLink = card.querySelector('.card-footer a');
      if (actionLink) {
        assignment.actionUrl = actionLink.href;
        assignment.actionText = actionLink.textContent.trim();
      }

      assignments.push(assignment);
    } catch (error) {
      console.error('Error extracting assignment:', error);
    }
  });

  return assignments;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractAssignments') {
    const assignments = extractAssignments();
    sendResponse({ assignments });
  }
  return true; // Keep the message channel open for async response
});

// Auto-extract on page load and store in chrome storage
function autoExtractAndStore() {
  const assignments = extractAssignments();
  if (assignments.length > 0) {
    chrome.storage.local.set({
      lastExtractedAssignments: assignments,
      lastExtractedTime: new Date().toISOString()
    });
    console.log(`Extracted ${assignments.length} assignments`);
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoExtractAndStore);
} else {
  autoExtractAndStore();
}
