$(document).ready(function () {
  // Validate active session; redirect if the user is not authenticated.
  $.get("/api/user_data").then(function (data) {
    if (!data || !data.id) {
      window.location.replace("/login");
    }
  });
});
