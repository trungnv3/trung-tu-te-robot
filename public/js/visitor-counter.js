(function () {
    "use strict";
  
    async function loadVisitorCounter() {
      try {
        const response = await fetch(
          "/api/site-stats",
          {
            method: "GET"
          }
        );
  
        const data =
          await response.json();
  
        if (!response.ok || !data.ok) {
          return;
        }
  
        const count =
          Number(data.total_views || 0);
  
        const element =
          document.getElementById(
            "visitor-counter-number"
          );
  
        if (!element) {
          return;
        }
  
        element.textContent =
          count.toLocaleString("vi-VN");
  
      } catch (error) {
        console.warn(
          "Visitor counter error:",
          error
        );
      }
    }
  
    if (
      document.readyState === "loading"
    ) {
      document.addEventListener(
        "DOMContentLoaded",
        loadVisitorCounter
      );
    } else {
      loadVisitorCounter();
    }
  })();