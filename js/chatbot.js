(function initializeChatbot() {
  const chatTitle = document.getElementById("chat-title");
  const chatContainer = document.getElementById("chat-container");
  const chatBody = document.getElementById("chat-window-body");
  const chatSendButton = document.getElementById("chat-send");
  const chatInput = document.getElementById("chat-input");
  const whatsappContainer = document.getElementById("whatsapp-button-container");
  const chatCloseButton = document.getElementById("chat-close");
  const chatBubble = document.getElementById("chat-bubble");
  const chatWindow = document.getElementById("chat-window");

  let isChatOpen = true;

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

  // Gestion de l'ouverture/fermeture du chat
  if (chatCloseButton && chatBubble && chatWindow) {
    chatBubble.textContent = "💬"; // Icône simple pour le bubble
    chatCloseButton.addEventListener("click", () => {
      isChatOpen = false;
      chatWindow.style.display = "none";
      chatBubble.style.display = "block";
    });

    chatBubble.addEventListener("click", () => {
      isChatOpen = true;
      chatWindow.style.display = "block";
      chatBubble.style.display = "none";
      chatBubble.classList.remove("vibrate"); // Réinitialiser la vibration
    });
  }

  // Gestion de l'envoi de message
  if (chatSendButton && chatInput) {
    chatSendButton.addEventListener("click", async () => {
      const message = chatInput.value.trim();
      if (message) {
        // Afficher le message de l'utilisateur
        const userMessage = document.createElement("div");
        userMessage.className = "chat-message user";
        userMessage.textContent = message;
        chatBody.appendChild(userMessage);
        chatBody.scrollTop = chatBody.scrollHeight;

        // Attendre 5 secondes avant d'afficher les 3 points
        const typingMessage = document.createElement("div");
        typingMessage.className = "chat-message typing";
        let timeoutId = setTimeout(() => {
          typingMessage.innerHTML = "Bot est en train de taper <span class='dots'><span class='dot'></span><span class='dot'></span><span class='dot'></span></span>";
          chatBody.appendChild(typingMessage);
          chatBody.scrollTop = chatBody.scrollHeight;
        }, 5000);

        try {
          // Préparer les données pour l'API
          const apiData = {
            original_url: "https://webhook.site/a07b054d-90e0-4f63-90e8-636ed414ad35",
            body: {
              message: message,
              websiteConvId: "yzrehfzehrfiozrhfzeh567hierhf"
            }
          };

          // Envoyer le message à l'API
          const response = await fetch("https://api.whatalead.app/webhook/b5df6c14-6e2e-433b-b8a9-9dfb0d871560", {
            method: "POST",
            headers: { "Content-Type":    "application/json" },
            body: JSON.stringify(apiData)
          });

          const data = await response.json();

          // Annuler le timeout si la réponse arrive avant 5 secondes
          clearTimeout(timeoutId);
          if (typingMessage.parentNode) chatBody.removeChild(typingMessage);

          // Afficher la réponse du bot
          const botMessage = document.createElement("div");
          botMessage.className = "chat-message bot";
          botMessage.textContent = data.reply || "Désolé, je n'ai pas de réponse.";
          chatBody.appendChild(botMessage);
          chatBody.scrollTop = chatBody.scrollHeight;

          // Notification si le chat est fermé
          if (!isChatOpen && chatBubble) {
            chatBubble.classList.add("vibrate");
          }
        } catch (err) {
          clearTimeout(timeoutId);
          if (typingMessage.parentNode) chatBody.removeChild(typingMessage);
          const errorMessage = document.createElement("div");
          errorMessage.className = "chat-message bot";
          errorMessage.textContent = "Erreur : impossible de contacter le serveur.";
          chatBody.appendChild(errorMessage);
          chatBody.scrollTop = chatBody.scrollHeight;
          console.error("Erreur lors de l'envoi du message:", err);
        }

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
    } else {
      console.error("Erreur : chatContainer ou whatsappContainer non trouvé(s)");
    }
  }

  window.addEventListener("load", updateDisplay);
  window.addEventListener("resize", updateDisplay);
})();
