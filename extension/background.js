let focusEndTime = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.action === "START") {
    focusEndTime = msg.endTime;   // receive timer
    blockSites();                 // BLOCK NOW
    chrome.storage.local.set({ focusActive: true });
    sendResponse({ status: "started" });
  }

  if (msg.action === "STOP") {
    focusEndTime = null;
    unblockSites();               // UNBLOCK NOW
    chrome.storage.local.set({ focusActive: false });
    sendResponse({ status: "stopped" });
  }

  return true;
});

function blockSites() {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1, 2],
    addRules: [
      {
        id: 1,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: "youtube.com",
          resourceTypes: ["main_frame"]
        }
      },
      {
        id: 2,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: "instagram.com",
          resourceTypes: ["main_frame"]
        }
      }
    ]
  });
}

function unblockSites() {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1, 2]
  }, () => {
    console.log("Sites unblocked");
  });
}

// Auto stop timer
setInterval(() => {
  if (focusEndTime && Date.now() > focusEndTime) {
    focusEndTime = null;
    unblockSites();
    chrome.storage.local.set({ focusActive: false });
  }
}, 1000);