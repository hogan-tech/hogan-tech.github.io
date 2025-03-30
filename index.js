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

// Handle button click
trackButton.addEventListener("click", async function () {
    count++;
    counterDisplay.textContent = `Today's Anxiety Count: ${count}`;

    // Record timestamp
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // "21:36"
    const dayString = now.toISOString().slice(0, 10); // "2025-03-29"

    const logItem = document.createElement("li");
    logItem.textContent = `${dayString} ${timeString}`;
    logList.prepend(logItem);

    // Save to local storage
    // localStorage.setItem("anxietyCount", count);
    // localStorage.setItem("anxietyLog", logList.innerHTML);

    // Send to backend via Axios
    const user = localStorage.getItem("loggedInUser");
    console.log("user : " + user);
    console.log("userName : " + user.userName);
    console.log("day : " + dayString);
    console.log("time : " + timeString);
    if (user.userName) {
        try {
            await axios.post(
                "https://desolate-tor-24628-0ba2463868a2.herokuapp.com/anxiety",
                {
                    userName: user.userName,
                    day: dayString,
                    time: timeString,
                }
            );
        } catch (error) {
            console.error("Failed to send anxiety record:", error);
        }
    } else {
        console.warn("User not logged in");
    }

    // Toggle button image (temporary effect)
    trackButton.style.backgroundImage = "url('./images/duck_pressed.png')";
    setTimeout(() => {
        trackButton.style.backgroundImage = "url('./images/duck_normal.png')";
    }, 200);
});

// Clear log function
clearLogButton.addEventListener("click", function () {
    count = 0;
    counterDisplay.textContent = `Today's Anxiety Count: 0`;
    logList.innerHTML = "";

    // Clear local storage
    localStorage.removeItem("anxietyCount");
    localStorage.removeItem("anxietyLog");
});

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("loggedInUser");
    alert("You have been logged out.");
    window.location.href = "login.html";
});
