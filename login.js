$(function () {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (user && user.userName) {
    // User is already logged in, redirect to main page
    window.location.href = "prototype.html";
    return;
  }

  $("#loginForm").on("submit", function (e) {
    e.preventDefault();
    const userName = $("#username").val().trim();
    const password = $("#password").val().trim();

    axios
      .post(`${BACKEND_URL}/users/login`, {
        userName,
        password,
      })
      .then(function (res) {
        // ✅ Store logged-in user info for use on other pages
        localStorage.setItem("loggedInUser", JSON.stringify(res.data));

        $("#message")
          .text("Login successful, redirecting...")
          .css("color", "green");

        setTimeout(function () {
          window.location.href = "./prototype.html"; // Redirect to anxiety tracker page
        }, 1000);
      })
      .catch(function (err) {
        const msg = err.response?.data?.error || "Login failed";
        $("#message").text(msg).css("color", "red");
      });
  });
});
