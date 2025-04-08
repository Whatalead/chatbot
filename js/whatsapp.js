(function initializeWhatsAppButton() {
  try {
    const btn = document.getElementById("whatsapp-button");
    const span = document.getElementById("whatsapp-text");

    if (btn) {
      btn.addEventListener("click", () => {
        const url = "https://wa.me/33756869856?text=" + encodeURIComponent(WhatsAppConfig.whatsappMessage);
        window.open(url, "_blank", "noopener,noreferrer");
      });
    }

    if (span) span.textContent = WhatsAppConfig.whatsappButtonText;
  } catch (e) {
    console.error("Erreur lors de l'initialisation du bouton WhatsApp:", e);
  }
})();
