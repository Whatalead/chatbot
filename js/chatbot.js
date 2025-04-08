(function initializeChatbot() {
  const chatTitle = document.getElementById("chat-title");
  const chatContainer = document.getElementById("chat-container");
  const chatBody = document.getElementById("chat-window-body");
  const chatSendButton = document.getElementById("chat-send");
  const chatInput = document.getElementById("chat-input");
  const whatsappContainer = document.getElementById("whatsapp-button-container");

  // Appliquer la configuration
  if (chatTitle) chatTitle.textContent = ChatbotConfig.chatbotName;
  if (chatContainer) chatContainer.style.backgroundImage = ChatbotConfig.chatbotColorGradient;

  // Message initial
  if (chatBody) {
    const initMessage = document.createElement("div");
    initMessage.className = "chat-message bot";
    initMessage.textContent = ChatbotConfig.initialBotMessage;
    chatBody.appendChild(initMessage);
  }

  // Gestion de l'envoi de message
  if (chatSendButton && chatInput) {
    chatSendButton.addEventListener("click", () => {
      const message = chatInput.value.trim();
      if (message) {
        const userMessage = document.createElement("div");
        userMessage.className = "chat-message user";
        userMessage.textContent = message;
        chatBody.appendChild(userMessage);

        fetch(ChatbotConfig.n8nWebhookURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message })
        })
          .then(response => response.json())
          .then(data => {
            const botMessage = document.createElement("div");
            botMessage.className = "chat-message bot";
            botMessage.textContent = data.reply || "Désolé, une erreur s'est produite.";
            chatBody.appendChild(botMessage);
            chatBody.scrollTop = chatBody.scrollHeight; // Défilement automatique
          })
          .catch(err => console.error("Erreur lors de l'envoi du message:", err));

        chatInput.value = "";
      }
    });
  }

  // Gestion responsive
  function updateDisplay() {
    const isMobile = window.innerWidth <= 767;
    if (chatContainer && whatsappContainer) {
      chatContainer.style.display = isMobile ? "none" : "block";
      whatsappContainer.style.display = isMobile ? "block" : "none";
    }
  }

  window.addEventListener("load", updateDisplay);
  window.addEventListener("resize", updateDisplay);
})();
