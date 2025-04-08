<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chatbot Sécurisé</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/whatalead/chatbot/chatbot.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/whatalead/chatbot/whatsapp_button.css">
</head>
<body>
  <div id="chat-container"></div>
  <div id="whatsapp-button-container"></div>

  <script>
    const ChatbotConfig = {
      chatbotName: "Chatbot",
      chatbotColorGradient: "linear-gradient(135deg, #8b72f0, #6154c8)",
      helpText: "Besoin d'aide ?",
      chatAppearanceDelay: 2000,
      initialBotMessage: "Bonjour, vous avez besoin d'aide ou d'information? cordialement",
      n8nWebhookURL: "https://votre-instance-n8n.com/webhook/chatbot",
      whatsappMessage: "Bonjour, je suis intéressé par votre offre !",
      whatsappButtonText: "Des questions ? On y répond sur WhatsApp !"
    };

    // Fonction pour charger le bouton WhatsApp
    function loadWhatsAppButton() {
      fetch("https://cdn.jsdelivr.net/gh/whatalead/chatbot/whatsapp_button.html")
        .then(response => response.text())
        .then(html => {
          const updatedHtml = html
            .replace(/%%WHATSAPP_MESSAGE%%/g, encodeURIComponent(ChatbotConfig.whatsappMessage))
            .replace(/%%WHATSAPP_BUTTON_TEXT%%/g, ChatbotConfig.whatsappButtonText);
          document.getElementById("whatsapp-button-container").innerHTML = updatedHtml;
        })
        .catch(error => console.error("Erreur de chargement du fragment WhatsApp:", error));
    }

    // Détection mobile/desktop et initialisation
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      loadWhatsAppButton();
    } else {
      if (typeof Chatbot !== 'undefined') {
        setTimeout(() => {
          Chatbot.init(ChatbotConfig); // Initialisation du chatbot avec un léger délai
        }, 1000);
      } else {
        console.error("Le script chatbot.min.js n'a pas chargé correctement ou n'expose pas l'objet Chatbot.");
      }
    }
  </script>
  <script src="https://cdn.jsdelivr.net/gh/whatalead/chatbot/chatbot.min.js"></script>
</body>
</html>
