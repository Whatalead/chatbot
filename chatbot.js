// == Contenu complet du fichier widget.js (à héberger sur CDN) ==

(function() {
    // Vérification essentielle : WidgetConfig est-il défini ?
    if (typeof window.WidgetConfig === 'undefined') {
        console.error("Erreur Widget : La configuration (window.WidgetConfig) est manquante. Assurez-vous de l'inclure AVANT ce script.");
        return; // Arrêter l'exécution si la config manque
    }

    // Récupération de la configuration globale
    const GlobalConfig = window.WidgetConfig.Global || {};
    const ChatbotConfig = window.WidgetConfig.Chatbot || {};
    const WhatsAppConfig = window.WidgetConfig.WhatsApp || {};

    // Création dynamique du HTML et du CSS
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
            <div id="notification-badge">1</div>
        </div>
        <div id="help-text">Besoin d'aide ?</div>
        <div id="whatsapp-button-container">
            <button id="whatsapp-button" aria-label="Contacter via WhatsApp">
                 <i class="wab-icon"></i> <!-- Placeholder pour l'icône -->
                <div id="whatsapp-badge">1</div>
            </button>
            <div id="whatsapp-text">Des questions ? Sur WhatsApp !</div>
        </div>
    `;

    const widgetCSS = `
        /* --- Intégration Font Awesome --- */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

        /* === DEBUT CORRECTION ICONE WHATSAPP === */
        #whatsapp-button .wab-icon::before {
           font-family: "Font Awesome 5 Brands";
           content: "\\f232"; /* WhatsApp icon */
           font-weight: 400; /* Normal weight for Brands */
           font-size: 32px;  /* Taille de l'icône */
           color: white;
           line-height: 1; /* Essentiel pour l'alignement vertical */
           display: inline-block; /* Assure un comportement bloc */
           vertical-align: middle; /* Aide à l'alignement */
        }

        /* Styles pour le conteneur <i> lui-même pour forcer les dimensions */
        #whatsapp-button .wab-icon {
            display: inline-flex; /* Utiliser flex pour centrer le ::before */
            align-items: center;  /* Centre verticalement le ::before */
            justify-content: center; /* Centre horizontalement le ::before */
            width: 32px;  /* Doit correspondre à font-size */
            height: 32px; /* Doit correspondre à font-size */
        }
        /* === FIN CORRECTION ICONE WHATSAPP === */


        /* --- Styles CSS Généraux --- */
       :root {
            --bubble-gradient-start: #007BFF; --bubble-gradient-end: #00C6FF;
            --header-gradient-start: #007BFF; --header-gradient-end: #00C6FF;
            --header-text-color: #fff; --chat-bg-color: #fff; --chat-body-bg: #f7f9fc;
            --bot-bubble-bg: #e9ecef; --user-bubble-bg: #007BFF; --user-bubble-text-color: #fff;
            --chat-border-radius: 12px; --bubble-border-radius: 50%; --msg-border-radius: 10px;
            --transition-duration: 0.3s; --box-shadow-intense: 0 10px 25px rgba(0,0,0,0.12);
            --box-shadow-soft: 0 4px 10px rgba(0,0,0,0.1);
            --whatsapp-green: #25D366;
        }
        /* Reset minimal pour les éléments du widget */
        #chat-container *, #chat-bubble *, #help-text *, #whatsapp-button-container * {
             margin: 0; padding: 0; box-sizing: border-box;
        }
        #chat-container, #chat-bubble, #help-text, #whatsapp-button-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
        }
        /* Styles Chat Container & Window */
        #chat-container { display: none; position: fixed; bottom: 95px; right: 20px; width: min(370px, 90vw); height: 520px; background: var(--chat-bg-color); border-radius: var(--chat-border-radius); box-shadow: var(--box-shadow-intense); z-index: 2000; flex-direction: column; overflow: hidden; transition: all var(--transition-duration) ease; opacity: 0; transform: translateY(20px) scale(0.95); }
        #chat-container.active { opacity: 1; transform: translateY(0) scale(1); }
        #chat-window { display: flex; flex-direction: column; height: 100%; }
        #chat-window-header { display: flex; align-items: center; padding: 12px 15px; background: linear-gradient(135deg, var(--header-gradient-start), var(--header-gradient-end)); color: var(--header-text-color); border-top-left-radius: var(--chat-border-radius); border-top-right-radius: var(--chat-border-radius); flex-shrink: 0; }
        #chat-header-avatar { display: none; width: 36px; height: 36px; border-radius: 50%; margin-right: 12px; object-fit: cover; border: 2px solid rgba(255, 255, 255, 0.5); }
        #header-info { flex-grow: 1; display: flex; flex-direction: column; }
        #chat-window-header h4 { font-size: 1.05rem; font-weight: 600; line-height: 1.2; margin-bottom: 2px; }
        #online-indicator { font-size: 0.8rem; display: flex; align-items: center; opacity: 0.85; }
        #online-indicator::before { content: ""; display: inline-block; width: 7px; height: 7px; background-color: #34C759; border-radius: 50%; margin-right: 5px; }
        #chat-close { background: none; border: none; font-size: 1.4rem; color: var(--header-text-color); cursor: pointer; transition: transform 0.2s, opacity 0.2s; padding: 5px; margin-left: 10px; opacity: 0.8; }
        #chat-close:hover { transform: scale(1.1); opacity: 1; }
        #chat-window-body { flex: 1; padding: 15px; overflow-y: auto; background: var(--chat-body-bg); display: flex; flex-direction: column; }
        /* Message Bubbles */
        .bot-message, .user-message { margin: 6px 0; padding: 10px 14px; border-radius: var(--msg-border-radius); max-width: 85%; line-height: 1.45; box-shadow: 0 1px 1px rgba(0,0,0,0.05); animation: fadeIn 0.3s ease-out; word-wrap: break-word; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .bot-message { background: var(--bot-bubble-bg); align-self: flex-start; color: #212529; border-bottom-left-radius: 4px; }
        .user-message { background: var(--user-bubble-bg); color: var(--user-bubble-text-color); align-self: flex-end; margin-left: auto; border-bottom-right-radius: 4px; }
        /* Chat Footer */
        #chat-window-footer { display: flex; padding: 10px 15px; border-top: 1px solid #e0e0e0; background: #fff; flex-shrink: 0; }
        #chat-input { flex: 1; padding: 10px 15px; border: 1px solid #ced4da; border-radius: 20px; margin-right: 10px; outline: none; font-size: 0.95rem; transition: border-color 0.3s, box-shadow 0.3s; }
        #chat-input:focus { border-color: var(--bubble-gradient-start); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15); }
        #chat-send { padding: 9px 18px; background: linear-gradient(135deg, var(--header-gradient-start), var(--header-gradient-end)); color: #fff; border: none; border-radius: 20px; cursor: pointer; font-size: 0.95rem; font-weight: 500; transition: all 0.2s ease-out; box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2); }
        #chat-send:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0, 123, 255, 0.25); }
        #chat-send:active { transform: translateY(0); box-shadow: 0 1px 2px rgba(0, 123, 255, 0.2); }
        #chat-footer-info { text-align: center; padding: 8px; font-size: 11px; color: #888; background: #f8f9fa; border-bottom-left-radius: var(--chat-border-radius); border-bottom-right-radius: var(--chat-border-radius); flex-shrink: 0; }
        #chat-footer-info a { color: #6c757d; text-decoration: none; transition: color 0.2s; }
        #chat-footer-info a:hover { color: #0056b3; text-decoration: underline; }
        /* Chat Bubble */
        #chat-bubble { display: none; position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: linear-gradient(135deg, var(--bubble-gradient-start), var(--bubble-gradient-end)); border-radius: var(--bubble-border-radius); box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3); cursor: pointer; z-index: 3000; display: flex; justify-content: center; align-items: center; transition: all var(--transition-duration) ease-out; }
        #chat-bubble:hover { transform: scale(1.08); box-shadow: 0 8px 22px rgba(0, 123, 255, 0.35); }
        #chat-bubble svg { width: 30px; height: 30px; fill: var(--header-text-color); }
        /* Notification Badge (Chat & WhatsApp) */
        #notification-badge, #whatsapp-badge { display: none; position: absolute; top: -5px; right: -5px; width: 22px; height: 22px; background: #DC3545; color: #fff; font-size: 12px; text-align: center; line-height: 22px; border-radius: 50%; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 2px 5px rgba(0,0,0,0.2); } 50% { transform: scale(1.1); box-shadow: 0 4px 10px rgba(0,0,0,0.3); } 100% { transform: scale(1); box-shadow: 0 2px 5px rgba(0,0,0,0.2); } }
        /* Help Text */
        #help-text { display: none; position: fixed; bottom: 35px; right: 95px; background: #343a40; color: #fff; padding: 9px 15px; border-radius: 8px; font-size: 13px; z-index: 2500; box-shadow: var(--box-shadow-soft); animation: fadeInHelp 0.5s ease-out; white-space: nowrap; }
        @keyframes fadeInHelp { from { opacity: 0; transform: translateX(15px); } to { opacity: 1; transform: translateX(0); } }
        /* Typing Indicator */
        .typing-indicator { padding: 10px 14px; }
        .typing-indicator .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: rgba(0,0,0,0.4); margin: 0 2px; animation: typingDots 1.2s infinite ease-in-out; }
        .typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingDots { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
        /* WhatsApp Button */
        #whatsapp-button-container { display: none; position: fixed; bottom: 20px; right: 20px; z-index: 3000; display: flex; flex-direction: row-reverse; align-items: center; }
        #whatsapp-text { display: none; background: #fff; color: #333; padding: 9px 14px; border-radius: 8px; font-size: 13px; margin-right: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); animation: fadeInHelp 0.5s ease; white-space: nowrap; }
        #whatsapp-button { background-color: var(--whatsapp-green); border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; position: relative; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); transition: transform 0.2s ease-out, box-shadow 0.2s ease-out; padding:0; /* Reset padding */ }
        #whatsapp-button:hover { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2); }
         /* #whatsapp-button i est géré par .wab-icon */
    `;

    // Injecter le HTML et le CSS dans le DOM
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    const styleSheet = document.createElement("style");
    styleSheet.textContent = widgetCSS;
    document.head.appendChild(styleSheet);


    /***********************************************
     * FONCTIONS UTILITAIRES (Inchangées)
     ***********************************************/
    function loadChatHistory() { const h=sessionStorage.getItem('chatHistory'); return h?JSON.parse(h):[]; }
    function saveChatHistory(history) { sessionStorage.setItem('chatHistory',JSON.stringify(history)); }
    async function initializeChatSession(initialWebhookURL) {
        console.log("Init session...");
        let cid = sessionStorage.getItem('websiteConvId');
        const payload = { current_webpage: window.location.href };
        if (cid) {
            console.log("ID de conversation existant trouvé :", cid);
            payload.websiteConvId = cid;
        } else {
            console.log("Aucun ID de conversation existant, demande d'un nouveau.");
        }
        try {
            const response = await fetch(initialWebhookURL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status} lors de l'initialisation de la session.`);
            }
            if (!cid) {
                const data = await response.json();
                if (data && data.websiteConvId) {
                    cid = data.websiteConvId;
                    sessionStorage.setItem('websiteConvId', cid);
                    console.log("Nouvel ID de conversation reçu et stocké :", cid);
                } else {
                    console.error("Réponse reçue mais ID de conversation manquant.");
                    return null;
                }
            } else {
                 console.log("Session initialisée avec l'ID existant.");
            }
        } catch (e) {
            console.error("Erreur lors de l'initialisation de la session :", e);
            return sessionStorage.getItem('websiteConvId');
        }
        return cid;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /***********************************************
     * LOGIQUE PRINCIPALE DU WIDGET (Inchangée sauf références config)
     ***********************************************/
    document.addEventListener("DOMContentLoaded", async () => {

        /* Références DOM */
        const chatContainer = document.getElementById("chat-container");
        const chatBubble = document.getElementById("chat-bubble");
        const chatClose = document.getElementById("chat-close");
        const chatTitle = document.getElementById("chat-title");
        const chatAvatar = document.getElementById("chat-header-avatar");
        const chatInput = document.getElementById("chat-input");
        const chatSend = document.getElementById("chat-send");
        const chatBody = document.getElementById("chat-window-body");
        const helpText = document.getElementById("help-text");
        const notificationBadge = document.getElementById("notification-badge");
        const whatsappButtonContainer = document.getElementById("whatsapp-button-container");
        const whatsappText = document.getElementById("whatsapp-text");
        const whatsappButton = document.getElementById("whatsapp-button");
        const whatsappBadge = document.getElementById("whatsapp-badge");

        if (!chatContainer || !chatBubble || !whatsappButtonContainer) {
            console.error("Erreur Widget: Impossible de trouver les éléments DOM essentiels.");
            return;
        }

        let conversationId = null;
        let chatHistory = [];
        let activeMode = 'none';
        let helpTextTimerId = null;
        let helpTextHideTimerId = null;
        let whatsappTimerId = null;
        let whatsappHideTimerId = null;

        // 1. Déterminer le mode actif
        if (GlobalConfig.enableChatbot && GlobalConfig.enableWhatsApp) activeMode = 'both';
        else if (GlobalConfig.enableChatbot) activeMode = 'chatbot_only';
        else if (GlobalConfig.enableWhatsApp) activeMode = 'whatsapp_only';
        else activeMode = 'none';

        // 2. Initialiser l'ID si le chatbot est actif
        if (activeMode === 'chatbot_only' || activeMode === 'both') {
             if (!ChatbotConfig.initialWebhookURL) {
                 console.error("Erreur Config Chatbot: initialWebhookURL est manquant.");
                 activeMode = (activeMode === 'both') ? 'whatsapp_only' : 'none';
             } else {
                 conversationId = await initializeChatSession(ChatbotConfig.initialWebhookURL);
                 if (conversationId) {
                     chatHistory = loadChatHistory();
                 } else {
                     console.error("Échec de l'initialisation de l'ID de conversation.");
                 }
            }
        }

         // 3. Fonctions UI et Timers
        const initChatbotUI = () => { /* ... (utilise ChatbotConfig) ... */ if (!ChatbotConfig) return; if(chatTitle) chatTitle.textContent = ChatbotConfig.chatbotName || "Assistant"; if(helpText) helpText.textContent = ChatbotConfig.helpText || "Besoin d'aide ?"; if(notificationBadge) notificationBadge.textContent = ChatbotConfig.badgeContent || "1"; if (ChatbotConfig.showAvatar && ChatbotConfig.avatarURL && chatAvatar) { chatAvatar.src = ChatbotConfig.avatarURL; chatAvatar.style.display = 'block'; } else if (chatAvatar) { chatAvatar.style.display = 'none'; }};
        const initWhatsAppUI = () => { /* ... (utilise WhatsAppConfig) ... */ if (!WhatsAppConfig) return; if(whatsappText) whatsappText.textContent = WhatsAppConfig.whatsappHelpText || "Contactez-nous !"; if(whatsappBadge) whatsappBadge.textContent = WhatsAppConfig.whatsappBadgeContent || "1"; if (!WhatsAppConfig.whatsappPhoneNumber) { console.warn("Config WhatsApp: whatsappPhoneNumber manquant."); }};
        const clearTimers = () => { clearTimeout(helpTextTimerId); clearTimeout(helpTextHideTimerId); clearTimeout(whatsappTimerId); clearTimeout(whatsappHideTimerId); helpTextTimerId = helpTextHideTimerId = whatsappTimerId = whatsappHideTimerId = null;};
        const runChatbotTimers = () => { /* ... (utilise ChatbotConfig) ... */ clearTimers(); if (!helpText || !notificationBadge || !ChatbotConfig) return; const delay = ChatbotConfig.helpTextDelay || 2500; const duration = ChatbotConfig.helpTextDisplayDuration; helpTextTimerId = setTimeout(() => { if(helpText) helpText.style.display = "block"; if (ChatbotConfig.showBadge && notificationBadge) notificationBadge.style.display = "block"; if (duration && duration > 0) { helpTextHideTimerId = setTimeout(() => { if(helpText) helpText.style.display = "none"; }, duration); } }, delay); };
        const runWhatsAppTimers = () => { /* ... (utilise WhatsAppConfig) ... */ clearTimers(); if (!whatsappText || !whatsappBadge || !WhatsAppConfig) return; const delay = WhatsAppConfig.whatsappHelpDelay || 2000; const duration = WhatsAppConfig.whatsappHelpDisplayDuration; whatsappTimerId = setTimeout(() => { if(whatsappText) whatsappText.style.display = "block"; if (WhatsAppConfig.showWhatsappBadge && whatsappBadge) whatsappBadge.style.display = "block"; if (duration && duration > 0) { whatsappHideTimerId = setTimeout(() => { if(whatsappText) whatsappText.style.display = "none"; }, duration); } }, delay); };


        // 4. Fonction de mise à jour de la visibilité
         const updateWidgetVisibility = () => { /* ... (logique inchangée) ... */
            const isCurrentlyMobile = window.innerWidth <= 600;
            console.log(`Updating Visibility - Mode: ${activeMode}, Mobile: ${isCurrentlyMobile}`);
            if (chatBubble) chatBubble.style.display = 'none';
            if (whatsappButtonContainer) whatsappButtonContainer.style.display = 'none';
            if (helpText) helpText.style.display = 'none';
            if (whatsappText) whatsappText.style.display = 'none';
            if (notificationBadge) notificationBadge.style.display = 'none';
            if (whatsappBadge) whatsappBadge.style.display = 'none';
             clearTimers();
            switch (activeMode) {
                case 'chatbot_only': initChatbotUI(); if (chatBubble) chatBubble.style.display = 'flex'; if (!chatContainer || !chatContainer.classList.contains('active')) { runChatbotTimers(); } break;
                case 'whatsapp_only': initWhatsAppUI(); if (whatsappButtonContainer) whatsappButtonContainer.style.display = 'flex'; runWhatsAppTimers(); break;
                case 'both': initChatbotUI(); initWhatsAppUI(); if (isCurrentlyMobile) { if (whatsappButtonContainer) whatsappButtonContainer.style.display = 'flex'; runWhatsAppTimers(); } else { if (chatBubble) chatBubble.style.display = 'flex'; if (!chatContainer || !chatContainer.classList.contains('active')) { runChatbotTimers(); } } break;
                case 'none': default: break;
            }
             if (activeMode === 'both' && isCurrentlyMobile && chatContainer && chatContainer.classList.contains('active')) { chatContainer.classList.remove('active'); chatContainer.style.display = 'none'; if (whatsappButtonContainer) whatsappButtonContainer.style.display = 'flex'; runWhatsAppTimers(); }
             else if (activeMode === 'both' && !isCurrentlyMobile && chatContainer && chatContainer.classList.contains('active')) { if (whatsappButtonContainer) whatsappButtonContainer.style.display = 'none'; }
         };

        // 5. Appel initial et listener resize
        updateWidgetVisibility();
        window.addEventListener('resize', debounce(updateWidgetVisibility, 250));

        // 6. Logique Chatbot
        const scrollToBottom = () => { setTimeout(() => { if(chatBody) chatBody.scrollTop = chatBody.scrollHeight; }, 50); };
        const appendMessage = (text, type, skipAnimation = false) => { if (!chatBody) return; const d = document.createElement("div"); const c = type === 'user' ? 'user-message' : 'bot-message'; d.classList.add(c); d.textContent = text; if (skipAnimation) d.style.animation = 'none'; chatBody.appendChild(d); scrollToBottom(); };
        const showTypingIndicator = () => { if (!chatBody || chatBody.querySelector('.typing-indicator')) return; const d = document.createElement("div"); d.classList.add("bot-message", "typing-indicator"); d.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>'; chatBody.appendChild(d); scrollToBottom(); };
        const removeTypingIndicator = () => { if (!chatBody) return; const i = chatBody.querySelector('.typing-indicator'); if (i) chatBody.removeChild(i); };
        const populateChatFromHistory = () => { if (!chatBody) return; chatBody.innerHTML = ''; if (chatHistory.length === 0) { const initialMsg = "Bonjour ! Comment puis-je vous aider ?"; appendMessage(initialMsg, 'bot', true); /* Ne pas sauvegarder le message auto ici chatHistory.push({ type: 'bot', text: initialMsg }); saveChatHistory(chatHistory); */ } else { chatHistory.forEach(msg => appendMessage(msg.text, msg.type, true)); } scrollToBottom(); };
        const sendMessage = () => {
             if (!ChatbotConfig || !ChatbotConfig.messageWebhookURL) { console.error("Erreur Config Chatbot: messageWebhookURL manquant."); appendMessage("Erreur de configuration.", 'bot'); return; }
             if (!conversationId) { console.error("ID de conversation manquant."); appendMessage("Erreur de session.", 'bot'); return; }
             if(!chatInput) return; const txt = chatInput.value.trim(); if (!txt) return;
             appendMessage(txt, 'user'); chatHistory.push({ type: 'user', text: txt }); saveChatHistory(chatHistory); chatInput.value = ""; showTypingIndicator();
             const payload = { message: txt, websiteConvId: conversationId, original_url: ChatbotConfig.messageWebhookURL, current_webpage: window.location.href };
             fetch(ChatbotConfig.messageWebhookURL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) })
             .then(response => { if (!response.ok) { return response.text().then(text => { throw new Error(`Erreur HTTP ${response.status} - ${text || response.statusText}`); }); } return response.json(); })
             .then(data => { removeTypingIndicator(); const replyText = data.reply || data.message || "..."; appendMessage(replyText, 'bot'); chatHistory.push({ type: 'bot', text: replyText }); saveChatHistory(chatHistory); })
             .catch((error) => { console.error("Erreur envoi/réception message:", error); removeTypingIndicator(); const errorText = "Erreur technique."; appendMessage(errorText, 'bot'); chatHistory.push({ type: 'bot', text: errorText }); saveChatHistory(chatHistory); });
         };

        // 7. Attacher les Listeners
        if (GlobalConfig.enableChatbot && (activeMode === 'chatbot_only' || activeMode === 'both')) {
             if (chatBubble) chatBubble.addEventListener("click", () => { clearTimers(); if(helpText) helpText.style.display = 'none'; if(notificationBadge) notificationBadge.style.display = 'none'; populateChatFromHistory(); if(chatContainer) chatContainer.style.display = "flex"; setTimeout(() => { if(chatContainer) chatContainer.classList.add("active"); }, 10); if(chatBubble) chatBubble.style.display = "none"; setTimeout(() => { if(chatInput) chatInput.focus(); }, 300); });
             if (chatClose) chatClose.addEventListener("click", () => { if(chatContainer) chatContainer.classList.remove("active"); setTimeout(() => { if(chatContainer) chatContainer.style.display = "none"; updateWidgetVisibility(); }, 300); });
             if (chatSend) chatSend.addEventListener("click", sendMessage);
             if (chatInput) chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
        }
        if (GlobalConfig.enableWhatsApp && (activeMode === 'whatsapp_only' || activeMode === 'both')) {
             if (whatsappButton) whatsappButton.addEventListener("click", () => {
                 if (!WhatsAppConfig || !WhatsAppConfig.whatsappPhoneNumber) { console.error("Clic impossible: Numéro WhatsApp non configuré."); alert("Le contact WhatsApp n'est pas configuré."); return; }
                 clearTimers(); if(whatsappText) whatsappText.style.display = 'none'; if(whatsappBadge) whatsappBadge.style.display = 'none';
                 const phone = WhatsAppConfig.whatsappPhoneNumber; const message = encodeURIComponent(WhatsAppConfig.whatsappMessage || '');
                 const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`; // Nettoie le numéro
                 window.open(url, "_blank", "noopener,noreferrer");
             });
        }

    }); // Fin DOMContentLoaded

})(); // Fin IIFE
