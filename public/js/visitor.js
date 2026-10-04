(function () {
    "use strict";
  
    try {
      fetch("/api/visit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({
          page_path:
            window.location.pathname
        }),
        keepalive: true
      }).catch(function (error) {
        console.warn(
          "Visitor tracking error:",
          error
        );
      });
    } catch (error) {
      console.warn(
        "Visitor tracking error:",
        error
      );
    }
  })();