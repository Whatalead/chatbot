// chatbot.js
(function(){
  // --- Création dynamique du HTML et du CSS ---
  const widgetHTML = `
    <div id="chat-container">
      <div id="chat-window">
        <div id="chat-window-header">
          <img id="chat-header-avatar" src="" alt="Avatar">
          <div id="header-info">
            <h4 id="chat-title">Chatbot</h4>
            <span id="online-indicator">En ligne</span>
          </div>
          <button id="chat-close" aria-label="Fermer le chat">✕</button>
        </div>
        <div id="chat-window-body" aria-live="polite"></div>
        <div id="chat-window-footer">
          <input type="text" id="chat-input" placeholder="Écrire un message..." aria-label="Votre message" autocomplete="off">
          <button id="chat-send">Envoyer</button>
        </div>
        <div id="chat-footer-info">
          <a href="https://whatalead.app" target="_blank" rel="noopener noreferrer" title="Whatalead">Powered by Whatalead</a>
        </div>
      </div>
    </div>
    <div id="chat-bubble">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
      <div id="notification-badge">1</div>
    </div>
    <div id="help-text">Besoin d'aide ?</div>
    <div id="whatsapp-button-container">
      <button id="whatsapp-button" aria-label="Contacter via WhatsApp">
        <i class="wab-icon"></i>
        <div id="whatsapp-badge">1</div>
      </button>
      <div id="whatsapp-text">Des questions ? Sur WhatsApp !</div>
    </div>
  `;

  const widgetCSS = `
    /* --- Intégration Font Awesome --- */
    @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

    /* === ICÔNE WHATSAPP VIA ::before === */
    #whatsapp-button .wab-icon::before {
      font-family: "Font Awesome 5 Brands";
      content: "\\f232";
    }

    :root {
      --bubble-gradient-start: #007BFF;
      --bubble-gradient-end: #00C6FF;
      --header-gradient-start: #007BFF;
      --header-gradient-end: #00C6FF;
      --header-text-color: #fff;
      --chat-bg-color: #fff;
      --chat-body-bg: #f7f9fc;
      --bot-bubble-bg: #e9ecef;
      --user-bubble-bg: #007BFF;
      --user-bubble-text-color: #fff;
      --chat-border-radius: 12px;
      --bubble-border-radius: 50%;
      --msg-border-radius: 10px;
      --transition-duration: 0.3s;
      --box-shadow-intense: 0 10px 25px rgba(0,0,0,0.12);
      --box-shadow-soft: 0 4px 10px rgba(0,0,0,0.1);
      --whatsapp-green: #25D366;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5; color: #333; }
    #chat-container {
      position: fixed; bottom: 95px; right: 20px;
      width: min(370px, 90vw); height: 520px;
      background: var(--chat-bg-color);
      border-radius: var(--chat-border-radius);
      box-shadow: var(--box-shadow-intense);
      display: none; flex-direction: column; overflow: hidden;
      transition: all var(--transition-duration) ease;
      opacity: 0; transform: translateY(20px) scale(0.95);
      z-index: 2000;
    }
    #chat-container.active {
      display: flex; opacity: 1;
      transform: translateY(0) scale(1);
    }
    #chat-window { display: flex; flex-direction: column; height: 100%; }
    #chat-window-header {
      display: flex; align-items: center; padding: 12px 15px;
      background: linear-gradient(135deg, var(--header-gradient-start), var(--header-gradient-end));
      color: var(--header-text-color);
      border-top-left-radius: var(--chat-border-radius);
      border-top-right-radius: var(--chat-border-radius);
      flex-shrink: 0;
    }
    #chat-header-avatar {
      display: none; width: 36px; height: 36px; margin-right: 12px;
      border-radius: 50%; object-fit: cover;
      border: 2px solid rgba(255,255,255,0.5);
    }
    #header-info { flex-grow: 1; display: flex; flex-direction: column; }
    #chat-window-header h4 { font-size: 1.05rem; font-weight: 600; }
    #online-indicator {
      font-size: 0.8rem; display: flex; align-items: center;
      opacity: 0.85; margin-top: 2px;
    }
    #online-indicator::before {
      content: ""; width: 7px; height: 7px;
      background-color: #34C759; border-radius: 50%;
      margin-right: 5px;
    }
    #chat-close {
      background: none; border: none; font-size: 1.4rem;
      color: var(--header-text-color); cursor: pointer;
      margin-left: 10px; opacity: 0.8; padding: 5px;
      transition: transform 0.2s, opacity 0.2s;
    }
    #chat-close:hover { transform: scale(1.1); opacity: 1; }
    #chat-window-body {
      flex: 1; padding: 15px; overflow-y: auto;
      background: var(--chat-body-bg); display: flex; flex-direction: column;
    }
    .bot-message, .user-message {
      margin: 6px 0; padding: 10px 14px;
      border-radius: var(--msg-border-radius);
      max-width: 85%; line-height: 1.45;
      box-shadow: 0 1px 1px rgba(0,0,0,0.05);
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity:0; transform:translateY(8px); }
      to   { opacity:1; transform:translateY(0); }
    }
    .bot-message {
      background: var(--bot-bubble-bg); align-self: flex-start;
      border-bottom-left-radius: 4px; color: #212529;
    }
    .user-message {
      background: var(--user-bubble-bg); align-self: flex-end;
      border-bottom-right-radius: 4px; color: var(--user-bubble-text-color);
      margin-left: auto;
    }
    #chat-window-footer {
      display: flex; padding: 10px 15px;
      border-top: 1px solid #e0e0e0; background: #fff;
      flex-shrink: 0;
    }
    #chat-input {
      flex:1; padding:10px 15px; border:1px solid #ced4da;
      border-radius:20px; margin-right:10px; outline:none;
      font-size:0.95rem; transition:border-color .3s,box-shadow .3s;
    }
    #chat-input:focus {
      border-color: var(--bubble-gradient-start);
      box-shadow: 0 0 0 3px rgba(0,123,255,0.15);
    }
    #chat-send {
      padding:9px 18px;
      background:linear-gradient(135deg,var(--header-gradient-start),var(--header-gradient-end));
      color:#fff; border:none; border-radius:20px;
      cursor:pointer; font-size:0.95rem; font-weight:500;
      box-shadow:0 2px 4px rgba(0,123,255,0.2);
      transition: all .2s ease-out;
    }
    #chat-send:hover {
      transform: translateY(-1px);
      box-shadow:0 4px 8px rgba(0,123,255,0.25);
    }
    #chat-send:active {
      transform: translateY(0);
      box-shadow:0 1px 2px rgba(0,123,255,0.2);
    }
    #chat-footer-info {
      text-align:center; padding:8px; font-size:11px;
      color:#888; background:#f8f9fa;
      border-bottom-left-radius: var(--chat-border-radius);
      border-bottom-right-radius: var(--chat-border-radius);
    }
    #chat-footer-info a {
      color:#6c757d; text-decoration:none;
      transition: color .2s;
    }
    #chat-footer-info a:hover { color:#0056b3; text-decoration:underline; }
    #chat-bubble {
      display:none; position:fixed; bottom:20px; right:20px;
      width:60px; height:60px; background:linear-gradient(135deg,var(--bubble-gradient-start),var(--bubble-gradient-end));
      border-radius:var(--bubble-border-radius);
      box-shadow:0 5px 15px rgba(0,123,255,0.3);
      cursor:pointer; z-index:3000;
      justify-content:center; align-items:center;
      transition: all var(--transition-duration) ease-out;
    }
    #chat-bubble:hover {
      transform:scale(1.08);
      box-shadow:0 8px 22px rgba(0,123,255,0.35);
    }
    #chat-bubble svg { width:30px; height:30px; fill:var(--header-text-color); }
    #notification-badge {
      display:none; position:absolute; top:-5px; right:-5px;
      width:22px; height:22px; background:#DC3545; color:#fff;
      font-size:12px; text-align:center; line-height:22px;
      border-radius:50%; font-weight:bold;
      box-shadow:0 2px 5px rgba(0,0,0,0.2);
      animation:pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { transform:scale(1); box-shadow:0 2px 5px rgba(0,0,0,0.2); }
      50% { transform:scale(1.1); box-shadow:0 4px 10px rgba(0,0,0,0.3); }
      100% { transform:scale(1); box-shadow:0 2px 5px rgba(0,0,0,0.2); }
    }
    #help-text {
      display:none; position:fixed; bottom:35px; right:95px;
      background:#343a40; color:#fff; padding:9px 15px;
      border-radius:8px; font-size:13px; z-index:2500;
      box-shadow: var(--box-shadow-soft);
      animation:fadeInHelp 0.5s ease-out; white-space:nowrap;
    }
    @keyframes fadeInHelp {
      from { opacity:0; transform:translateX(15px); }
      to   { opacity:1; transform:translateX(0); }
    }
    .typing-indicator .dot {
      display:inline-block; width:6px; height:6px;
      border-radius:50%; background-color:rgba(0,0,0,0.4);
      margin:0 2px; animation:typingDots 1.2s infinite ease-in-out;
    }
    .typing-indicator .dot:nth-child(2) { animation-delay:0.2s; }
    .typing-indicator .dot:nth-child(3) { animation-delay:0.4s; }
    @keyframes typingDots {
      0%,60%,100% { transform:translateY(0); }
      30% { transform:translateY(-4px); }
    }
    #whatsapp-button-container {
      display:none; position:fixed; bottom:20px; right:20px;
      z-index:3000; flex-direction:row-reverse; align-items:center;
    }
    #whatsapp-text {
      display:none; background:#fff; color:#333;
      padding:9px 14px; border-radius:8px; font-size:13px;
      margin-right:12px; box-shadow:0 2px 8px rgba(0,0,0,0.15);
      animation:fadeInHelp 0.5s ease; white-space:nowrap;
    }
    #whatsapp-button {
      background-color: var(--whatsapp-green); border:none;
      width:60px; height:60px; border-radius:50%; cursor:pointer;
      position:relative; display:flex; align-items:center;
      justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
    }
    #whatsapp-button:hover {
      transform:scale(1.05); box-shadow:0 6px 16px rgba(0,0,0,0.2);
    }
    #whatsapp-badge {
      display:none; position:absolute; top:-5px; right:-5px;
      width:22px; height:22px; background:#DC3545; color:#fff;
      font-size:12px; text-align:center; line-height:22px;
      border-radius:50%; font-weight:bold;
      box-shadow:0 2px 5px rgba(0,0,0,0.2);
      animation:pulse 1.5s infinite;
    }
  `;

  // Injecter le CSS
  const styleTag = document.createElement('style');
  styleTag.textContent = widgetCSS;
  document.head.appendChild(styleTag);

  // Injecter le HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = widgetHTML;
  document.body.appendChild(wrapper);

  // --- Fonctions utilitaires ---
  function debounce(fn, wait) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function loadChatHistory() {
    const h = sessionStorage.getItem('chatHistory');
    return h ? JSON.parse(h) : [];
  }
  function saveChatHistory(h) {
    sessionStorage.setItem('chatHistory', JSON.stringify(h));
  }

  async function initializeChatSession(url) {
    let cid = sessionStorage.getItem('websiteConvId');
    const p = { current_webpage: window.location.href };
    if (cid) p.websiteConvId = cid;
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      if (r.ok) {
        const d = await r.json();
        if (!cid && d.websiteConvId) {
          cid = d.websiteConvId;
          sessionStorage.setItem('websiteConvId', cid);
        }
      } else {
        console.error('Init HTTP error', r.status);
      }
    } catch (e) {
      console.error('Init exception', e);
    }
    return cid;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // Références DOM
    const chatContainer        = document.getElementById("chat-container");
    const chatBubble           = document.getElementById("chat-bubble");
    const chatClose            = document.getElementById("chat-close");
    const chatTitle            = document.getElementById("chat-title");
    const chatAvatar           = document.getElementById("chat-header-avatar");
    const chatBody             = document.getElementById("chat-window-body");
    const chatInput            = document.getElementById("chat-input");
    const chatSend             = document.getElementById("chat-send");
    const helpText             = document.getElementById("help-text");
    const notificationBadge    = document.getElementById("notification-badge");
    const whatsappContainer    = document.getElementById("whatsapp-button-container");
    const whatsappText         = document.getElementById("whatsapp-text");
    const whatsappButton       = document.getElementById("whatsapp-button");
    const whatsappBadge        = document.getElementById("whatsapp-badge");

    let conversationId = null;
    let chatHistory    = [];
    let activeMode     = 'none';
    let helpTimers     = {};
    let waTimers       = {};

    // Déterminer le mode
    if (window.GlobalConfig.enableChatbot && window.GlobalConfig.enableWhatsApp) activeMode = 'both';
    else if (window.GlobalConfig.enableChatbot) activeMode = 'chatbot_only';
    else if (window.GlobalConfig.enableWhatsApp) activeMode = 'whatsapp_only';

    // Initialiser la session chatbot
    if (activeMode === 'chatbot_only' || activeMode === 'both') {
      conversationId = await initializeChatSession(window.ChatbotUIConfig.initialWebhookURL);
      chatHistory = loadChatHistory();
    }

    // Initialisation UI Chatbot
    function initChatbotUI(){
      if (chatTitle && window.ChatbotUIConfig.chatbotName) {
        chatTitle.textContent = window.ChatbotUIConfig.chatbotName;
      }
      if (chatAvatar && window.ChatbotUIConfig.avatarURL) {
        chatAvatar.src = window.ChatbotUIConfig.avatarURL;
        chatAvatar.style.display = 'block';
      }
      if (helpText && window.ChatbotUIConfig.helpText) {
        helpText.textContent = window.ChatbotUIConfig.helpText;
      }
      if (notificationBadge && window.ChatbotUIConfig.badgeContent) {
        notificationBadge.textContent = window.ChatbotUIConfig.badgeContent;
      }
    }

    // Initialisation UI WhatsApp
    function initWhatsAppUI(){
      if (whatsappText && window.WhatsAppUIConfig.whatsappHelpText) {
        whatsappText.textContent = window.WhatsAppUIConfig.whatsappHelpText;
      }
      if (whatsappBadge && window.WhatsAppUIConfig.whatsappBadgeContent) {
        whatsappBadge.textContent = window.WhatsAppUIConfig.whatsappBadgeContent;
      }
    }

    // Gestion des timers
    function clearTimers(){
      Object.values(helpTimers).forEach(clearTimeout);
      Object.values(waTimers).forEach(clearTimeout);
      helpTimers = {}; waTimers = {};
    }

    function runChatbotTimers(){
      clearTimers();
      if (!helpText || !notificationBadge || !window.ChatbotUIConfig.helpText) return;
      helpTimers.show = setTimeout(() => {
        helpText.style.display = 'block';
        notificationBadge.style.display = 'block';
        if (window.ChatbotUIConfig.helpTextDisplayDuration > 0) {
          helpTimers.hide = setTimeout(
            () => helpText.style.display = 'none',
            window.ChatbotUIConfig.helpTextDisplayDuration
          );
        }
      }, window.ChatbotUIConfig.helpTextDelay);
    }

    function runWhatsAppTimers(){
      clearTimers();
      if (!whatsappText || !whatsappBadge || !window.WhatsAppUIConfig.whatsappHelpText) return;
      waTimers.show = setTimeout(() => {
        whatsappText.style.display = 'block';
        whatsappBadge.style.display = 'block';
        if (window.WhatsAppUIConfig.whatsappHelpDisplayDuration > 0) {
          waTimers.hide = setTimeout(
            () => whatsappText.style.display = 'none',
            window.WhatsAppUIConfig.whatsappHelpDisplayDuration
          );
        }
      }, window.WhatsAppUIConfig.whatsappHelpDelay);
    }

    // Affichage / masquage des widgets
    function updateWidgetVisibility(){
      const isMobile = window.innerWidth <= 600;
      [chatBubble, whatsappContainer].forEach(el => el && (el.style.display = 'none'));
      [helpText, notificationBadge, whatsappText, whatsappBadge].forEach(el => el && (el.style.display = 'none'));

      if (activeMode === 'chatbot_only') {
        initChatbotUI();
        chatBubble && (chatBubble.style.display = 'flex');
        runChatbotTimers();
      } else if (activeMode === 'whatsapp_only') {
        initWhatsAppUI();
        whatsappContainer && (whatsappContainer.style.display = 'flex');
        runWhatsAppTimers();
      } else if (activeMode === 'both') {
        initChatbotUI();
        initWhatsAppUI();
        if (isMobile) {
          whatsappContainer && (whatsappContainer.style.display = 'flex');
          runWhatsAppTimers();
        } else {
          chatBubble && (chatBubble.style.display = 'flex');
          runChatbotTimers();
        }
      } else {
        clearTimers();
      }

      if (isMobile && chatContainer && chatContainer.classList.contains('active')) {
        chatContainer.classList.remove('active');
        chatContainer.style.display = 'none';
      }
    }

    // Fonctions de chat
    function scrollToBottom(){
      setTimeout(() => {
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
      }, 50);
    }
    function appendMessage(text, type){
      if (!chatBody) return;
      const d = document.createElement('div');
      d.className = type === 'user' ? 'user-message' : 'bot-message';
      d.textContent = text;
      chatBody.appendChild(d);
      scrollToBottom();
    }
    function showTyping(){
      if (!chatBody || chatBody.querySelector('.typing-indicator')) return;
      const d = document.createElement('div');
      d.className = 'bot-message typing-indicator';
      d.innerHTML = '<span class="dot"></span>'.repeat(3);
      chatBody.appendChild(d);
      scrollToBottom();
    }
    function removeTyping(){
      const ind = chatBody && chatBody.querySelector('.typing-indicator');
      if (ind) chatBody.removeChild(ind);
    }
    function populateHistory(){
      if (!chatBody) return;
      chatBody.innerHTML = '';
      if (chatHistory.length === 0) {
        appendMessage('Bonjour…', 'bot');
      } else {
        chatHistory.forEach(m => appendMessage(m.text, m.type));
      }
    }
    async function sendMessage(){
      if (!conversationId) {
        return appendMessage('Erreur session.', 'bot');
      }
      const txt = chatInput.value.trim();
      if (!txt) return;
      appendMessage(txt, 'user');
      chatHistory.push({ type: 'user', text: txt });
      saveChatHistory(chatHistory);
      chatInput.value = '';
      showTyping();

      try {
        const res = await fetch(window.ChatbotUIConfig.messageWebhookURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: txt,
            websiteConvId: conversationId,
            current_webpage: window.location.href
          })
        });
        if (!res.ok) throw new Error(res.statusText);
        const d = await res.json();
        removeTyping();
        const reply = d.reply || d.message || '...';
        appendMessage(reply, 'bot');
        chatHistory.push({ type: 'bot', text: reply });
        saveChatHistory(chatHistory);
      } catch (e) {
        console.error(e);
        removeTyping();
        appendMessage('Erreur tech.', 'bot');
        chatHistory.push({ type: 'bot', text: 'Erreur tech.' });
        saveChatHistory(chatHistory);
      }
    }

    // Écouteurs d’événements
    window.addEventListener('resize', debounce(updateWidgetVisibility, 250));
    updateWidgetVisibility();

    if (chatBubble) chatBubble.addEventListener('click', () => {
      clearTimers();
      helpText && (helpText.style.display = 'none');
      notificationBadge && (notificationBadge.style.display = 'none');
      populateHistory();
      chatContainer && (chatContainer.style.display = 'flex');
      setTimeout(() => chatContainer.classList.add('active'), 10);
      chatBubble.style.display = 'none';
      setTimeout(() => chatInput && chatInput.focus(), 300);
    });
    if (chatClose) chatClose.addEventListener('click', () => {
      chatContainer && chatContainer.classList.remove('active');
      setTimeout(() => {
        chatContainer && (chatContainer.style.display = 'none');
        updateWidgetVisibility();
      }, 300);
    });
    if (chatSend) chatSend.addEventListener('click', sendMessage);
    if (chatInput) chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    if (whatsappButton) whatsappButton.addEventListener('click', () => {
      clearTimers();
      whatsappText && (whatsappText.style.display = 'none');
      whatsappBadge && (whatsappBadge.style.display = 'none');
      const url = `https://wa.me/?text=${encodeURIComponent(window.WhatsAppUIConfig.whatsappMessage || '')}`;
      window.open(url, '_blank');
    });
  });
})();
