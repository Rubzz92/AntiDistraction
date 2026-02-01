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
  let totalSeconds = 0;
  let remainingSeconds = 0;
  let paused = false;
  let pomodoro = false;
  let onBreak = false;

  /* Motivational quotes */
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

  /* DARK MODE */
  if (modeToggle) {
    modeToggle.onclick = () => document.body.classList.toggle("dark");
  }

  /* BUTTON EVENTS */
  startBtn.onclick = () => startSession();
  stopBtn.onclick = stopSession;

  pauseBtn.onclick = () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
  };

  pomodoroBtn.onclick = () => {
    pomodoro = true;
    startSession(25);
  };

  /* START SESSION */
  function startSession(minutes) {
    clearInterval(timer);

    const inputTime = minutes || parseInt(document.getElementById("time").value);
    if (!inputTime) return alert("Enter a valid time!");

    totalSeconds = inputTime * 60;
    remainingSeconds = totalSeconds;
    paused = false;
    pauseBtn.textContent = "⏸ Pause";

    // Show focus screen
    focusScreen.classList.add("active");
    document.querySelector(".container").style.display = "none";
    progressBar.style.width = "0%";

    statusText.textContent = pomodoro
      ? "Pomodoro Started 🍅"
      : "Focus Mode Running ⏳";

    updateUI();
    playQuote();
    timer = setInterval(tick, 1000);
    setInterval(playQuote, 60000); // change motivational quote every 1 min
  }

  /* TIMER TICK */
  function tick() {
    if (paused) return;

    remainingSeconds--;

    if (remainingSeconds <= 0) {
      finishSession();
      return;
    }

    updateUI();
  }

  /* UPDATE UI */
  function updateUI() {
    countdown.textContent = formatTime(remainingSeconds);
    const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    progressBar.style.width = `${progress}%`;
  }

  /* FINISH SESSION */
  function finishSession() {
    clearInterval(timer);
    progressBar.style.width = "100%";
    playAlert();
    saveSession();

    if (!pomodoro) {
      alert("Session Complete 🔥");
      stopSession();
      return;
    }

    onBreak = !onBreak;
    startSession(onBreak ? 5 : 25);
  }

  /* STOP SESSION */
  function stopSession() {
    clearInterval(timer);
    focusScreen.classList.remove("active");
    document.querySelector(".container").style.display = "block";
    progressBar.style.width = "0%";
    countdown.textContent = "00:00";
    pomodoro = false;

    statusText.textContent = "Focus Mode OFF ✅";
  }

  /* SOUND */
  function playAlert() {
    new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg").play();
    if (navigator.vibrate) navigator.vibrate([300, 200, 300]);
  }

  /* SAVE HISTORY */
  function saveSession() {
    const history = JSON.parse(localStorage.getItem("sessions")) || [];
    history.push({
      date: new Date().toLocaleString(),
      duration: totalSeconds / 60 + " min"
    });
    localStorage.setItem("sessions", JSON.stringify(history));
  }

  /* TIME FORMAT */
  function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

});
