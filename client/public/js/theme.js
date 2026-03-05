(function() {
  var STORAGE_KEY = "memphis-theme";

  function getPreferredTheme() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }

    return "light";
  }

  function getSavedTheme() {
    var savedTheme = null;
    try {
      savedTheme = window.localStorage.getItem(STORAGE_KEY);
    } catch (_err) {
      savedTheme = null;
    }

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

    return null;
  }

  function saveTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (_err) {
      // Ignore storage errors.
    }
  }

  function applyTheme(theme) {
    var safeTheme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", safeTheme);

    var toggleButton = document.getElementById("themeToggle");
    if (!toggleButton) {
      return;
    }

    var icon = toggleButton.querySelector(".theme-icon");
    var label = toggleButton.querySelector(".theme-label");

    if (safeTheme === "dark") {
      toggleButton.setAttribute("aria-pressed", "true");
      if (icon) {
        icon.textContent = "☾";
      }
      if (label) {
        label.textContent = "Dark Mode";
      }
      return;
    }

    toggleButton.setAttribute("aria-pressed", "false");
    if (icon) {
      icon.textContent = "☼";
    }
    if (label) {
      label.textContent = "Light Mode";
    }
  }

  function toggleTheme() {
    var currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    var nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    saveTheme(nextTheme);
  }

  var initialTheme = getSavedTheme() || getPreferredTheme();
  applyTheme(initialTheme);

  document.addEventListener("DOMContentLoaded", function() {
    applyTheme(getSavedTheme() || document.documentElement.getAttribute("data-theme") || getPreferredTheme());

    var toggleButton = document.getElementById("themeToggle");
    if (toggleButton) {
      toggleButton.addEventListener("click", toggleTheme);
    }
  });
})();
