
(function () {
  "use strict";

  if (document.getElementById("ttt-chatbot")) return;

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "/css/chatbot.css";
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "ttt-chatbot";
  root.innerHTML = `
    <button class="ttt-chat-launcher" type="button"
      aria-label="Mở trợ lý Trung Tử Tế" aria-expanded="false">
      <span class="ttt-chat-launcher-icon">✦</span>
      <span class="ttt-chat-launcher-label">Tư vấn robot</span>
    </button>

    <section class="ttt-chat-panel" role="dialog"
      aria-label="Trợ lý Trung Tử Tế" aria-modal="false" hidden>
      <header class="ttt-chat-header">
        <div class="ttt-chat-avatar">TT</div>
        <div class="ttt-chat-heading">
          <strong>Trợ lý Trung Tử Tế</strong>
          <span>Chuyên robot lau nhà</span>
        </div>
        <button class="ttt-chat-close" type="button"
          aria-label="Đóng khung chat">×</button>
      </header>

      <div class="ttt-chat-messages" aria-live="polite">
        <div class="ttt-chat-bubble ttt-chat-bot">
          Chào bạn! Mình có thể tư vấn chọn robot lau nhà,
          tra cứu thông số và hỗ trợ các vấn đề kỹ thuật cơ bản.
          Bạn đang cần hỗ trợ điều gì?
        </div>
      </div>

      <div class="ttt-chat-suggestions">
        <button type="button" data-question="Tư vấn chọn robot theo nhu cầu">Chọn robot</button>
        <button type="button" data-question="Tôi muốn so sánh các mẫu robot hiện có">So sánh robot</button>
        <button type="button" data-question="Tôi cần hỗ trợ kiểm tra lỗi robot lau nhà">Hỗ trợ kỹ thuật</button>
      </div>

      <form class="ttt-chat-form">
        <label class="ttt-chat-sr-only" for="ttt-chat-input">Tin nhắn</label>
        <textarea id="ttt-chat-input" rows="1" maxlength="2000"
          placeholder="Nhập câu hỏi của bạn..." required></textarea>
        <button class="ttt-chat-send" type="submit" aria-label="Gửi tin nhắn">➤</button>
      </form>
      <div class="ttt-chat-footnote">Thông tin kỹ thuật cần được xác nhận khi kiểm tra thực tế.</div>
    </section>
  `;

  document.body.appendChild(root);

  const launcher = root.querySelector(".ttt-chat-launcher");
  const panel = root.querySelector(".ttt-chat-panel");
  const closeButton = root.querySelector(".ttt-chat-close");
  const messages = root.querySelector(".ttt-chat-messages");
  const form = root.querySelector(".ttt-chat-form");
  const input = root.querySelector("#ttt-chat-input");
  const sendButton = root.querySelector(".ttt-chat-send");
  const suggestions = root.querySelector(".ttt-chat-suggestions");

  const history = [];
  let sending = false;

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));

    if (open) {
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  }


  function renderMarkdownSafe(container, text) {
    container.replaceChildren();
    const lines = String(text || "").split(/\r?\n/);
    let list = null;

    function flushList() {
      if (list) {
        container.appendChild(list);
        list = null;
      }
    }

    function appendInline(parent, value) {
      const pattern = /(\*\*[^*]+\*\*|(?<!\*)\*[^*\n]+\*(?!\*)|`[^`\n]+`)/g;
      let lastIndex = 0;
      let match;

      while ((match = pattern.exec(value)) !== null) {
        parent.appendChild(
          document.createTextNode(value.slice(lastIndex, match.index))
        );

        const token = match[0];
        const content = token.startsWith("**")
          ? token.slice(2, -2)
          : token.slice(1, -1);

        const element = document.createElement(
          token.startsWith("**") ? "strong" :
          token.startsWith("`") ? "code" : "em"
        );

        element.textContent = content;
        parent.appendChild(element);
        lastIndex = pattern.lastIndex;
      }

      parent.appendChild(document.createTextNode(value.slice(lastIndex)));
    }

    lines.forEach(function (line) {
      const trimmed = line.trim();
      const item = trimmed.match(/^[-•]\s+(.+)$/);

      if (item) {
        if (!list) {
          list = document.createElement("ul");
        }

        const li = document.createElement("li");
        appendInline(li, item[1]);
        list.appendChild(li);
        return;
      }

      flushList();

      if (!trimmed) {
        container.appendChild(document.createElement("br"));
        return;
      }

      const paragraph = document.createElement("div");
      appendInline(paragraph, line);
      container.appendChild(paragraph);
    });

    flushList();
  }

  function addBubble(text, type) {
    const bubble = document.createElement("div");
    bubble.className = "ttt-chat-bubble " +
      (type === "user" ? "ttt-chat-user" : "ttt-chat-bot");

    if (type === "user") {
      bubble.textContent = text;
    } else {
      renderMarkdownSafe(bubble, text);
    }

    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }


  function addContactOptions(bubble) {
    bubble.textContent =
      "Xin lỗi bạn, trợ lý tư vấn tự động hiện đang tạm thời chưa thể phản hồi. " +
      "Bạn có thể chọn một cách dưới đây để được Trung Tử Tế hỗ trợ trực tiếp.";

    const links = [
      {
        label: "📞 Gọi 0905 191 099",
        href: "tel:0905191099"
      },
      {
        label: "💬 Nhắn Facebook",
        href: "https://www.facebook.com/robotlaunhadaklak"
      },
      {
        label: "💙 Liên hệ Zalo",
        href: "https://zalo.me/0905191099"
      }
    ];

    const options = document.createElement("div");
    options.className = "ttt-chat-contact-options";

    links.forEach(function (item) {
      const link = document.createElement("a");
      link.className = "ttt-chat-contact-link";
      link.href = item.href;
      link.textContent = item.label;

      if (item.href.startsWith("https://")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }

      options.appendChild(link);
    });

    bubble.appendChild(document.createElement("br"));
    bubble.appendChild(options);
  }

  function setSending(value) {
    sending = value;
    sendButton.disabled = value;
    input.disabled = value;
    sendButton.textContent = value ? "…" : "➤";
  }

  async function sendMessage(rawText) {
    const message = String(rawText || "").trim();

    if (!message || sending || message.length > 2000) return;

    setOpen(true);
    addBubble(message, "user");
    input.value = "";
    setSending(true);

    const waiting = addBubble("Mình đang xem thông tin để trả lời…", "bot");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: history.slice(-8)
        })
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
      }


if (!response.ok || !data.ok || !data.reply) {
  if (data.error === "AI_UNAVAILABLE") {
    addContactOptions(waiting);
    waiting.classList.add("ttt-chat-error");
    return;
  }

  throw new Error(data.error || "Chưa thể trả lời lúc này.");
}


renderMarkdownSafe(waiting, data.reply);
      history.push(
        { role: "user", text: message },
        { role: "model", text: data.reply }
      );

      if (history.length > 8) {
        history.splice(0, history.length - 8);
      }
    } catch (error) {
      waiting.textContent =
        (error && error.message) ||
        "Không thể kết nối trợ lý. Bạn vui lòng thử lại.";
      waiting.classList.add("ttt-chat-error");
    } finally {
      setSending(false);
      input.focus();
    }
  }

  launcher.addEventListener("click", function () {
    setOpen(panel.hidden);
  });

  closeButton.addEventListener("click", function () {
    setOpen(false);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  suggestions.addEventListener("click", function (event) {
    const button = event.target.closest("[data-question]");
    if (!button || sending) return;

    suggestions.hidden = true;
    sendMessage(button.dataset.question);
  });
})();
