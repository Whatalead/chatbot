// Fichier chatbot.js (Hébergé sur CDN)

(function() {
    // --- Protection ---
    // Vérifier si les configurations existent (pour éviter les erreurs si le script 1 n'est pas chargé)
    if (typeof GlobalConfig === 'undefined' || typeof ChatbotUIConfig === 'undefined' || typeof WhatsAppUIConfig === 'undefined') {
        console.error("Whatalead Widget Error: Configuration objects (GlobalConfig, ChatbotUIConfig, WhatsAppUIConfig) not found. Make sure the configuration script is loaded before chatbot.js.");
        return; // Arrêter l'exécution si la config est manquante
    }

    // --- HTML Structure ---
    const widgetHTML = `
        <div id="chat-container" style="display: none;">
            <div id="chat-window">
                <div id="chat-window-header">
                    <img id="chat-header-avatar" src="" alt="Avatar" style="display: none;">
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
        <div id="chat-bubble" style="display: none;">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
            <div id="notification-badge" style="display: none;"></div>
        </div>
        <div id="help-text" style="display: none;"></div>
        <div id="whatsapp-button-container" style="display: none;">
            <button id="whatsapp-button" aria-label="Contacter via WhatsApp">
                <!-- L'icône sera ajoutée via CSS ou JS pour garder le HTML propre -->
                <div id="whatsapp-badge" style="display: none;"></div>
            </button>
            <div id="whatsapp-text" style="display: none;"></div>
        </div>
    `;

    // --- CSS Styles ---
    const widgetCSS = `
        /* Styles CSS (Basés sur l'original, prêts pour injection) */
        :root { /* ... variables ... */
            --bubble-gradient-start: #007BFF; --bubble-gradient-end: #00C6FF;
            --header-gradient-start: #007BFF; --header-gradient-end: #00C6FF;
            --header-text-color: #fff; --chat-bg-color: #fff; --chat-body-bg: #f7f9fc;
            --bot-bubble-bg: #e9ecef; --user-bubble-bg: #007BFF; --user-bubble-text-color: #fff;
            --chat-border-radius: 12px; --bubble-border-radius: 50%; --msg-border-radius: 10px;
            --transition-duration: 0.3s; --box-shadow-intense: 0 10px 25px rgba(0,0,0,0.12);
            --box-shadow-soft: 0 4px 10px rgba(0,0,0,0.1);
            --whatsapp-green: #25D366;
        }
        #whatalead-widget-container * { margin: 0; padding: 0; box-sizing: border-box; }
        #whatalead-widget-container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }

        #chat-container { /* Géré par JS */ position: fixed; bottom: 95px; right: 20px; width: min(370px, 90vw); max-width: 90vw; height: 520px; max-height: calc(100vh - 110px); background: var(--chat-bg-color); border-radius: var(--chat-border-radius); box-shadow: var(--box-shadow-intense); z-index: 2147483646; /* Max z-index - 1 */ display: flex; flex-direction: column; overflow: hidden; transition: all var(--transition-duration) ease; opacity: 0; transform: translateY(20px) scale(0.95); }
        #chat-container.active { opacity: 1; transform: translateY(0) scale(1); }
        #chat-window { display: flex; flex-direction: column; height: 100%; }
        #chat-window-header { display: flex; align-items: center; padding: 12px 15px; background: linear-gradient(135deg, var(--header-gradient-start), var(--header-gradient-end)); color: var(--header-text-color); border-top-left-radius: var(--chat-border-radius); border-top-right-radius: var(--chat-border-radius); flex-shrink: 0; }
        #chat-header-avatar { /* display géré par JS */ width: 36px; height: 36px; border-radius: 50%; margin-right: 12px; object-fit: cover; border: 2px solid rgba(255, 255, 255, 0.5); }
        #header-info { flex-grow: 1; display: flex; flex-direction: column; }
        #chat-window-header h4 { font-size: 1.05rem; font-weight: 600; line-height: 1.2; margin: 0; }
        #online-indicator { font-size: 0.8rem; display: flex; align-items: center; opacity: 0.85; margin-top: 2px; }
        #online-indicator::before { content: ""; display: inline-block; width: 7px; height: 7px; background-color: #34C759; border-radius: 50%; margin-right: 5px; }
        #chat-close { background: none; border: none; font-size: 1.4rem; color: var(--header-text-color); cursor: pointer; transition: transform 0.2s, opacity 0.2s; padding: 5px; margin-left: 10px; opacity: 0.8; }
        #chat-close:hover { transform: scale(1.1); opacity: 1; }
        #chat-window-body { flex: 1; padding: 15px; overflow-y: auto; background: var(--chat-body-bg); display: flex; flex-direction: column; }
        .bot-message, .user-message { margin: 6px 0; padding: 10px 14px; border-radius: var(--msg-border-radius); max-width: 85%; line-height: 1.45; box-shadow: 0 1px 1px rgba(0,0,0,0.05); animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .bot-message { background: var(--bot-bubble-bg); align-self: flex-start; color: #212529; border-bottom-left-radius: 4px; word-wrap: break-word; }
        .user-message { background: var(--user-bubble-bg); color: var(--user-bubble-text-color); align-self: flex-end; margin-left: auto; border-bottom-right-radius: 4px; word-wrap: break-word; }
        #chat-window-footer { display: flex; padding: 10px 15px; border-top: 1px solid #e0e0e0; background: #fff; flex-shrink: 0; }
        #chat-input { flex: 1; padding: 10px 15px; border: 1px solid #ced4da; border-radius: 20px; margin-right: 10px; outline: none; font-size: 0.95rem; transition: border-color 0.3s, box-shadow 0.3s; }
        #chat-input:focus { border-color: var(--bubble-gradient-start); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.15); }
        #chat-send { padding: 9px 18px; background: linear-gradient(135deg, var(--header-gradient-start), var(--header-gradient-end)); color: #fff; border: none; border-radius: 20px; cursor: pointer; font-size: 0.95rem; font-weight: 500; transition: all 0.2s ease-out; box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2); line-height: normal;}
        #chat-send:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0, 123, 255, 0.25); }
        #chat-send:active { transform: translateY(0); box-shadow: 0 1px 2px rgba(0, 123, 255, 0.2); }
        #chat-footer-info { text-align: center; padding: 8px; font-size: 11px; color: #888; background: #f8f9fa; border-bottom-left-radius: var(--chat-border-radius); border-bottom-right-radius: var(--chat-border-radius); flex-shrink: 0; }
        #chat-footer-info a { color: #6c757d; text-decoration: none; transition: color 0.2s; }
        #chat-footer-info a:hover { color: #0056b3; text-decoration: underline; }

        #chat-bubble { /* display géré par JS */ position: fixed; bottom: 20px; right: 20px; width: 60px; height: 60px; background: linear-gradient(135deg, var(--bubble-gradient-start), var(--bubble-gradient-end)); border-radius: var(--bubble-border-radius); box-shadow: 0 5px 15px rgba(0, 123, 255, 0.3); cursor: pointer; z-index: 2147483647; /* Max z-index */ display: flex; justify-content: center; align-items: center; transition: all var(--transition-duration) ease-out; }
        #chat-bubble:hover { transform: scale(1.08); box-shadow: 0 8px 22px rgba(0, 123, 255, 0.35); }
        #chat-bubble svg { width: 30px; height: 30px; fill: var(--header-text-color); }

        #notification-badge { /* display géré par JS */ position: absolute; top: -5px; right: -5px; min-width: 22px; height: 22px; background: #DC3545; color: #fff; font-size: 12px; text-align: center; line-height: 22px; border-radius: 50%; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); animation: pulse 1.5s infinite; padding: 0 5px; }
        @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 2px 5px rgba(0,0,0,0.2); } 50% { transform: scale(1.1); box-shadow: 0 4px 10px rgba(0,0,0,0.3); } 100% { transform: scale(1); box-shadow: 0 2px 5px rgba(0,0,0,0.2); } }

        #help-text { /* display géré par JS */ position: fixed; bottom: 35px; right: 95px; background: #343a40; color: #fff; padding: 9px 15px; border-radius: 8px; font-size: 13px; z-index: 2147483646; /* Max z-index - 1 */ box-shadow: var(--box-shadow-soft); animation: fadeInHelp 0.5s ease-out; white-space: nowrap; }
        @keyframes fadeInHelp { from { opacity: 0; transform: translateX(15px); } to { opacity: 1; transform: translateX(0); } }

        .typing-indicator { display: flex; align-items: center; }
        .typing-indicator .dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: rgba(0,0,0,0.4); margin: 0 2px; animation: typingDots 1.2s infinite ease-in-out; }
        .typing-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingDots { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }

        #whatsapp-button-container { /* display géré par JS */ position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; /* Max z-index */ display: flex; flex-direction: row-reverse; align-items: center; }
        #whatsapp-text { /* display géré par JS */ background: #fff; color: #333; padding: 9px 14px; border-radius: 8px; font-size: 13px; margin-right: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); animation: fadeInHelp 0.5s ease; white-space: nowrap; }
        #whatsapp-button { background-color: var(--whatsapp-green); border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; position: relative; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); transition: transform 0.2s ease-out, box-shadow 0.2s ease-out; }
        #whatsapp-button:hover { transform: scale(1.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2); }
        #whatsapp-button svg { width: 32px; height: 32px; fill: white; } /* Utilisation SVG inline pour WA */
        #whatsapp-badge { /* display géré par JS */ position: absolute; top: -5px; right: -5px; min-width: 22px; height: 22px; background: #DC3545; color: #fff; font-size: 12px; text-align: center; line-height: 22px; border-radius: 50%; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); animation: pulse 1.5s infinite; padding: 0 5px; }
    `;

    // --- JavaScript Logic ---
    document.addEventListener("DOMContentLoaded", () => {

        // Inject HTML Structure
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'whatalead-widget-container';
        widgetContainer.innerHTML = widgetHTML;
        document.body.appendChild(widgetContainer);

        // Inject CSS
        const styleElement = document.createElement('style');
        styleElement.textContent = widgetCSS;
        document.head.appendChild(styleElement);

         // Inject Font Awesome if WhatsApp is enabled (alternative to external link)
         // Or use SVG like below
        const whatsappButtonIconContainer = document.getElementById("whatsapp-button");
        if (whatsappButtonIconContainer && GlobalConfig.enableWhatsApp) {
            // Using inline SVG for WhatsApp icon to avoid external dependencies like FontAwesome if possible
            whatsappButtonIconContainer.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor">
                    <!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.-->
                    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 221.9-99.6 221.9-222 0-59.3-25.2-115-67.1-157zm-157 .3c98.1 0 178.5 79.8 178.5 178.5 0 31.8-8.3 61.6-23.4 87.3l-17.6 26.3 50.6 13.4-13.6-49.8-27.9-17.3c-27.6 16.6-59.7 26.6-94.1 26.6-98.1 0-178.5-79.8-178.5-178.5S125.8 97.4 223.9 97.4zm78.7 152.4c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                </svg>
                <div id="whatsapp-badge" style="display: none;">${WhatsAppUIConfig.whatsappBadgeContent || ''}</div>
            `;
        }


        /* Références DOM (après injection) */
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

        // 2. Initialiser l'ID si nécessaire
        const initializeChat = async () => {
            if (activeMode === 'chatbot_only' || activeMode === 'both') {
                 // Vérifier si URL existe avant d'initialiser
                 if (!ChatbotUIConfig.initialWebhookURL) {
                     console.warn("Whatalead Widget: Chatbot enabled but initialWebhookURL is not configured. Chatbot may not function correctly.");
                     // Permettre quand même au chat de s'ouvrir, mais l'envoi échouera probablement.
                     chatHistory = loadChatHistory();
                 } else {
                    conversationId = await initializeChatSession(ChatbotUIConfig.initialWebhookURL);
                    if (conversationId) {
                        chatHistory = loadChatHistory();
                    } else {
                        console.error("Whatalead Widget: Failed to initialize conversation ID.");
                    }
                 }
            }
        };

        // 3. Fonctions UI et Timers (pour être appelées par update)
        const initChatbotUI = () => {
            if (chatTitle && ChatbotUIConfig.chatbotName) {
                 chatTitle.textContent = ChatbotUIConfig.chatbotName;
            }
            if (helpText && ChatbotUIConfig.helpText) {
                 helpText.textContent = ChatbotUIConfig.helpText;
            } else if (helpText) {
                 helpText.style.display = 'none'; // Ensure it's hidden if no text
            }
            if (notificationBadge && ChatbotUIConfig.badgeContent) {
                 notificationBadge.textContent = ChatbotUIConfig.badgeContent;
                 // Display handled by runChatbotTimers
            } else if (notificationBadge) {
                 notificationBadge.style.display = 'none';
            }
            if (chatAvatar && ChatbotUIConfig.avatarURL) {
                 chatAvatar.src = ChatbotUIConfig.avatarURL;
                 chatAvatar.style.display = 'block';
            } else if (chatAvatar) {
                chatAvatar.style.display = 'none';
            }
        };
        const initWhatsAppUI = () => {
            if (whatsappText && WhatsAppUIConfig.whatsappHelpText) {
                 whatsappText.textContent = WhatsAppUIConfig.whatsappHelpText;
            } else if (whatsappText) {
                 whatsappText.style.display = 'none'; // Ensure it's hidden if no text
            }
             if (whatsappBadge && WhatsAppUIConfig.whatsappBadgeContent) {
                 whatsappBadge.textContent = WhatsAppUIConfig.whatsappBadgeContent;
                 // Display handled by runWhatsAppTimers
            } else if (whatsappBadge) {
                whatsappBadge.style.display = 'none';
            }
        };
        const clearTimers = () => {
            if (helpTextTimerId) clearTimeout(helpTextTimerId);
            if (helpTextHideTimerId) clearTimeout(helpTextHideTimerId);
            if (whatsappTimerId) clearTimeout(whatsappTimerId);
            if (whatsappHideTimerId) clearTimeout(whatsappHideTimerId);
            helpTextTimerId = helpTextHideTimerId = whatsappTimerId = whatsappHideTimerId = null;
            // Cacher les textes si timers sont clear (ex: au clic)
            if (helpText) helpText.style.display = "none";
            if (whatsappText) whatsappText.style.display = "none";
             // Cacher les badges aussi
             if (notificationBadge) notificationBadge.style.display = "none";
             if (whatsappBadge) whatsappBadge.style.display = "none";
        };
        const runChatbotTimers = () => {
            clearTimers(); // Clear WA timers if any
            if (!helpText || !notificationBadge) return;

            // Ne démarrer le timer que si le texte d'aide existe
            if (ChatbotUIConfig.helpText && ChatbotUIConfig.helpTextDelay >= 0) {
                helpTextTimerId = setTimeout(() => {
                    if (helpText) helpText.style.display = "block";

                    // Afficher le badge en même temps que le texte d'aide, si configuré
                    if (notificationBadge && ChatbotUIConfig.badgeContent) {
                         notificationBadge.style.display = "block";
                    }

                    // Cacher le texte (et le badge) après la durée configurée
                    if (ChatbotUIConfig.helpTextDisplayDuration > 0) {
                        helpTextHideTimerId = setTimeout(() => {
                            if (helpText) helpText.style.display = "none";
                            // On laisse potentiellement le badge visible si helpTextDisplayDuration=0
                             if (notificationBadge && ChatbotUIConfig.badgeContent) {
                                 // notificationBadge.style.display = "none"; // Cache badge avec texte ou le laisser? Décision: cacher
                                  notificationBadge.style.display = "none";
                             }
                        }, ChatbotUIConfig.helpTextDisplayDuration);
                    }
                }, ChatbotUIConfig.helpTextDelay);
            } else if (ChatbotUIConfig.badgeContent) {
                 // Si pas de texte d'aide mais un badge, afficher le badge après un petit délai par défaut?
                 // Ou l'afficher immédiatement avec la bulle? Option: afficher avec délai standard (helpTextDelay ou valeur par défaut)
                 const badgeDelay = ChatbotUIConfig.helpTextDelay >= 0 ? ChatbotUIConfig.helpTextDelay : 1500; // Default delay for badge alone
                 helpTextTimerId = setTimeout(() => { // Re-use timer ID conceptually
                     if (notificationBadge) notificationBadge.style.display = "block";
                     // Pas de timer de masquage pour le badge seul par défaut (il disparaît au clic bulle)
                 }, badgeDelay);
            }
        };
        const runWhatsAppTimers = () => {
            clearTimers(); // Clear Chatbot timers if any
            if (!whatsappText || !whatsappBadge) return;

            // Ne démarrer le timer que si le texte d'aide WA existe
            if (WhatsAppUIConfig.whatsappHelpText && WhatsAppUIConfig.whatsappHelpDelay >= 0) {
                whatsappTimerId = setTimeout(() => {
                     if (whatsappText) whatsappText.style.display = "block";

                     // Afficher le badge WA en même temps, si configuré
                     if (whatsappBadge && WhatsAppUIConfig.whatsappBadgeContent) {
                          whatsappBadge.style.display = "block";
                     }

                    // Cacher le texte (et badge) après la durée configurée
                    if (WhatsAppUIConfig.whatsappHelpDisplayDuration > 0) {
                        whatsappHideTimerId = setTimeout(() => {
                            if (whatsappText) whatsappText.style.display = "none";
                            if (whatsappBadge && WhatsAppUIConfig.whatsappBadgeContent) {
                                whatsappBadge.style.display = "none"; // Cache badge avec texte
                            }
                        }, WhatsAppUIConfig.whatsappHelpDisplayDuration);
                    }
                }, WhatsAppUIConfig.whatsappHelpDelay);
            } else if (WhatsAppUIConfig.whatsappBadgeContent) {
                 // Si pas de texte d'aide WA mais un badge, afficher le badge après un petit délai
                 const badgeDelay = WhatsAppUIConfig.whatsappHelpDelay >= 0 ? WhatsAppUIConfig.whatsappHelpDelay : 1500; // Default delay
                 whatsappTimerId = setTimeout(() => { // Re-use timer ID
                     if (whatsappBadge) whatsappBadge.style.display = "block";
                      // Pas de timer de masquage par défaut
                 }, badgeDelay);
            }
        };


        // ===> 4. Fonction pour mettre à jour la visibilité (appelée au load et au resize) <===
        const updateWidgetVisibility = () => {
            const isCurrentlyMobile = window.innerWidth <= 600;
            // console.log(`Updating Visibility - Mode: ${activeMode}, Mobile: ${isCurrentlyMobile}`);

            // Cacher tout par défaut avant de décider quoi montrer (sauf si chat ouvert)
            const isChatOpen = chatContainer && chatContainer.classList.contains('active');

            if (!isChatOpen) {
                if (chatBubble) chatBubble.style.display = 'none';
                if (whatsappButtonContainer) whatsappButtonContainer.style.display = 'none';
                clearTimers(); // Efface les timers et cache les textes/badges associés
            }

            switch (activeMode) {
                case 'chatbot_only':
                    initChatbotUI();
                    if (chatBubble && !isChatOpen) {
                         chatBubble.style.display = 'flex';
                         runChatbotTimers();
                     }
                    break;
                case 'whatsapp_only':
                    initWhatsAppUI();
                     if (whatsappButtonContainer && !isChatOpen) { // Ne pas afficher si chat est ouvert (ne devrait pas arriver ici mais par sécurité)
                         whatsappButtonContainer.style.display = 'flex';
                         runWhatsAppTimers();
                     }
                    break;
                case 'both':
                     initChatbotUI(); // Init both for potential switch
                     initWhatsAppUI();
                    if (isCurrentlyMobile) {
                        // Mobile: Priorité WhatsApp
                         if (whatsappButtonContainer && !isChatOpen) {
                             whatsappButtonContainer.style.display = 'flex';
                             runWhatsAppTimers();
                         }
                         if (chatBubble) chatBubble.style.display = 'none'; // Hide chatbot bubble
                    } else {
                        // Desktop: Priorité Chatbot
                         if (chatBubble && !isChatOpen) {
                             chatBubble.style.display = 'flex';
                             runChatbotTimers();
                         }
                        if (whatsappButtonContainer) whatsappButtonContainer.style.display = 'none'; // Hide WhatsApp button
                    }
                    break;
                case 'none':
                default:
                    // Assurer que tout est caché et timers arrêtés
                    if (chatBubble) chatBubble.style.display = 'none';
                    if (whatsappButtonContainer) whatsappButtonContainer.style.display = 'none';
                    clearTimers();
                    break;
            }

             // S'assurer que le chat ouvert reste fermé lors du resize si on passe sur mobile en mode 'both'
             if (isCurrentlyMobile && activeMode === 'both' && isChatOpen) {
                 closeChatWindow(); // Use a function to ensure proper cleanup
             }
        };

        // ===> 5. Initialisation et écouteurs <===
        initializeChat().then(() => {
             updateWidgetVisibility(); // Appel initial après init session (si nécessaire)
             window.addEventListener('resize', debounce(updateWidgetVisibility, 250));
        });

        // ===> 6. Fonctions et Listeners principaux <===
        const scrollToBottom = () => {
            setTimeout(() => { if (chatBody) chatBody.scrollTop = chatBody.scrollHeight; }, 50);
        }
        const appendMessage = (text, type, skipAnimation = false) => {
            if (!chatBody || !text) return; // Ne rien ajouter si pas de body ou texte vide
            const messageDiv = document.createElement("div");
            const className = type === 'user' ? 'user-message' : 'bot-message';
            messageDiv.classList.add(className);
            // Basic sanitization (replace < > to prevent HTML injection)
            messageDiv.textContent = text;
            if (skipAnimation) messageDiv.style.animation = 'none';
            chatBody.appendChild(messageDiv);
            scrollToBottom();
        }
        const showTypingIndicator = () => {
             if (!chatBody || chatBody.querySelector('.typing-indicator')) return;
             const typingDiv = document.createElement("div");
             typingDiv.classList.add("bot-message", "typing-indicator");
             typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
             chatBody.appendChild(typingDiv);
             scrollToBottom();
        }
        const removeTypingIndicator = () => {
            if (!chatBody) return;
            const indicator = chatBody.querySelector('.typing-indicator');
            if (indicator) chatBody.removeChild(indicator);
        }
        const populateChatFromHistory = () => {
            if (!chatBody) return;
            chatBody.innerHTML = ''; // Clear previous messages
            if (chatHistory.length === 0) {
                 // Optionnel: Ajouter un message de bienvenue initial si l'historique est vide
                 // Modifier ici si besoin d'un message différent ou basé sur config
                 // appendMessage("Bonjour ! Comment puis-je vous aider ?", 'bot', true);
            } else {
                chatHistory.forEach(msg => appendMessage(msg.text, msg.type, true));
            }
            scrollToBottom();
        }
        const sendMessage = () => {
            if (!conversationId && (activeMode === 'chatbot_only' || activeMode === 'both')) {
                console.error("Whatalead Widget Error: Cannot send message - Conversation ID is missing.");
                appendMessage("Désolé, une erreur technique empêche l'envoi de messages.", 'bot');
                return;
            }
             if (!ChatbotUIConfig.messageWebhookURL) {
                console.error("Whatalead Widget Error: Cannot send message - messageWebhookURL is not configured.");
                appendMessage("Désolé, la configuration du chatbot est incomplète.", 'bot');
                return;
             }
            if (!chatInput) return;
            const messageText = chatInput.value.trim();
            if (!messageText) return;

            appendMessage(messageText, 'user');
            chatHistory.push({ type: 'user', text: messageText });
            saveChatHistory(chatHistory);
            chatInput.value = "";
            showTypingIndicator();

            const payload = {
                message: messageText,
                websiteConvId: conversationId,
                // original_url: ChatbotUIConfig.messageWebhookURL, // Pas forcément utile côté client
                current_webpage: window.location.href
            };

            fetch(ChatbotUIConfig.messageWebhookURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) {
                    // Essayer de lire le texte d'erreur du corps de la réponse
                    return response.text().then(text => {
                        throw new Error(`HTTP error ${response.status} - ${text || response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                removeTypingIndicator();
                const replyText = data.reply || data.message || "Je n'ai pas bien compris."; // Fallback reply
                appendMessage(replyText, 'bot');
                chatHistory.push({ type: 'bot', text: replyText });
                saveChatHistory(chatHistory);
            })
            .catch((error) => {
                console.error("Whatalead Widget Error sending message:", error);
                removeTypingIndicator();
                // Fournir un message d'erreur plus générique à l'utilisateur
                const errorText = "Désolé, une erreur technique est survenue. Veuillez réessayer plus tard.";
                appendMessage(errorText, 'bot');
                chatHistory.push({ type: 'bot', text: errorText }); // Save error state? Maybe not.
                // saveChatHistory(chatHistory);
            });
        };

        const openChatWindow = () => {
             clearTimers(); // Hide help texts/badges
             populateChatFromHistory();
             if (chatContainer) {
                 chatContainer.style.display = "flex";
                 // Force reflow before adding class for transition
                 void chatContainer.offsetWidth;
                 chatContainer.classList.add("active");
             }
             if (chatBubble) chatBubble.style.display = "none";
             if (whatsappButtonContainer) whatsappButtonContainer.style.display = 'none'; // Hide WA button if visible
             setTimeout(() => { if (chatInput) chatInput.focus(); }, 300); // Focus after transition
        };

        const closeChatWindow = () => {
             if (chatContainer) chatContainer.classList.remove("active");
             setTimeout(() => {
                 if (chatContainer) chatContainer.style.display = "none";
                 updateWidgetVisibility(); // Restore appropriate button (Chat or WA) based on mode/size
             }, 300); // Wait for transition
        };


        // Attacher listeners Chatbot (si pertinent)
        if (activeMode === 'chatbot_only' || activeMode === 'both') {
             if (chatBubble) {
                 chatBubble.addEventListener("click", openChatWindow);
             }
             if (chatClose) {
                 chatClose.addEventListener("click", closeChatWindow);
             }
             if (chatSend) {
                 chatSend.addEventListener("click", sendMessage);
             }
             if (chatInput) {
                 chatInput.addEventListener("keypress", (e) => {
                     if (e.key === "Enter" && !e.shiftKey) {
                         e.preventDefault();
                         sendMessage();
                     }
                 });
             }
        }

        // Attacher listeners WhatsApp (si pertinent)
         if (activeMode === 'whatsapp_only' || activeMode === 'both') {
             if (whatsappButton) {
                 whatsappButton.addEventListener("click", () => {
                     clearTimers(); // Hide help text/badge
                     const message = WhatsAppUIConfig.whatsappMessage || ''; // Use configured message or empty
                     // Avertissement: Le numéro de téléphone n'est pas dans la config client.
                     // Il doit être géré côté serveur ou ajouté à WhatsAppUIConfig si nécessaire.
                     // Pour l'instant, on ouvre juste le lien avec le message pré-rempli.
                     // Si un numéro est nécessaire, il faudrait l'ajouter ici. Ex: const phone = "123456789";
                     // const whatsappURL = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                     const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`; // Ouvre juste WA avec message
                     window.open(whatsappURL, "_blank", "noopener,noreferrer");
                 });
            }
        }


        /***********************************************
         * FONCTIONS UTILITAIRES (gardées de l'original)
         ***********************************************/
        function loadChatHistory() {
            try {
                const history = sessionStorage.getItem('whatalead_chatHistory');
                return history ? JSON.parse(history) : [];
            } catch (e) {
                console.error("Error loading chat history:", e);
                return [];
            }
        }
        function saveChatHistory(history) {
             try {
                sessionStorage.setItem('whatalead_chatHistory', JSON.stringify(history));
            } catch (e) {
                 console.error("Error saving chat history:", e);
            }
        }
        async function initializeChatSession(initialWebhookURL) {
            console.log("Whatalead: Initializing session...");
            let conversationId = sessionStorage.getItem('whatalead_websiteConvId');
            const payload = {
                current_webpage: window.location.href,
                // Inclure l'ID existant s'il y en a un pour que le backend puisse le réutiliser ou le valider
                ...(conversationId && { websiteConvId: conversationId })
            };

             if(conversationId){
                 console.log("Whatalead: Existing session ID found:", conversationId);
                 // Optionnel: Re-valider l'ID auprès du backend ? Pour l'instant on le réutilise.
                 // return conversationId; // On peut le retourner directement si on ne re-valide pas
             } else {
                 console.log("Whatalead: No existing session ID found, requesting new one.");
             }

            try {
                const response = await fetch(initialWebhookURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    // Tenter de lire le message d'erreur du backend
                     let errorBody = await response.text();
                    throw new Error(`HTTP error ${response.status} during session initialization: ${errorBody || response.statusText}`);
                }

                 // Même si on avait un ID, on lit la réponse pour voir si le backend en fournit un nouveau/confirmé
                const data = await response.json();

                if (data && data.websiteConvId) {
                     if (conversationId && conversationId !== data.websiteConvId) {
                         console.warn(`Whatalead: Backend returned a different session ID (${data.websiteConvId}). Updating stored ID.`);
                     } else if (!conversationId) {
                         console.log("Whatalead: New session ID received:", data.websiteConvId);
                     }
                    conversationId = data.websiteConvId;
                    sessionStorage.setItem('whatalead_websiteConvId', conversationId);
                    return conversationId;
                } else {
                     // Le backend a répondu OK mais n'a pas renvoyé d'ID
                     if (conversationId) {
                         console.log("Whatalead: Backend confirmed session without returning ID. Re-using existing ID:", conversationId);
                         return conversationId; // On continue avec l'ID existant
                     } else {
                        console.error("Whatalead Widget Error: Session initialization successful but no websiteConvId received from backend.");
                        return null;
                     }
                }
            } catch (error) {
                console.error("Whatalead Widget Error during session initialization:", error);
                 // En cas d'échec réseau/serveur, si on avait un ID, on peut tenter de le réutiliser ?
                 // Ou considérer la session comme échouée ? Option: retourner l'ancien ID si existant.
                // return sessionStorage.getItem('whatalead_websiteConvId'); // Peut retourner null
                 return null; // Préférable de considérer l'initialisation comme échouée.
            }
        }

        // Fonction Debounce (gardée de l'original)
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

    }); // Fin DOMContentLoaded

})(); // Fin IIFE
