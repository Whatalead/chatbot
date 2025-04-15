/**
 * Chatbot initialization and management
 * Enhanced security and performance
 */
(function initializeChatbot() {
  'use strict';
  
  // DOM Elements
  const elements = {
    chatTitle: document.getElementById("chat-title"),
    chatContainer: document.getElementById("chat-container"),
    chatBody: document.getElementById("chat-window-body"),
    chatSendButton: document.getElementById("chat-send"),
    chatInput: document.getElementById("chat-input"),
    chatCloseButton: document.getElementById("chat-close"),
    chatBubble: document.getElementById("chat-bubble"),
    chatWindow: document.getElementById("chat-window"),
    helpText: document.getElementById("help-text"),
    whatsappContainer: document.getElementById("whatsapp-button-container")
  };
  
  // State management
  const state = {
    isChatOpen: false,
    typingTimeout: null,
    isWaitingForResponse: false
  };

  // Check if all required elements exist
  const requiredElements = [
    "chatTitle", "chatContainer", "chatBody", "chatSendButton", 
    "chatInput", "chatCloseButton", "chatBubble", "chatWindow"
  ];
  
  const missingElements = requiredElements.filter(el => !elements[el]);
  if (missingElements.length > 0) {
    console.error("Missing required elements:", missingElements);
    return; // Abort initialization if elements are missing
  }

  // Apply configuration from ChatbotConfig
  if (typeof ChatbotConfig === 'undefined') {
    console.error("ChatbotConfig is not defined");
    return;
  }
  
  // Initialize UI
  elements.chatTitle.textContent = ChatbotConfig.chatbotName || "Chatbot";
  if (ChatbotConfig.chatbotColorGradient) {
    elements.chatWindow.querySelector("#chat-window-header").style.background = ChatbotConfig.chatbotColorGradient;
  }
  if (elements.helpText && ChatbotConfig.helpText) {
    elements.helpText.textContent = ChatbotConfig.helpText;
  }
  
  // Set bubble icon and style
  elements.chatBubble.innerHTML = "💬";
  
  // Show chat bubble after delay if specified
  setTimeout(() => {
    elements.chatBubble.style.display = "flex";
  }, ChatbotConfig.chatAppearanceDelay || 2000);

  /**
   * Send message to API endpoint
   * @param {string} message - User message to send
   * @returns {Promise} Promise with API response
   */
  async function sendMessageToAPI(message) {
    try {
      // Sanitize inputs - basic XSS protection
      const sanitizedMessage = message.replace(/[<>]/g, '');
      
      const apiUrl = ChatbotConfig.n8nWebhookURL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }
      
      // Prepare data for API
      const apiData = {
        message: sanitizedMessage,
        websiteUrl: window.location.href,
        timestamp: new Date().toISOString()
      };
      
      // Send request
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest" 
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("API communication error:", error);
      throw error;
    }
  }
  
  /**
   * Add message to chat window
   * @param {string} text - Message text
   * @param {string} sender - Message sender ('user' or 'bot')
   */
  function addMessage(text, sender) {
    const message = document.createElement("div");
    message.className = `chat-message ${sender}`;
    message.textContent = text;
    elements.chatBody.appendChild(message);
    elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
  }
  
  /**
   * Add typing indicator
   * @returns {HTMLElement} The created typing indicator element
   */
  function addTypingIndicator() {
    const typingMessage = document.createElement("div");
    typingMessage.className = "chat-message typing";
    typingMessage.innerHTML = `${ChatbotConfig.chatbotName} est en train de taper <span class='dots'><span class='dot'></span><span class='dot'></span><span class='dot'></span></span>`;
    elements.chatBody.appendChild(typingMessage);
    elements.chatBody.scrollTop = elements.chatBody.scrollHeight;
    return typingMessage;
  }
  
  /**
   * Handle user message submission
   */
  async function handleMessageSubmission() {
    const message = elements.chatInput.value.trim();
    if (!message || state.isWaitingForResponse) return;
    
    // Disable input while waiting for response
    elements.chatSendButton.disabled = true;
    elements.chatInput.disabled = true;
    state.isWaitingForResponse = true;
    
    // Display user message
    addMessage(message, "user");
    elements.chatInput.value = "";
    
    // Add typing indicator after a delay
    let typingIndicator = null;
    state.typingTimeout = setTimeout(() => {
      typingIndicator = addTypingIndicator();
    }, 1000);
    
    try {
      const response = await sendMessageToAPI(message);
      
      // Clear typing indicator
      clearTimeout(state.typingTimeout);
      if (typingIndicator && typingIndicator.parentNode) {
        elements.chatBody.removeChild(typingIndicator);
      }
      
      // Display bot response
      const botResponseText = response?.reply || "Désolé, je n'ai pas de réponse pour le moment.";
      addMessage(botResponseText, "bot");
      
      // Notify user if chat is closed
      if (!state.isChatOpen) {
        elements.chatBubble.classList.add("vibrate");
      }
    } catch (error) {
      // Clear typing indicator
      clearTimeout(state.typingTimeout);
      if (typingIndicator && typingIndicator.parentNode) {
        elements.chatBody.removeChild(typingIndicator);
      }
      
      // Display error message
      addMessage("Désolé, un problème est survenu. Veuillez réessayer plus tard.", "bot");
    } finally {
      // Re-enable input
      elements.chatSendButton.disabled = false;
      elements.chatInput.disabled = false;
      state.isWaitingForResponse = false;
    }
  }
  
  /**
   * Open chat window
   */
  function openChat() {
    state.isChatOpen = true;
    elements.chatContainer.style.display = "block";
    elements.chatBubble.style.display = "none";
    elements.chatBubble.classList.remove("vibrate");
    
    // Add initial message if chat body is empty
    if (elements.chatBody.children.length === 0 && ChatbotConfig.initialBotMessage) {
      addMessage(ChatbotConfig.initialBotMessage, "bot");
    }
    
    // Focus input
    setTimeout(() => elements.chatInput.focus(), 300);
  }
  
  /**
   * Close chat window
   */
  function closeChat() {
    state.isChatOpen = false;
    elements.chatContainer.style.display = "none";
    elements.chatBubble.style.display = "flex";
  }
  
  /**
   * Update display based on screen size
   */
  function updateDisplay() {
    const isMobile = window.innerWidth <= 767;
    
    if (isMobile) {
      if (elements.whatsappContainer) elements.whatsappContainer.style.display = "block";
      // On mobile, chat bubble is still visible but chat window is conditionally displayed
      elements.chatBubble.style.display = state.isChatOpen ? "none" : "flex";
    } else {
      if (elements.whatsappContainer) elements.whatsappContainer.style.display = "none";
      // On desktop, follow normal visibility rules
      elements.chatBubble.style.display = state.isChatOpen ? "none" : "flex";
    }
  }
  
  // Event listeners
  elements.chatSendButton.addEventListener("click", handleMessageSubmission);
  elements.chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleMessageSubmission();
    }
  });
  
  elements.chatCloseButton.addEventListener("click", closeChat);
  elements.chatBubble.addEventListener("click", openChat);
  
  // Handle responsive design
  window.addEventListener("resize", updateDisplay);
  
  // Initialize display
  updateDisplay();
  
  // Add initial message
  if (ChatbotConfig.initialBotMessage) {
    setTimeout(() => {
      if (!state.isChatOpen) {
        addMessage(ChatbotConfig.initialBotMessage, "bot");
      }
    }, ChatbotConfig.chatAppearanceDelay || 2000);
  }
})();
