let extractedAssignments = [];

// Load saved data from storage
chrome.storage.local.get(['serverUrl', 'email'], (result) => {
  if (result.serverUrl) {
    document.getElementById('serverUrl').value = result.serverUrl;
  }
  if (result.email) {
    document.getElementById('email').value = result.email;
  }
});

// Save email when changed
document.getElementById('email').addEventListener('change', (e) => {
  const email = e.target.value;
  chrome.storage.local.set({ email });

  // Register user with server
  const serverUrl = document.getElementById('serverUrl').value;
  if (serverUrl && email) {
    registerUser(email, serverUrl);
  }
});

// Save server URL when changed
document.getElementById('serverUrl').addEventListener('change', (e) => {
  const url = e.target.value;
  chrome.storage.local.set({ serverUrl: url });
});

// Register user with server
async function registerUser(email, serverUrl) {
  try {
    await fetch(`${serverUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email }),
    });
  } catch (error) {
    console.error('Error registering user:', error);
  }
}

// Show status message
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');

  setTimeout(() => {
    statusDiv.classList.add('hidden');
  }, 5000);
}

// Display assignments
function displayAssignments(assignments) {
  const listDiv = document.getElementById('assignmentList');

  if (assignments.length === 0) {
    listDiv.innerHTML = '<p style="text-align: center; color: #999;">No assignments found</p>';
    listDiv.classList.remove('hidden');
    return;
  }

  listDiv.innerHTML = assignments.map(a => `
    <div class="assignment-item">
      <div class="assignment-title">${a.title || 'Untitled'}</div>
      <div class="assignment-course">${a.course || 'Unknown course'}</div>
      <div class="assignment-date">${a.date || ''} ${a.time || ''}</div>
    </div>
  `).join('');

  listDiv.classList.remove('hidden');
}

// Sync assignments button - extract and send in one action
document.getElementById('syncBtn').addEventListener('click', async () => {
  const serverUrl = document.getElementById('serverUrl').value;
  const email = document.getElementById('email').value;

  if (!email) {
    showStatus('Please enter your email', 'error');
    return;
  }

  if (!serverUrl) {
    showStatus('Please enter a server URL', 'error');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const moodleUrl = 'https://moodle.lafayette.edu/calendar/view.php?view=upcoming&course=1';

    // Check if we're already on the Moodle calendar page
    if (!tab.url.includes('moodle.lafayette.edu/calendar')) {
      showStatus('Opening Moodle calendar...', 'info');

      // Open the Moodle calendar in a new tab
      chrome.tabs.create({ url: moodleUrl }, (newTab) => {
        // Wait for the page to load, then extract and send
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === newTab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);

            // Wait a bit more for content to render
            setTimeout(() => {
              extractAndSend(newTab.id, serverUrl, email);
            }, 1000);
          }
        });
      });
    } else {
      // Already on the page, extract and send immediately
      extractAndSend(tab.id, serverUrl, email);
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
});

// Helper function to extract and send from a specific tab
async function extractAndSend(tabId, serverUrl, email) {
  showStatus('Extracting assignments...', 'info');

  chrome.tabs.sendMessage(tabId, { action: 'extractAssignments' }, async (response) => {
    if (chrome.runtime.lastError) {
      showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
      console.error('Chrome runtime error:', chrome.runtime.lastError);
      return;
    }

    if (response && response.assignments) {
      extractedAssignments = response.assignments;
      console.log('✅ Extracted assignments:', JSON.stringify(extractedAssignments, null, 2));
      console.log(`Total assignments: ${extractedAssignments.length}`);
      displayAssignments(extractedAssignments);

      if (extractedAssignments.length === 0) {
        showStatus('No assignments found', 'info');
        return;
      }

      // Automatically send to server
      showStatus('Sending to server...', 'info');

      try {
        const response = await fetch(`${serverUrl}/api/assignments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            email,
            assignments: extractedAssignments,
            extractedAt: new Date().toISOString(),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          showStatus(`Successfully synced ${extractedAssignments.length} assignments!`, 'success');

          // Also send a notification about new assignments
          await fetch(`${serverUrl}/api/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
            body: JSON.stringify({
              email,
              title: 'Assignments Updated',
              body: `${extractedAssignments.length} assignments synced from Moodle`,
              data: { type: 'assignments', count: extractedAssignments.length },
            }),
          });
        } else {
          showStatus('Error: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (error) {
        showStatus('Network error: ' + error.message, 'error');
      }
    } else {
      showStatus('No assignments found', 'error');
      console.warn('No assignments in response:', response);
    }
  });
}

// Load previously extracted assignments if available
chrome.storage.local.get(['lastExtractedAssignments'], (result) => {
  if (result.lastExtractedAssignments) {
    extractedAssignments = result.lastExtractedAssignments;
    displayAssignments(extractedAssignments);
  }
});
