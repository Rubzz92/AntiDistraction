
// ANTI-DISTRACTION BACKGROUND SERVICE WORKER

const RULE_IDS = [1, 2, 3];

function blockSites(callback) {

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: RULE_IDS,

        addRules: [
            {
                id: 1,
                priority: 1,
                action: { type: "block" },
                condition: {
                    urlFilter: "https://youtube.com",
                    resourceTypes: ["main_frame"]
                }
            },
            {
                id: 2,
                priority: 1,
                action: { type: "block" },
                condition: {
                    urlFilter: "https://www.instagram.com",
                    resourceTypes: ["main_frame"]
                }
            },
            {
                id: 3,
                priority: 1,
                action: { type: "block" },
                condition: {
                    urlFilter: "||youtu.be/",
                    resourceTypes: ["main_frame"]
                }
            }
        ]

    }, () => {

        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            if (callback) callback(false);
            return;
        }

        console.log("YouTube and Instagram blocked!");
        if (callback) callback(true);
    });
}

function unblockSites(callback) {

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: RULE_IDS
    }, () => {

        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            if (callback) callback(false);
            return;
        }

        console.log("Websites unblocked!");
        if (callback) callback(true);
    });
}

// HANDLE START AND STOP MESSAGES
function handleMessage(msg, sendResponse) {

    if (msg.action === "START") {

        const endTime = Number(msg.endTime);

        if (!Number.isFinite(endTime) || endTime <= Date.now()) {
            sendResponse({
                ok: false,
                error: "Invalid focus end time"
            });
            return;
        }

        blockSites((success) => {

            if (!success) {
                sendResponse({
                    ok: false,
                    error: "Could not block websites"
                });
                return;
            }

            chrome.storage.local.set({
                focusActive: true,
                focusEndTime: endTime
            }, () => {

                chrome.alarms.create("focusEnd", {
                    when: endTime
                });

                sendResponse({
                    ok: true,
                    status: "started"
                });
            });
        });

        return true;
    }

    if (msg.action === "STOP") {

        chrome.alarms.clear("focusEnd");

        unblockSites((success) => {

            chrome.storage.local.set({
                focusActive: false,
                focusEndTime: null
            }, () => {

                sendResponse({
                    ok: success,
                    status: "stopped"
                });
            });
        });

        return true;
    }

    sendResponse({
        ok: false,
        error: "Unknown action"
    });
}

// Messages from your website
chrome.runtime.onMessageExternal.addListener(
    (msg, sender, sendResponse) => {
        handleMessage(msg, sendResponse);
        return true;
    }
);

// Messages from your extension popup
chrome.runtime.onMessage.addListener(
    (msg, sender, sendResponse) => {
        handleMessage(msg, sendResponse);
        return true;
    }
);

// AUTOMATICALLY UNBLOCK WHEN FOCUS TIME ENDS
chrome.alarms.onAlarm.addListener((alarm) => {

    if (alarm.name === "focusEnd") {

        chrome.storage.local.get(
            ["focusEndTime"],
            (data) => {

                if (data.focusEndTime &&
                    Date.now() >= data.focusEndTime) {

                    unblockSites(() => {

                        chrome.storage.local.set({
                            focusActive: false,
                            focusEndTime: null
                        });
                    });
                }
            }
        );
    }
});

// RESTORE FOCUS SESSION AFTER CHROME RESTARTS
function restoreFocusSession() {

    chrome.storage.local.get(
        ["focusActive", "focusEndTime"],
        (data) => {

            if (!data.focusActive || !data.focusEndTime) {
                return;
            }

            if (Date.now() >= data.focusEndTime) {

                unblockSites();

                chrome.storage.local.set({
                    focusActive: false,
                    focusEndTime: null
                });

            } else {

                blockSites();

                chrome.alarms.create("focusEnd", {
                    when: data.focusEndTime
                });
            }
        }
    );
}

chrome.runtime.onStartup.addListener(restoreFocusSession);
chrome.runtime.onInstalled.addListener(restoreFocusSession);

restoreFocusSession();
