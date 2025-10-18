let extractedAssignments = [];

// Load server URL from storage
chrome.storage.local.get(['serverUrl'], (result) => {
  if (result.serverUrl) {
    document.getElementById('serverUrl').value = result.serverUrl;
  }
});

// Save server URL when changed
document.getElementById('serverUrl').addEventListener('change', (e) => {
  const url = e.target.value;
  chrome.storage.local.set({ serverUrl: url });
});

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
  document.getElementById('sendBtn').disabled = false;
}

// Extract assignments button
document.getElementById('extractBtn').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('moodle.lafayette.edu/calendar')) {
      showStatus('Please navigate to the Moodle calendar page first!', 'error');
      return;
    }

    showStatus('Extracting assignments...', 'info');

    chrome.tabs.sendMessage(tab.id, { action: 'extractAssignments' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        return;
      }

      if (response && response.assignments) {
        extractedAssignments = response.assignments;
        displayAssignments(extractedAssignments);
        showStatus(`Found ${extractedAssignments.length} assignments!`, 'success');
      } else {
        showStatus('No assignments found', 'error');
      }
    });
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  }
});

// Send to server button
document.getElementById('sendBtn').addEventListener('click', async () => {
  const serverUrl = document.getElementById('serverUrl').value;

  if (!serverUrl) {
    showStatus('Please enter a server URL', 'error');
    return;
  }

  if (extractedAssignments.length === 0) {
    showStatus('No assignments to send', 'error');
    return;
  }

  showStatus('Sending to server...', 'info');

  try {
    const response = await fetch(`${serverUrl}/api/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        assignments: extractedAssignments,
        extractedAt: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showStatus(`Successfully sent ${extractedAssignments.length} assignments!`, 'success');

      // Also send a notification about new assignments
      await fetch(`${serverUrl}/api/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
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
});

// Load previously extracted assignments if available
chrome.storage.local.get(['lastExtractedAssignments'], (result) => {
  if (result.lastExtractedAssignments) {
    extractedAssignments = result.lastExtractedAssignments;
    displayAssignments(extractedAssignments);
  }
});
