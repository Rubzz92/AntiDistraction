
document.addEventListener("DOMContentLoaded", () => {

    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const pomodoroBtn = document.getElementById("pomodoroBtn");

    const focusScreen = document.getElementById("focusScreen");
    const countdown = document.getElementById("countdown");
    const statusText = document.getElementById("status");
    const modeToggle = document.getElementById("modeToggle");
    const progressBar = document.getElementById("progressBar");

    let timer;
    let quoteTimer;

    let totalSeconds = 0;
    let remainingSeconds = 0;
    let endTime = 0;

    let paused = false;
    let pomodoro = false;
    let onBreak = false;

    let audioContext;

    // CHROME EXTENSION CONNECTION
    const EXTENSION_ID = "ifknopbcmacddhgdgphcnoncdahmoeea";

    function sendToBlocker(action, endTime) {

        if (typeof chrome === "undefined" ||
            !chrome.runtime?.sendMessage) {

            console.log("Chrome extension not available");
            return;
        }

        chrome.runtime.sendMessage(
            EXTENSION_ID,
            { action: action, endTime: endTime },
            (response) => {

                if (chrome.runtime.lastError) {
                    console.error(
                        "Extension error:",
                        chrome.runtime.lastError.message
                    );
                    return;
                }

                console.log("Blocker response:", response);
            }
        );
    }

    // MOTIVATIONAL QUOTES
    const quoteEl = document.createElement("p");
    quoteEl.id = "quote";
    quoteEl.style.fontSize = "1.5rem";
    quoteEl.style.margin = "20px 0";
    quoteEl.style.textShadow = "0 0 8px rgba(0,0,0,0.5)";

    focusScreen.appendChild(quoteEl);

    const quotes = [
        "Focus on what matters 🔥",
        "Distractions are the enemy 🚫",
        "wanna buy gucci,mercedes,benz right? 💪",
        "You got this! 💯",
        "Stay disciplined, stay strong 💥"
    ];

    function playQuote() {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteEl.textContent = quote;
    }

    // INITIALIZE AUDIO
    function initializeAudio() {

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
    }

    // DARK MODE
    modeToggle.onclick = () => {
        document.body.classList.toggle("dark");
    };

    // BUTTON EVENTS
    startBtn.onclick = () => {
        pomodoro = false;
        onBreak = false;
        startSession();
    };

    stopBtn.onclick = stopSession;

    // PAUSE AND RESUME
    pauseBtn.onclick = () => {

        if (!paused) {

            remainingSeconds = Math.max(
                0,
                Math.ceil((endTime - Date.now()) / 1000)
            );

            paused = true;
            clearInterval(timer);

            // Unblock while paused
            sendToBlocker("STOP");

            pauseBtn.textContent = "▶ Resume";

        } else {

            endTime = Date.now() + remainingSeconds * 1000;

            paused = false;

            // Resume blocking only during focus time
            if (pomodoro && onBreak) {
                sendToBlocker("STOP");
            } else {
                sendToBlocker("START", endTime);
            }

            pauseBtn.textContent = "⏸ Pause";

            timer = setInterval(tick, 200);
        }
    };

    // POMODORO
    pomodoroBtn.onclick = () => {
        pomodoro = true;
        onBreak = false;
        startSession(25);
    };

    // START SESSION
    function startSession(minutes) {

        clearInterval(timer);
        clearInterval(quoteTimer);

        const inputTime = minutes ||
            parseInt(document.getElementById("time").value);

        if (!Number.isFinite(inputTime) || inputTime <= 0) {
            alert("Enter a valid time!");
            return;
        }

        initializeAudio();

        totalSeconds = inputTime * 60;
        remainingSeconds = totalSeconds;

        endTime = Date.now() + totalSeconds * 1000;

        paused = false;
        pauseBtn.textContent = "⏸ Pause";

        // CONNECT TIMER WITH EXTENSION
        if (pomodoro && onBreak) {
            sendToBlocker("STOP");
        } else {
            sendToBlocker("START", endTime);
        }

        focusScreen.classList.add("active");

        document.querySelector(".container").style.display = "none";

        progressBar.style.width = "0%";

        statusText.textContent = pomodoro
            ? "Pomodoro Started 🍅"
            : "Focus Mode Running ⏳";

        updateUI();
        playQuote();

        timer = setInterval(tick, 200);

        // Change quote every 10 seconds
        quoteTimer = setInterval(playQuote, 10000);
    }

    // TIMER
    function tick() {

        if (paused) return;

        remainingSeconds = Math.max(
            0,
            Math.ceil((endTime - Date.now()) / 1000)
        );

        updateUI();

        if (remainingSeconds <= 0) {
            finishSession();
        }
    }

    // UPDATE UI
    function updateUI() {

        countdown.textContent = formatTime(remainingSeconds);

        const progress =
            ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

        progressBar.style.width = `${progress}%`;
    }

    // FINISH SESSION
    function finishSession() {

        clearInterval(timer);
        clearInterval(quoteTimer);

        remainingSeconds = 0;
        updateUI();

        progressBar.style.width = "100%";

        playAlert();
        saveSession();

        if (!pomodoro) {

            // Unblock websites
            sendToBlocker("STOP");

            focusScreen.classList.remove("active");

            document.querySelector(".container").style.display = "block";

            statusText.textContent =
                "🎉 Session Complete! Great Work!";

            countdown.textContent = "00:00";

            pomodoro = false;
            return;
        }

        // SWITCH POMODORO PHASE
        onBreak = !onBreak;

        if (onBreak) {

            // Break starts: websites get unblocked
            alert("Focus session completed! Time for a 5-minute break 🍅");

            startSession(5);

        } else {

            // Focus starts: websites get blocked again
            alert("Break completed! Back to work 💪");

            startSession(25);
        }
    }

    // STOP SESSION
    function stopSession() {

        clearInterval(timer);
        clearInterval(quoteTimer);

        // Unblock websites
        sendToBlocker("STOP");

        focusScreen.classList.remove("active");

        document.querySelector(".container").style.display = "block";

        progressBar.style.width = "0%";
        countdown.textContent = "00:00";

        paused = false;
        pomodoro = false;
        onBreak = false;

        pauseBtn.textContent = "⏸ Pause";

        statusText.textContent = "Focus Mode OFF ✅";
    }

    // ALARM SOUND
    function playAlert() {

        if (!audioContext) return;

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const now = audioContext.currentTime;

        for (let i = 0; i < 3; i++) {

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = "sine";
            oscillator.frequency.value = 880;

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            const start = now + i * 0.4;

            gainNode.gain.setValueAtTime(0.0001, start);
            gainNode.gain.exponentialRampToValueAtTime(
                0.5, start + 0.03
            );

            gainNode.gain.exponentialRampToValueAtTime(
                0.0001, start + 0.25
            );

            oscillator.start(start);
            oscillator.stop(start + 0.26);
        }

        if (navigator.vibrate) {
            navigator.vibrate([300, 200, 300]);
        }
    }

    // SAVE SESSION HISTORY
    function saveSession() {

        const history =
            JSON.parse(localStorage.getItem("sessions")) || [];

        history.push({
            date: new Date().toLocaleString(),
            duration: totalSeconds / 60 + " min"
        });

        localStorage.setItem("sessions", JSON.stringify(history));
    }

    // FORMAT TIME
    function formatTime(sec) {

        const m = String(Math.floor(sec / 60)).padStart(2, "0");
        const s = String(sec % 60).padStart(2, "0");

        return `${m}:${s}`;
    }

});
