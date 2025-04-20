// chatbot.js
(function() {
  /***********************************************
   * 1) INJECTION DU CSS
   ***********************************************/
  const css = `
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
      display: none;
      position: fixed;
      bottom: 95px;
      right: 20px;
      width: min(370px, 90vw);
      height: 520px;
      background: var(--chat-bg-color);
      border-radius: var(--chat-border-radius);
      box-shadow: var(--box-shadow-intense);
      z-index: 2000;
      flex-direction: column;
      overflow: hidden;
      transition: all var(--transition-duration) ease;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    #chat-container.active {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    #chat-window { display: flex; flex-direction: column; height: 100%; }
    #chat-window-header {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      background: linear-gradient(135deg, var(--header-gradient-start), var(--header-gradient-end));
      color: var(--header-text-color);
      border-top-left-radius: var(--chat-border-radius);
      border-top-right-radius: var(--chat-border-radius);
      flex-shrink: 0;
    }
    #chat-header-avatar {
      display: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      margin-right: 12px;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.5);
    }
    #header-info { flex-grow: 1; display: flex; flex-direction: column; }
    #chat-window-header h4 { font-size: 1.05rem; font-weight: 600; line-height: 1.2; }
    #online-indicator {
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      opacity: 0.85;
      margin-top: 2px;
    }
    #online-indicator::before {
      content: "";
      display: inline-block;
      width: 7px;
      height: 7px;
      background-color: #34C759;
      border-radius: 50%;
      margin-right: 5px;
    }
    #chat-close {
      background: none;
      border: none;
      font-size: 1.4rem;
      color: var(--header-text-color);
      cursor: pointer;
      transition: transform 0.2s, opacity 0.2s;
      padding: 5px;
      margin-left: 10px;
      opacity: 0.8;
    }
    #chat-close:hover { transform: scale(1.1); opacity: 1; }
    #chat-window-body {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      background: var(--chat-body-bg);
      display: flex;
      flex-direction: column;
    }
    .bot-message, .user-message {
      margin: 6px 0;
      padding: 10px 14px;
      border-radius: var(--msg-border-radius);
      max-width: 85%;
      line-height: 1.45;
      box-shadow: 0 1px 1px rgba(0,0,0,0.05);
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .bot-message {
      background: var(--bot-bubble-bg);
      align-self: flex-start;
      color: #212529;
      border-bottom-left-radius: 4px;
    }
    .user-message {
      background: var(--user-bubble-bg);
      color: var(--user-bubble-text-color);
      align-self: flex-end;
      margin-left: auto;
      border-bottom-right-radius: 4px;
    }
    #chat-window-footer {
      display: flex;
      padding: 10px 15px;
      border-top: 1px solid #e0e0e0;
      background: #fff;
      flex-shrink: 0;
    }
    #chat-input {
      flex: 1;
      padding: 10px 15px;
      border: 1px solid #ced4da;
      border-radius: 20px;
      margin-right: 10px;
      outline: none;
      font-size: 0.95rem;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    #chat-input:focus {
      border-color: var(--bubble-gradient-start);
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15);
    }
    #chat-send {
      padding: 9px 18px;
      background: linear-gradient(135deg, var(--header-gradient-start), var(--header-gradient-end));
      color: #fff;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      transition: all 0.2s ease-out;
      box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
    }
    #chat-send:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 123, 255, 0.25);
    }
    #chat-send:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 123, 255, 0.2);
    }
    #chat-footer-info {
      text-align: center;
      padding: 8px;
      font-size: 11px;
      color: #888;
      background: #f8f9fa;
      border-bottom-left-radius: var(--chat-border-radius);
      border-bottom-right-radius: var(--chat-border-radius);
      flex-shrink: 0;
    }
    #chat-footer-info a {
      color: #6c757d;
      text-decoration: none;
      transition: color 0.2s;
    }
    #chat-footer-info a:hover {
      color: #0056b3;
      text-decoration: underline;
    }
    #chat-bubble {
      display: none;
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, var(--bubble-gradient-start), var(--bubble-gradient-end));
      border-radius: var(--bubble-border-radius);
      box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3);
      cursor: pointer;
      z-index: 3000;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: all var(--transition-duration) ease-out;
    }
    #chat-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 8px 22px rgba(0, 123, 255, 0.35);
    }
    #chat-bubble svg {
      width: 30px;
      height: 30px;
      fill: var(--header-text-color);
    }
    #notification-badge {
      display: none;
      position: absolute;
      top: -5px;
      right: -5px;
      width: 22px;
      height: 22px;
      background: #DC3545;
      color: #fff;
      font-size: 12px;
      text-align: center;
      line-height: 22px;
      border-radius: 50%;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%   { transform: scale(1); box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
      50%  { transform: scale(1.1); box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
      100% { transform: scale(1); box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
    }
    #help-text {
      display: none;
      position: fixed;
      bottom: 35px;
      right: 95px;
      background: #343a40;
      color: #fff;
      padding: 9px 15px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 2500;
      box-shadow: var(--box-shadow-soft);
      animation: fadeInHelp 0.5s ease-out;
      white-space: nowrap;
    }
    @keyframes fadeInHelp {
      from { opacity: 0; transform: translateX(15px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .typing-indicator .dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: rgba(0,0,0,0.4);
      margin: 0 2px;
      animation: typingDots 1.2s infinite ease-in-out;
    }
    .typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes typingDots {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }
    #whatsapp-button-container {
      display: none;
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 3000;
      display: flex;
      flex-direction: row-reverse;
      align-items: center;
    }
    #whatsapp-text {
      display: none;
      background: #fff;
      color: #333;
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-right: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      animation: fadeInHelp 0.5s ease;
      white-space: nowrap;
    }
    #whatsapp-button {
      background-color: var(--whatsapp-green);
      border: none;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
    }
    #whatsapp-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    #whatsapp-button i {
      font-size: 32px;
      color: white;
    }
    #whatsapp-badge {
      display: none;
      position: absolute;
      top: -5px;
      right: -5px;
      width: 22px;
      height: 22px;
      background: #DC3545;
      color: #fff;
      font-size: 12px;
      text-align: center;
      line-height: 22px;
      border-radius: 50%;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      animation: pulse 1.5s infinite;
    }
  `;
  const styleTag = document.createElement('style');
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /***********************************************
   * 2) INJECTION DE L’HTML DE BASE
   ***********************************************/
  const html = `
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
        <i class="fab fa-whatsapp"></i>
        <div id="whatsapp-badge">1</div>
      </button>
      <div id="whatsapp-text">Des questions ? Sur WhatsApp !</div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  /***********************************************
   * 3) LOGIQUE JAVASCRIPT
   ***********************************************/
  const GlobalConfig     = window.GlobalConfig     || { enableChatbot: true, enableWhatsApp: true };
  const ChatbotUIConfig  = window.ChatbotUIConfig  || {};
  const WhatsAppUIConfig = window.WhatsAppUIConfig || {};

  function loadChatHistory() {
    const h = sessionStorage.getItem('chatHistory');
    return h ? JSON.parse(h) : [];
  }

  function saveChatHistory(history) {
    sessionStorage.setItem('chatHistory', JSON.stringify(history));
  }

  async function initializeChatSession(initialWebhookURL) {
    let cid = sessionStorage.getItem('websiteConvId');
    const p = { current_webpage: window.location.href };
    if (cid) p.websiteConvId = cid;
    try {
      const r = await fetch(initialWebhookURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(p)
      });
      if (!r.ok) throw new Error(\`HTTP \${r.status} init.\`);
      const d = await r.json();
      if (!cid && d?.websiteConvId) {
        cid = d.websiteConvId;
        sessionStorage.setItem('websiteConvId', cid);
      }
    } catch (e) {
      console.error("Erreur init session:", e);
      cid = sessionStorage.getItem('websiteConvId');
    }
    return cid;
  }

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const chatContainer           = document.getElementById("chat-container");
    const chatBubble              = document.getElementById("chat-bubble");
    const chatClose               = document.getElementById("chat-close");
    const chatTitle               = document.getElementById("chat-title");
    const chatAvatar              = document.getElementById("chat-header-avatar");
    const chatInput               = document.getElementById("chat-input");
    const chatSend                = document.getElementById("chat-send");
    const chatBody                = document.getElementById("chat-window-body");
    const helpText                = document.getElementById("help-text");
    const notificationBadge       = document.getElementById("notification-badge");
    const whatsappButtonContainer = document.getElementById("whatsapp-button-container");
    const whatsappText            = document.getElementById("whatsapp-text");
    const whatsappButton          = document.getElementById("whatsapp-button");
    const whatsappBadge           = document.getElementById("whatsapp-badge");

    let conversationId = null;
    let chatHistory    = [];
    let activeMode     = 'none';
    let helpTextTimerId, helpTextHideTimerId, whatsappTimerId, whatsappHideTimerId;

    // Déterminer le mode actif
    if (GlobalConfig.enableChatbot && GlobalConfig.enableWhatsApp) activeMode = 'both';
    else if (GlobalConfig.enableChatbot)       activeMode = 'chatbot_only';
    else if (GlobalConfig.enableWhatsApp)      activeMode = 'whatsapp_only';

    // Initialiser la session chatbot si nécessaire
    if (['chatbot_only','both'].includes(activeMode)) {
      conversationId = await initializeChatSession(ChatbotUIConfig.initialWebhookURL);
      if (conversationId) chatHistory = loadChatHistory();
      else console.error("Échec initialisation ID conversation.");
    }

    // Fonctions d'initialisation UI
    const initChatbotUI = () => {
      if (ChatbotUIConfig.chatbotName && chatTitle) {
        chatTitle.textContent = ChatbotUIConfig.chatbotName;
      }
      if (ChatbotUIConfig.showAvatar && ChatbotUIConfig.avatarURL && chatAvatar) {
        chatAvatar.src = ChatbotUIConfig.avatarURL;
        chatAvatar.style.display = 'block';
      }
      if (ChatbotUIConfig.helpText && helpText) {
        helpText.textContent = ChatbotUIConfig.helpText;
      }
      if (ChatbotUIConfig.showBadge && ChatbotUIConfig.badgeContent && notificationBadge) {
        notificationBadge.textContent = ChatbotUIConfig.badgeContent;
      }
    };

    const initWhatsAppUI = () => {
      if (WhatsAppUIConfig.whatsappHelpText && whatsappText) {
        whatsappText.textContent = WhatsAppUIConfig.whatsappHelpText;
      }
      if (WhatsAppUIConfig.showWhatsappBadge && WhatsAppUIConfig.whatsappBadgeContent && whatsappBadge) {
        whatsappBadge.textContent = WhatsAppUIConfig.whatsappBadgeContent;
      }
    };

    // Gestion des timers
    const clearTimers = () => {
      [helpTextTimerId, helpTextHideTimerId, whatsappTimerId, whatsappHideTimerId]
        .forEach(id => id && clearTimeout(id));
      helpTextTimerId = helpTextHideTimerId = whatsappTimerId = whatsappHideTimerId = null;
    };

    const runChatbotTimers = () => {
      clearTimers();
      if (!helpText || !notificationBadge) return;
      if (!ChatbotUIConfig.helpText) return;
      helpTextTimerId = setTimeout(() => {
        helpText.style.display = "block";
        if (ChatbotUIConfig.showBadge) notificationBadge.style.display = "block";
        if (ChatbotUIConfig.helpTextDisplayDuration > 0) {
          helpTextHideTimerId = setTimeout(() => {
            helpText.style.display = "none";
          }, ChatbotUIConfig.helpTextDisplayDuration);
        }
      }, ChatbotUIConfig.helpTextDelay);
    };

    const runWhatsAppTimers = () => {
      clearTimers();
      if (!whatsappText || !whatsappBadge) return;
      if (!WhatsAppUIConfig.whatsappHelpText) return;
      whatsappTimerId = setTimeout(() => {
        whatsappText.style.display = "block";
        if (WhatsAppUIConfig.showWhatsappBadge) whatsappBadge.style.display = "block";
        if (WhatsAppUIConfig.whatsappHelpDisplayDuration > 0) {
          whatsappHideTimerId = setTimeout(() => {
            whatsappText.style.display = "none";
          }, WhatsAppUIConfig.whatsappHelpDisplayDuration);
        }
      }, WhatsAppUIConfig.whatsappHelpDelay);
    };

    // Mise à jour de la visibilité
    const updateWidgetVisibility = () => {
      const isMobile = window.innerWidth <= 600;
      [chatBubble, whatsappButtonContainer, helpText, whatsappText]
        .forEach(el => el && (el.style.display = 'none'));
      [notificationBadge, whatsappBadge]
        .forEach(el => el && (el.style.display = 'none'));

      switch (activeMode) {
        case 'chatbot_only':
          initChatbotUI();
          chatBubble && (chatBubble.style.display = 'flex');
          runChatbotTimers();
          break;
        case 'whatsapp_only':
          initWhatsAppUI();
          whatsappButtonContainer && (whatsappButtonContainer.style.display = 'flex');
          runWhatsAppTimers();
          break;
        case 'both':
          initChatbotUI();
          initWhatsAppUI();
          if (isMobile) {
            whatsappButtonContainer && (whatsappButtonContainer.style.display = 'flex');
            runWhatsAppTimers();
          } else {
            chatBubble && (chatBubble.style.display = 'flex');
            runChatbotTimers();
          }
          break;
      }

      // Refermer le chat si on bascule en mobile
      if (isMobile && chatContainer?.classList.contains('active')) {
        chatContainer.classList.remove('active');
        chatContainer.style.display = 'none';
      }
    };

    window.addEventListener('resize', debounce(updateWidgetVisibility, 250));
    updateWidgetVisibility();

    // Fonctions de chat
    const scrollToBottom = () => {
      setTimeout(() => {
        if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
      }, 50);
    };

    const appendMessage = (text, type, skipAnimation = false) => {
      if (!chatBody) return;
      const d = document.createElement("div");
      d.classList.add(type === 'user' ? 'user-message' : 'bot-message');
      if (skipAnimation) d.style.animation = 'none';
      d.textContent = text;
      chatBody.appendChild(d);
      scrollToBottom();
    };

    const showTypingIndicator = () => {
      if (!chatBody || chatBody.querySelector('.typing-indicator')) return;
      const d = document.createElement("div");
      d.classList.add("bot-message", "typing-indicator");
      d.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
      chatBody.appendChild(d);
      scrollToBottom();
    };

    const removeTypingIndicator = () => {
      const i = chatBody?.querySelector('.typing-indicator');
      if (i) i.remove();
    };

    const populateChatFromHistory = () => {
      if (!chatBody) return;
      chatBody.innerHTML = '';
      if (chatHistory.length === 0) {
        appendMessage("Bonjour...", 'bot', true);
      } else {
        chatHistory.forEach(msg => appendMessage(msg.text, msg.type, true));
      }
      scrollToBottom();
    };

    const sendMessage = () => {
      if (!conversationId) {
        appendMessage("Erreur session.", 'bot');
        return;
      }
      const txt = chatInput?.value.trim();
      if (!txt) return;
      appendMessage(txt, 'user');
      chatHistory.push({ type: 'user', text: txt });
      saveChatHistory(chatHistory);
      chatInput.value = "";
      showTypingIndicator();
      const payload = {
        message: txt,
        websiteConvId: conversationId,
        original_url: ChatbotUIConfig.messageWebhookURL,
        current_webpage: window.location.href
      };
      fetch(ChatbotUIConfig.messageWebhookURL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(r => {
          if (!r.ok) return r.text().then(t => { throw new Error(\`HTTP \${r.status} - \${t||r.statusText}\`); });
          return r.json();
        })
        .then(d => {
          removeTypingIndicator();
          const rt = d.reply || d.message || "...";
          appendMessage(rt, 'bot');
          chatHistory.push({ type: 'bot', text: rt });
          saveChatHistory(chatHistory);
        })
        .catch(e => {
          console.error("Erreur msg:", e);
          removeTypingIndicator();
          appendMessage("Erreur tech.", 'bot');
          chatHistory.push({ type: 'bot', text: "Erreur tech." });
          saveChatHistory(chatHistory);
        });
    };

    // Listeners Chatbot
    if (['chatbot_only','both'].includes(activeMode)) {
      chatBubble?.addEventListener("click", () => {
        clearTimers();
        helpText?.style.display = 'none';
        notificationBadge?.style.display = 'none';
        populateChatFromHistory();
        chatContainer.style.display = 'flex';
        setTimeout(() => chatContainer.classList.add("active"), 10);
        chatBubble.style.display = 'none';
        setTimeout(() => chatInput.focus(), 300);
      });
      chatClose?.addEventListener("click", () => {
        chatContainer.classList.remove("active");
        setTimeout(() => {
          chatContainer.style.display = 'none';
          updateWidgetVisibility();
        }, 300);
      });
      chatSend?.addEventListener("click", sendMessage);
      chatInput?.addEventListener("keypress", e => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Listeners WhatsApp
    if (['whatsapp_only','both'].includes(activeMode)) {
      whatsappButton?.addEventListener("click", () => {
        clearTimers();
        whatsappText?.style.display  = 'none';
        whatsappBadge?.style.display = 'none';
        const url = \`https://wa.me/?text=\${encodeURIComponent(WhatsAppUIConfig.whatsappMessage||"")}\`;
        window.open(url, "_blank");
      });
    }
  });
})();
