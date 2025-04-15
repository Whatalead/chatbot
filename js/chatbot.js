document.addEventListener("DOMContentLoaded", () => {
  const chatContainer = document.getElementById("chat-container");
  const chatBubble = document.getElementById("chat-bubble");
  const chatClose = document.getElementById("chat-close");
  const chatTitle = document.getElementById("chat-title");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");
  const chatBody = document.getElementById("chat-window-body");
  const helpText = document.getElementById("help-text");

  chatTitle.textContent = ChatbotConfig.chatbotName;
  helpText.textContent = ChatbotConfig.helpText;

  setTimeout(() => {
    helpText.style.display = "block";
  }, ChatbotConfig.chatAppearanceDelay);

  chatBubble.addEventListener("click", () => {
    chatContainer.style.display = "flex";
    chatBubble.style.display = "none";
    helpText.style.display = "none";
  });

  chatClose.addEventListener("click", () => {
    chatContainer.style.display = "none";
    chatBubble.style.display = "block";
    setTimeout(() => {
      helpText.style.display = "block";
    }, ChatbotConfig.chatAppearanceDelay);
  });

  chatSend.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    const userMessage = document.createElement("div");
    userMessage.classList.add("user-message");
    userMessage.textContent = message;
    chatBody.appendChild(userMessage);

    chatInput.value = "";
    chatBody.scrollTop = chatBody.scrollHeight;

    fetch(ChatbotConfig.n8nWebhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then((response) => response.json())
      .then((data) => {
        const botMessage = document.createElement("div");
        botMessage.classList.add("bot-message");
        botMessage.textContent = data.reply || "Désolé, un problème est survenu. Veuillez réessayer plus tard.";
        chatBody.appendChild(botMessage);
        chatBody.scrollTop = chatBody.scrollHeight;
      })
      .catch(() => {
        const botMessage = document.createElement("div");
        botMessage.classList.add("bot-message");
        botMessage.textContent = "Désolé, un problème est survenu. Veuillez réessayer plus tard.";
        chatBody.appendChild(botMessage);
        chatBody.scrollTop = chatBody.scrollHeight;
      });
  }
});
