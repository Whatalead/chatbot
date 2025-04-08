(function initializeWhatsAppButton() {
  try {
    const btn = document.getElementById("whatsapp-button");
    if (!btn) return;

    // Lors du clic sur le bouton, ouvrir WhatsApp avec le message configuré
    btn.addEventListener("click", function() {
      const url = "https://wa.me/33756869856?text=" + encodeURIComponent(WhatsAppConfig.whatsappMessage);
      window.open(url, "_blank", "noopener,noreferrer");
    });

    // Mettre à jour le texte affiché à côté du logo WhatsApp
    const span = document.getElementById("whatsapp-text");
    if (span) {
      span.textContent = WhatsAppConfig.whatsappButtonText;
    }
  } catch (e) {
    console.error("Erreur lors de l'initialisation du bouton WhatsApp:", e);
  }
})();
