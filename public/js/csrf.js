(function() {
  function getCsrfToken() {
    var tokenMeta = document.querySelector('meta[name="csrf-token"]');
    return tokenMeta ? tokenMeta.getAttribute("content") : "";
  }

  window.getCsrfToken = getCsrfToken;

  if (typeof window.$ === "function") {
    $(document).ajaxSend(function(_event, xhr, settings) {
      var method = ((settings && settings.type) || "GET").toUpperCase();
      if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
        return;
      }

      var token = getCsrfToken();
      if (token) {
        xhr.setRequestHeader("x-csrf-token", token);
      }
    });
  }
})();
