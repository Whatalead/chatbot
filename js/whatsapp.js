/**
 * WhatsApp button initialization and management
 * Enhanced security and performance
 */
(function initializeWhatsAppButton() {
  'use strict';
  
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    try {
      const whatsappBtn = document.getElementById("whatsapp-button");
      const whatsappText = document.getElementById("whatsapp-text");
      
      // Check if elements exist and config is available
      if (!whatsappBtn || !whatsappText) {
        console.error("WhatsApp button elements not found");
        return;
      }
      
      if (typeof WhatsAppConfig === 'undefined') {
        console.error("WhatsAppConfig is not defined");
        return;
      }
      
      // Set button text
      whatsappText.textContent = WhatsAppConfig.whatsappButtonText || "Chat on WhatsApp";
      
      // Add click event with security measures
      whatsappBtn.addEventListener("click", function(e) {
        e.preventDefault();
        
        // Sanitize and encode message
        const message = WhatsAppConfig.whatsappMessage || "";
        const sanitizedMessage = message.replace(/[<>]/g, '');
        const encodedMessage = encodeURIComponent(sanitizedMessage);
        
        // Standard WhatsApp phone format validation
        const phone = "33756869856"; // This should ideally come from your configuration
        const phoneRegex = /^\d{8,15}$/; // Basic phone validation
        
        if (!phoneRegex.test(phone)) {
          console.error("Invalid phone number format");
          return;
        }
        
        // Open WhatsApp in new tab with security attributes
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
        const newWindow = window.open(whatsappUrl, "_blank");
        
        // Set security attributes for the new window
        if (newWindow) {
          newWindow.opener = null;
          newWindow.rel = "noopener noreferrer";
        }
      });
      
      // Add privacy-respecting analytics
      whatsappBtn.addEventListener("click", function() {
        // Only if consent given and a privacy-friendly analytics is set up
        if (window.dataLayer && window.consentGiven) {
          window.dataLayer.push({
            'event': 'whatsapp_click',
            'timestamp': new Date().toISOString()
          });
        }
      });
      
    } catch (error) {
      console.error("Error initializing WhatsApp button:", error);
    }
  });
})();
