(function initializeChatbot() {
  // Appliquer la configuration du titre et du gradient de fond
  const chatTitle = document.getElementById("chat-title");
  if (chatTitle) {
    chatTitle.textContent = ChatbotConfig.chatbotName;
  }
  document.getElementById("chat-container").style.backgroundImage = ChatbotConfig.chatbotColorGradient;

  // Définir le message initial dans la fenêtre de chat
  const chatBody = document.getElementById("chat-window-body");
  if (chatBody) {
    const initMessage = document.createElement("div");
    initMessage.className = "chat-message bot";
    initMessage.textContent = ChatbotConfig.initialBotMessage;
    chatBody.appendChild(initMessage);
  }

  // Gestion de l'envoi de message
  const chatSendButton = document.getElementById("chat-send");
  const chatInput = document.getElementById("chat-input");

  chatSendButton.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message !== "") {
      // Afficher le message de l'utilisateur
      const userMessage = document.createElement("div");
      userMessage.className = "chat-message user";
      userMessage.textContent = message;
      chatBody.appendChild(userMessage);

      // Envoyer le message au webhook n8n
      fetch(ChatbotConfig.n8nWebhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      })
      .then(response => response.json())
      .then(data => {
        // Afficher la réponse du chatbot
        const botMessage = document.createElement("div");
        botMessage.className = "chat-message bot";
        botMessage.textContent = data.reply || "Désolé, une erreur s'est produite.";
        chatBody.appendChild(botMessage);
      })
      .catch(err => {
        console.error("Erreur lors de l'envoi du message:", err);
      });

      chatInput.value = "";
    }
  });

  // Gestion de l'affichage pour mobile
  function updateDisplay() {
    const isMobile = window.innerWidth <= 767;
    const chatContainer = document.getElementById("chat-container");
    const whatsappContainer = document.getElementById("whatsapp-button-container");

    if (chatContainer && whatsappContainer) {
      chatContainer.style.display = isMobile ? "none" : "block";
      whatsappContainer.style.display = isMobile ? "block" : "none";
    }
  }
  window.addEventListener("load", updateDisplay);
  window.addEventListener("resize", updateDisplay);
})();
