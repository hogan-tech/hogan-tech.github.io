if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js")
            .then((registration) => {
                console.log(
                    "ServiceWorker registration successful with scope: ",
                    registration.scope
                );
            })
            .catch((error) => {
                console.log("ServiceWorker registration failed: ", error);
            });
    });
}

let todayCount = 0;
let weekCount = 0;

const trackButton = document.getElementById("trackButton");
const duckImage = document.getElementById("duckImage");
const todayCountDisplay = document.getElementById("todayCount");
const weekCountDisplay = document.getElementById("weekCount");

try {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const userName = user.userName;
    const today = new Date().toISOString().slice(0, 10);
    // Fetch today's count
    const todayRes = await axios.get(
        `https://desolate-tor-24628-0ba2463868a2.herokuapp.com/anxiety/today?userName=${userName}&day=${today}`
    );
    todayCount = todayRes.data.count || 0;
    todayCountDisplay.textContent = todayCount;

    // Fetch 7 days' count
    const weekRes = await axios.get(
        `https://desolate-tor-24628-0ba2463868a2.herokuapp.com/anxiety/sevenDays?userName=${userName}&day=${today}`
    );
    weekCount = weekRes.data.count || 0;
    weekCountDisplay.textContent = weekCount;
} catch (error) {
    console.error("Failed to load anxiety data:", error);
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

document.getElementById("logoutBtn").addEventListener("click", () => {
    // For example, remove the token and redirect to the login page
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
});

document.getElementById("analysisBtn").addEventListener("click", () => {
    // For example, remove the token and redirect to the login page
    window.location.href = "analysis.html";
});
