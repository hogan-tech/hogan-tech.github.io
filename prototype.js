// prototype.js

let count = 0;
const trackButton = document.getElementById("trackButton");
const counterDisplay = document.getElementById("counter");
const logList = document.getElementById("logList");
const clearLogButton = document.getElementById("clearLog");

// Load data from local storage
if (localStorage.getItem("anxietyCount")) {
  count = parseInt(localStorage.getItem("anxietyCount"));
  counterDisplay.textContent = `Today's Anxiety Count: ${count}`;
}

if (localStorage.getItem("anxietyLog")) {
  logList.innerHTML = localStorage.getItem("anxietyLog");
}

// Handle track button click
trackButton.addEventListener("click", function () {
  count++;
  counterDisplay.textContent = `Today's Anxiety Count: ${count}`;

  // Record timestamp
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  const dateString = now.toLocaleDateString();

  const logItem = document.createElement("li");
  logItem.textContent = `${dateString} ${timeString}`;
  logList.prepend(logItem);

  // Save to local storage
  localStorage.setItem("anxietyCount", count);
  localStorage.setItem("anxietyLog", logList.innerHTML);

  // Change button image briefly for visual feedback
  trackButton.style.backgroundImage = "url('./images/duck_pressed.png')";
  setTimeout(() => {
    trackButton.style.backgroundImage = "url('./images/duck_normal.png')";
  }, 200);
});

// Clear log functionality
clearLogButton.addEventListener("click", function () {
  count = 0;
  counterDisplay.textContent = `Today's Anxiety Count: 0`;
  logList.innerHTML = "";

  // Clear local storage
  localStorage.removeItem("anxietyCount");
  localStorage.removeItem("anxietyLog");
});
