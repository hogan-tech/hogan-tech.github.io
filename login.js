$(function () {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user && user.userName) {
        // The user is already logged in, redirect to the main page
        console.log("user : " + user);
        setTimeout(() => {}, 8000);
        window.location.href = "index.html";
        return;
    }
    $("#loginForm").on("submit", function (e) {
        e.preventDefault();
        const userName = $("#username").val().trim();
        const password = $("#password").val().trim();

        axios
            .post(
                "https://desolate-tor-24628-0ba2463868a2.herokuapp.com/users/login",
                {
                    userName,
                    password,
                }
            )
            .then(function (res) {
                // ✅ Store the logged-in user's information (for use on other pages)
                localStorage.setItem("loggedInUser", JSON.stringify(res.data));
                const userName = localStorage.getItem("loggedInUser");
                console.log("userName : " + userName);

                $("#message")
                    .text("Login successful, redirecting...")
                    .css("color", "green");

                setTimeout(function () {
                    window.location.href = "./prototype.html"; // Redirect to the anxiety tracking page
                }, 8000);
            })
            .catch(function (err) {
                const msg = err.response?.data?.error || "Login failed";
                $("#message").text(msg).css("color", "red");
            });
    });
});
