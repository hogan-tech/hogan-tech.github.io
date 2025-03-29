$(function () {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (user && user.userName) {
    // If already logged in, redirect to main page
    window.location.href = "prototype.html";
    return;
  }

  $("#registerForm").on("submit", function (e) {
    e.preventDefault();
    const userName = $("#username").val().trim();
    const password = $("#password").val().trim();

    axios
      .post(`${BACKEND_URL}/users/register`, {
        userName,
        password,
      })
      .then(function (res) {
        $("#message")
          .text("Registration successful! Please log in 🦆")
          .css("color", "green");

        setTimeout(function () {
          window.location.href = "./login.html";
        }, 1000);
      })
      .catch(function (err) {
        const msg =
          err.response?.data?.error || "Registration failed. Please try again.";
        $("#message").text(msg).css("color", "red");
      });
  });
});
