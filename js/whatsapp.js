document.addEventListener("DOMContentLoaded", () => {
  const whatsappButton = document.getElementById("whatsapp-button");
  const whatsappText = document.getElementById("whatsapp-text");

  whatsappText.textContent = WhatsAppConfig.whatsappButtonText;

  setTimeout(() => {
    whatsappText.style.display = "block";
  }, 2000);

  whatsappButton.addEventListener("click", () => {
    const url = `https://wa.me/?text=${encodeURIComponent(WhatsAppConfig.whatsappMessage)}`;
    window.open(url, "_blank");
  });
});
