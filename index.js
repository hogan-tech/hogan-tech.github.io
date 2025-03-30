let todayCount = 0;
let weekCount = 0;

const trackButton = document.getElementById("trackButton");
const duckImage = document.getElementById("duckImage");
const todayCountDisplay = document.getElementById("todayCount");
const weekCountDisplay = document.getElementById("weekCount");

// Load counts from localStorage
if (localStorage.getItem("todayCount")) {
    todayCount = parseInt(localStorage.getItem("todayCount"));
    todayCountDisplay.textContent = todayCount;
}
if (localStorage.getItem("weekCount")) {
    weekCount = parseInt(localStorage.getItem("weekCount"));
    weekCountDisplay.textContent = weekCount;
}

// Click event
trackButton.addEventListener("click", async () => {
    todayCount++;
    weekCount++;

    todayCountDisplay.textContent = todayCount;
    weekCountDisplay.textContent = weekCount;

    localStorage.setItem("todayCount", todayCount);
    localStorage.setItem("weekCount", weekCount);

    // Animate duck image
    duckImage.src = "./images/duck_pressed.png";
    setTimeout(() => {
        duckImage.src = "./images/duck_normal.png";
    }, 200);

    // Log and send to backend
    const now = new Date();
    const dayString = now.toISOString().slice(0, 10);
    const timeString = now.toTimeString().slice(0, 5);
    const user = JSON.parse(localStorage.getItem("loggedInUser"));

    if (user?.userName) {
        try {
            await axios.post(
                "https://desolate-tor-24628-0ba2463868a2.herokuapp.com/anxiety",
                {
                    userName: user.userName,
                    day: dayString,
                    time: timeString,
                }
            );
        } catch (err) {
            console.error("Failed to send record:", err);
        }
    }
});
