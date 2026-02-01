// Wait until the popup DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");
  const minutesInput = document.getElementById("minutes");
  const status = document.getElementById("status");

  // Start button click
  startBtn.addEventListener("click", () => {
    const minutes = parseInt(minutesInput.value);

    if (isNaN(minutes) || minutes <= 0) {
      status.textContent = "Enter valid minutes ⛔";
      status.style.color = "red";
      return;
    }

    const endTime = Date.now() + minutes * 60 * 1000;

    chrome.runtime.sendMessage({ action: "START", endTime }, () => {
      status.textContent = "Timer is ON ⏳";
      status.style.color = "green";

      // Save state to storage for UI page
      chrome.storage.local.set({ focusActive: true });
    });
  });

  // Stop button click
  stopBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "STOP" }, () => {
      status.textContent = "Timer is OFF ✅";
      status.style.color = "black";

      // Update storage
      chrome.storage.local.set({ focusActive: false });
    });
  });

  // Optional: show current state when popup opens
  chrome.storage.local.get("focusActive", (data) => {
    if (data.focusActive) {
      status.textContent = "Timer is ON ⏳";
      status.style.color = "green";
    } else {
      status.textContent = "Timer is OFF ✅";
      status.style.color = "black";
    }
  });
});
