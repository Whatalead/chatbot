// ==================================
// == Whatalead Chatbot Module ==
// ==================================
(function() {
    "use strict";

    // --- Configuration par défaut spécifique au Chatbot ---
    const CHATBOT_DEFAULTS = {
        GlobalConfig: { enableChatbot: true }, // Note: enableWhatsApp n'est plus pertinent ici
        ChatbotUIConfig: { chatbotName: "Assistant Virtuel", avatarURL: null, helpText: "Une question ?", helpTextDelay: 2500, helpTextDisplayDuration: 6000, badgeContent: null, initialWebhookURL: null, messageWebhookURL: null },
        // Seules les couleurs utilisées par le chatbot sont listées ici par souci de clarté,
        // mais elles seront lues depuis la config globale partagée.
        ColorConfig: {
            '--bubble-gradient-start': '#007BFF', '--bubble-gradient-end': '#00C6FF',
            '--header-gradient-start': '#007BFF', '--header-gradient-end': '#00C6FF',
            '--header-text-color': '#fff', '--chat-bg-color': '#fff',
            '--chat-body-bg': '#f7f9fc', '--bot-bubble-bg': '#e9ecef',
            '--user-bubble-bg': '#007BFF', '--user-bubble-text-color': '#fff',
            '--chat-border-radius': '12px', '--bubble-border-radius': '50%',
            '--msg-border-radius': '10px', '--transition-duration': '0.3s',
            '--box-shadow-intense': '0 10px 25px rgba(0,0,0,0.12)',
            '--box-shadow-soft': '0 4px 10px rgba(0,0,0,0.1)'
            // '--whatsapp-green' n'est pas utilisé directement par le chatbot UI
        }
    };

    // --- Fonctions Utilitaires (Nécessaires pour le Chatbot) ---
    function mergeDeep(target, source) { /* ... (code inchangé) ... */
        const output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) { Object.assign(output, { [key]: source[key] }); }
                    else { output[key] = mergeDeep(target[key], source[key]); }
                } else { if (source[key] !== undefined) { Object.assign(output, { [key]: source[key] }); } }
            });
        }
        return output;
    }
    function isObject(item) { /* ... (code inchangé) ... */ return (item && typeof item === 'object' && !Array.isArray(item)); }
    function loadChatHistory() { /* ... (code inchangé) ... */ try { const h = sessionStorage.getItem('whatalead_chatHistory'); return h ? JSON.parse(h) : []; } catch (e) { console.error("Erreur lecture historique chat:", e); return []; } }
    function saveChatHistory(history) { /* ... (code inchangé) ... */ try { sessionStorage.setItem('whatalead_chatHistory', JSON.stringify(history)); } catch (e) { console.error("Erreur sauvegarde historique chat:", e); } }
    async function initializeChatSession(initialWebhookURL, currentConvId) { /* ... (code inchangé) ... */
        if (!initialWebhookURL) { console.error("Whatalead Chatbot: 'initialWebhookURL' n'est pas configuré."); return currentConvId || null; }
        console.log("Initialisation session chat...");
        let conversationId = currentConvId || sessionStorage.getItem('whatalead_websiteConvId');
        const payload = { current_webpage: window.location.href };
        if (conversationId) { console.log("ID conversation existant:", conversationId); payload.websiteConvId = conversationId; }
        else { console.log("Nouvel ID conversation."); }
        try {
            const response = await fetch(initialWebhookURL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) { throw new Error(`Erreur HTTP ${response.status} initialisation.`); }
            if (!conversationId) {
                const data = await response.json();
                if (data && data.websiteConvId) { conversationId = data.websiteConvId; sessionStorage.setItem('whatalead_websiteConvId', conversationId); console.log("ID conversation reçu:", conversationId); }
                else { console.error("ID conversation manquant dans réponse init."); return null; }
            } else { console.log("Init avec ID existant."); }
            return conversationId;
        } catch (error) { console.error("Erreur init session chat:", error); return conversationId || null; }
    }
    function debounce(func, wait) { /* ... (code inchangé) ... */ let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }

    // --- CSS Spécifique au Chatbot ---
    const CHATBOT_CSS = `:root{/* Variables utilisées par le chatbot, seront définies par la config globale */}:root{--bubble-gradient-start:#007BFF;--bubble-gradient-end:#00C6FF;--header-gradient-start:#007BFF;--header-gradient-end:#00C6FF;--header-text-color:#fff;--chat-bg-color:#fff;--chat-body-bg:#f7f9fc;--bot-bubble-bg:#e9ecef;--user-bubble-bg:#007BFF;--user-bubble-text-color:#fff;--chat-border-radius:12px;--bubble-border-radius:50%;--msg-border-radius:10px;--transition-duration:.3s;--box-shadow-intense:0 10px 25px rgba(0,0,0,.12);--box-shadow-soft:0 4px 10px rgba(0,0,0,.1)}#whatalead-chatbot-container *{margin:0;padding:0;box-sizing:border-box}#whatalead-chatbot-container{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#333}#chat-container{display:none;position:fixed;bottom:95px;right:20px;width:min(370px,90vw);height:520px;background:var(--chat-bg-color);border-radius:var(--chat-border-radius);box-shadow:var(--box-shadow-intense);z-index:2147483646;flex-direction:column;overflow:hidden;transition:all var(--transition-duration) ease;opacity:0;transform:translateY(20px) scale(.95)}#chat-container.active{opacity:1;transform:translateY(0) scale(1)}#chat-window{display:flex;flex-direction:column;height:100%}#chat-window-header{display:flex;align-items:center;padding:12px 15px;background:linear-gradient(135deg,var(--header-gradient-start),var(--header-gradient-end));color:var(--header-text-color);border-top-left-radius:var(--chat-border-radius);border-top-right-radius:var(--chat-border-radius);flex-shrink:0}#chat-header-avatar{display:none;width:36px;height:36px;border-radius:50%;margin-right:12px;object-fit:cover;border:2px solid rgba(255,255,255,.5)}#header-info{flex-grow:1;display:flex;flex-direction:column}#chat-window-header h4{font-size:1.05rem;font-weight:600;line-height:1.2;margin-bottom:2px}#online-indicator{font-size:.8rem;display:flex;align-items:center;opacity:.85}#online-indicator::before{content:"";display:inline-block;width:7px;height:7px;background-color:#34C759;border-radius:50%;margin-right:5px}#chat-close{background:none;border:none;font-size:1.4rem;color:var(--header-text-color);cursor:pointer;transition:transform .2s,opacity .2s;padding:5px;margin-left:10px;opacity:.8}#chat-close:hover{transform:scale(1.1);opacity:1}#chat-window-body{flex:1;padding:15px;overflow-y:auto;background:var(--chat-body-bg);display:flex;flex-direction:column}.bot-message,.user-message{margin:6px 0;padding:10px 14px;border-radius:var(--msg-border-radius);max-width:85%;line-height:1.45;box-shadow:0 1px 1px rgba(0,0,0,.05);animation:whatalead-fadeIn .3s ease-out}@keyframes whatalead-fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.bot-message{background:var(--bot-bubble-bg);align-self:flex-start;color:#212529;border-bottom-left-radius:4px}.user-message{background:var(--user-bubble-bg);color:var(--user-bubble-text-color);align-self:flex-end;margin-left:auto;border-bottom-right-radius:4px}#chat-window-footer{display:flex;padding:10px 15px;border-top:1px solid #e0e0e0;background:#fff;flex-shrink:0}#chat-input{flex:1;padding:10px 15px;border:1px solid #ced4da;border-radius:20px;margin-right:10px;outline:none;font-size:.95rem;transition:border-color .3s,box-shadow .3s}#chat-input:focus{border-color:var(--bubble-gradient-start);box-shadow:0 0 0 3px rgba(0,123,255,.15)}#chat-send{padding:9px 18px;background:linear-gradient(135deg,var(--header-gradient-start),var(--header-gradient-end));color:#fff;border:none;border-radius:20px;cursor:pointer;font-size:.95rem;font-weight:500;transition:all .2s ease-out;box-shadow:0 2px 4px rgba(0,123,255,.2)}#chat-send:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,123,255,.25)}#chat-send:active:not(:disabled){transform:translateY(0);box-shadow:0 1px 2px rgba(0,123,255,.2)}#chat-send:disabled{opacity:.7;cursor:not-allowed}#chat-input:disabled{background-color:#e9ecef}#chat-footer-info{text-align:center;padding:8px;font-size:11px;color:#888;background:#f8f9fa;border-bottom-left-radius:var(--chat-border-radius);border-bottom-right-radius:var(--chat-border-radius);flex-shrink:0}#chat-footer-info a{color:#6c757d;text-decoration:none;transition:color .2s}#chat-footer-info a:hover{color:#0056b3;text-decoration:underline}#chat-bubble{display:none;position:fixed;bottom:20px;right:20px;width:60px;height:60px;background:linear-gradient(135deg,var(--bubble-gradient-start),var(--bubble-gradient-end));border-radius:var(--bubble-border-radius);box-shadow:0 5px 15px rgba(0,123,255,.3);cursor:pointer;z-index:2147483647;justify-content:center;align-items:center;transition:all var(--transition-duration) ease-out}#chat-bubble:hover{transform:scale(1.08);box-shadow:0 8px 22px rgba(0,123,255,.35)}#chat-bubble svg{width:30px;height:30px;fill:var(--header-text-color)}#notification-badge{display:none;position:absolute;top:-5px;right:-5px;min-width:22px;height:22px;background:#DC3545;color:#fff;font-size:12px;text-align:center;line-height:22px;border-radius:50%;font-weight:700;box-shadow:0 2px 5px rgba(0,0,0,.2);animation:whatalead-pulse 1.5s infinite;padding:0 5px}@keyframes whatalead-pulse{0%{transform:scale(1);box-shadow:0 2px 5px rgba(0,0,0,.2)}50%{transform:scale(1.1);box-shadow:0 4px 10px rgba(0,0,0,.3)}100%{transform:scale(1);box-shadow:0 2px 5px rgba(0,0,0,.2)}}#help-text{display:none;position:fixed;bottom:35px;right:95px;background:#343a40;color:#fff;padding:9px 15px;border-radius:8px;font-size:13px;z-index:2147483645;box-shadow:var(--box-shadow-soft);animation:whatalead-fadeInHelp .5s ease-out;white-space:nowrap}@keyframes whatalead-fadeInHelp{from{opacity:0;transform:translateX(15px)}to{opacity:1;transform:translateX(0)}}.typing-indicator{padding:10px 14px!important;background:var(--bot-bubble-bg)!important}.typing-indicator .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background-color:rgba(0,0,0,.4);margin:0 2px;animation:whatalead-typingDots 1.2s infinite ease-in-out}.typing-indicator .dot:nth-child(2){animation-delay:.2s}.typing-indicator .dot:nth-child(3){animation-delay:.4s}@keyframes whatalead-typingDots{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`;

    // --- HTML Spécifique au Chatbot ---
    const CHATBOT_HTML = `<div id="chat-container"><div id="chat-window"><div id="chat-window-header"><img id="chat-header-avatar" src="" alt="Avatar"><div id="header-info"><h4 id="chat-title"></h4><span id="online-indicator">En ligne</span></div><button id="chat-close" aria-label="Fermer le chat">✕</button></div><div id="chat-window-body" aria-live="polite"></div><div id="chat-window-footer"><input type="text" id="chat-input" placeholder="Écrire un message..." aria-label="Votre message" autocomplete="off"><button id="chat-send">Envoyer</button></div><div id="chat-footer-info"><a href="https://whatalead.app" target="_blank" rel="noopener noreferrer" title="Whatalead">Powered by Whatalead</a></div></div></div><div id="chat-bubble"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg><div id="notification-badge"></div></div><div id="help-text"></div>`;

    // --- Fonction Principale d'Initialisation du Chatbot ---
    async function initializeChatbot() {
        const userConfig = window.WhataleadChatbotConfig || {};
        // Fusionne la config utilisateur avec les défauts du chatbot ET les défauts généraux
        const Config = mergeDeep(mergeDeep(CHATBOT_DEFAULTS, { ColorConfig: DEFAULTS.ColorConfig }), userConfig); // S'assure d'avoir toutes les couleurs par défaut
        console.log("Whatalead Chatbot Module - Config:", Config);

        // --- Vérification Activation Chatbot ---
        if (!Config.GlobalConfig.enableChatbot) {
            console.log("Whatalead Chatbot Module: Désactivé par la configuration.");
            return;
        }

        // --- Vérifications Configuration Chatbot ---
        if (!Config.ChatbotUIConfig.initialWebhookURL || !Config.ChatbotUIConfig.messageWebhookURL) {
            console.error("Whatalead Chatbot Module: 'initialWebhookURL' ou 'messageWebhookURL' manquant. Chatbot non initialisé.");
            return;
        }

        // --- Injection Dépendances et Styles ---
        const styleElement = document.createElement('style');
        styleElement.textContent = CHATBOT_CSS;
        document.head.appendChild(styleElement);

        // Appliquer les couleurs de la configuration globale
        const root = document.documentElement;
        const globalDefaults = DEFAULTS || { ColorConfig: {} }; // Fallback
        for (const [key, value] of Object.entries(Config.ColorConfig)) {
            // Vérifie si la clé existe dans les défauts globaux pour éviter d'injecter n'importe quoi
            if (value && globalDefaults.ColorConfig.hasOwnProperty(key)) {
                root.style.setProperty(key, value);
            }
        }


        // --- Injection HTML ---
        const chatbotContainer = document.createElement('div');
        chatbotContainer.id = 'whatalead-chatbot-container'; // Conteneur spécifique
        chatbotContainer.innerHTML = CHATBOT_HTML;
        document.body.appendChild(chatbotContainer);

        // --- Références DOM ---
        const chatContainer = document.getElementById("chat-container");
        const chatBubble = document.getElementById("chat-bubble");
        const chatClose = document.getElementById("chat-close");
        const chatTitle = document.getElementById("chat-title");
        const chatAvatar = document.getElementById("chat-header-avatar");
        const chatInput = document.getElementById("chat-input");
        const chatSend = document.getElementById("chat-send");
        const chatBody = document.getElementById("chat-window-body");
        const helpTextEl = document.getElementById("help-text");
        const notificationBadgeEl = document.getElementById("notification-badge");

        // Vérification de la création des éléments essentiels
        if (!chatContainer || !chatBubble || !chatClose || !chatInput || !chatSend || !chatBody || !helpTextEl || !notificationBadgeEl) {
             console.error("Whatalead Chatbot Module: Échec création éléments HTML essentiels. Arrêt.");
             if (chatbotContainer) document.body.removeChild(chatbotContainer);
             if (styleElement) document.head.removeChild(styleElement);
             return;
        }

        // --- Variables d'état ---
        let conversationId = null;
        let chatHistory = [];
        let helpTextTimerId = null;
        let helpTextHideTimerId = null;
        let isChatOpen = false;

        // --- Initialisation Session Chat ---
        conversationId = await initializeChatSession(Config.ChatbotUIConfig.initialWebhookURL);
        if (conversationId) {
            chatHistory = loadChatHistory();
        } else {
            console.warn("Whatalead Chatbot Module: ID de session non obtenu. L'historique ne sera pas chargé.");
        }

        // --- Fonctions UI Chatbot ---
        const initChatbotUI = () => {
            chatTitle.textContent = Config.ChatbotUIConfig.chatbotName || '';
            if (Config.ChatbotUIConfig.avatarURL) {
                chatAvatar.src = Config.ChatbotUIConfig.avatarURL;
                chatAvatar.style.display = 'block';
            } else {
                chatAvatar.style.display = 'none';
            }
            // Afficher la bulle si le chatbot est activé
            chatBubble.style.display = 'flex';
        };

        // --- Gestion des Timers Chatbot ---
        const clearChatbotTimers = () => {
            if (helpTextTimerId) clearTimeout(helpTextTimerId);
            if (helpTextHideTimerId) clearTimeout(helpTextHideTimerId);
            helpTextTimerId = helpTextHideTimerId = null;
        };

        const runChatbotTimers = () => {
            clearChatbotTimers();
            if (isChatOpen) return; // Ne pas afficher si le chat est ouvert

            if (Config.ChatbotUIConfig.helpText) {
                helpTextTimerId = setTimeout(() => {
                    if (isChatOpen) return; // Double check
                    helpTextEl.textContent = Config.ChatbotUIConfig.helpText;
                    helpTextEl.style.display = "block";
                    if (Config.ChatbotUIConfig.helpTextDisplayDuration > 0) {
                        helpTextHideTimerId = setTimeout(() => { helpTextEl.style.display = "none"; }, Config.ChatbotUIConfig.helpTextDisplayDuration);
                    }
                }, Config.ChatbotUIConfig.helpTextDelay);
            } else {
                helpTextEl.style.display = 'none';
            }

            if (Config.ChatbotUIConfig.badgeContent) {
                 // Le timeout du badge est souvent le même que celui du help text
                setTimeout(() => {
                    if (isChatOpen) return;
                    notificationBadgeEl.textContent = Config.ChatbotUIConfig.badgeContent;
                    notificationBadgeEl.style.display = "block";
                }, Config.ChatbotUIConfig.helpTextDelay); // Utilise le même délai que helpText par défaut
            } else {
                notificationBadgeEl.style.display = 'none';
            }
        };

        // --- Fonctions Gestion Chat ---
        const scrollToBottom = () => { /* ... (code inchangé) ... */ setTimeout(() => { if(chatBody) chatBody.scrollTop = chatBody.scrollHeight; }, 50); };
        const appendMessage = (text, type, skipAnimation = false) => { /* ... (code inchangé) ... */ if (!chatBody || !text) return; const d = document.createElement("div"); const c = type === 'user' ? 'user-message' : 'bot-message'; d.classList.add(c); d.textContent = text; if (skipAnimation) d.style.animation = 'none'; chatBody.appendChild(d); scrollToBottom(); };
        const showTypingIndicator = () => { /* ... (code inchangé) ... */ if (!chatBody || chatBody.querySelector('.typing-indicator')) return; const d = document.createElement("div"); d.classList.add("bot-message", "typing-indicator"); d.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>'; chatBody.appendChild(d); scrollToBottom(); };
        const removeTypingIndicator = () => { /* ... (code inchangé) ... */ if (!chatBody) return; const i = chatBody.querySelector('.typing-indicator'); if (i) chatBody.removeChild(i); };
        const populateChatFromHistory = () => { /* ... (code inchangé) ... */ if (!chatBody) return; chatBody.innerHTML = ''; if (chatHistory.length === 0) { appendMessage("Bonjour ! Comment puis-je vous aider ?", 'bot', true); } else { chatHistory.forEach(msg => appendMessage(msg.text, msg.type, true)); } scrollToBottom(); };
        const sendMessage = async () => { /* ... (code inchangé, utilise Config.ChatbotUIConfig.messageWebhookURL) ... */
             if (!chatInput || !Config.ChatbotUIConfig.messageWebhookURL) return; const userText = chatInput.value.trim(); if (!userText) return;
             if (!conversationId) { conversationId = await initializeChatSession(Config.ChatbotUIConfig.initialWebhookURL); if (!conversationId) { appendMessage("Désolé, une erreur technique empêche l'envoi du message.", 'bot'); return; } }
             appendMessage(userText, 'user'); chatHistory.push({ type: 'user', text: userText }); saveChatHistory(chatHistory); chatInput.value = ""; chatInput.disabled = true; chatSend.disabled = true; showTypingIndicator();
             const payload = { message: userText, websiteConvId: conversationId, current_webpage: window.location.href };
             try {
                const response = await fetch(Config.ChatbotUIConfig.messageWebhookURL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) }); removeTypingIndicator();
                if (!response.ok) { let eT = `HTTP ${response.status}`; try { const eB = await response.text(); eT += ` - ${eB||response.statusText}`; } catch (_) {} throw new Error(eT); }
                const data = await response.json(); const replyText = data.reply || data.message || "..."; appendMessage(replyText, 'bot'); chatHistory.push({ type: 'bot', text: replyText }); saveChatHistory(chatHistory);
             } catch (error) { console.error("Erreur envoi/reception message:", error); removeTypingIndicator(); const eM = "Désolé, une erreur technique est survenue."; appendMessage(eM, 'bot'); chatHistory.push({ type: 'bot', text: eM }); saveChatHistory(chatHistory); }
             finally { chatInput.disabled = false; chatSend.disabled = false; chatInput.focus(); }
         };

         // --- Gestion de la Visibilité / État ---
         const manageChatbotDisplay = () => {
             if (!isChatOpen) {
                 chatBubble.style.display = 'flex';
                 runChatbotTimers(); // Lance les timers pour help text / badge
             } else {
                 chatBubble.style.display = 'none';
                 clearChatbotTimers(); // Arrête les timers si le chat est ouvert
                 helpTextEl.style.display = 'none';
                 notificationBadgeEl.style.display = 'none';
             }
         };


        // --- Listeners d'Événements Chatbot ---
        chatBubble.addEventListener("click", () => {
            console.log("Chat bubble clicked.");
            isChatOpen = true;
            clearChatbotTimers(); // Arrêter les timers
            helpTextEl.style.display = 'none';
            notificationBadgeEl.style.display = 'none';
            populateChatFromHistory();
            chatContainer.style.display = "flex";
            void chatContainer.offsetWidth; // Force reflow pour l'animation
            chatContainer.classList.add("active");
            chatBubble.style.display = "none";
            // Masquer aussi le bouton WhatsApp s'il existe (bonne pratique)
            const whatsappButton = document.getElementById('whatsapp-button-container');
            if (whatsappButton) whatsappButton.style.display = 'none';
            const whatsappHelp = document.getElementById('whatsapp-text');
            if (whatsappHelp) whatsappHelp.style.display = 'none';

            setTimeout(() => { chatInput.focus(); }, 350); // Focus après l'animation d'ouverture
        });

        chatClose.addEventListener("click", () => {
            console.log("Chat close clicked.");
            isChatOpen = false;
            chatContainer.classList.remove("active");
            // Utilise la variable CSS pour la durée de transition
            const transitionDuration = parseFloat(root.style.getPropertyValue('--transition-duration') || '0.3') * 1000;
            setTimeout(() => {
                chatContainer.style.display = "none";
                manageChatbotDisplay(); // Réaffiche la bulle et relance les timers
                // Réafficher le bouton WhatsApp s'il existe et est activé (géré par l'autre module)
                const whatsappModule = window.WhataleadWhatsAppModule; // Accès hypothétique
                if(whatsappModule && whatsappModule.manageWhatsAppDisplay) {
                    whatsappModule.manageWhatsAppDisplay();
                } else {
                   // Fallback si l'autre module n'est pas chargé ou n'expose pas la fonction
                   const whatsappButton = document.getElementById('whatsapp-button-container');
                   const globalConfig = window.WhataleadChatbotConfig || {};
                   if (whatsappButton && globalConfig.GlobalConfig && globalConfig.GlobalConfig.enableWhatsApp) {
                       whatsappButton.style.display = 'flex';
                       // On pourrait aussi essayer de relancer les timers WhatsApp ici, mais c'est plus propre via son module
                   }
                }
            }, transitionDuration);
        });

        chatSend.addEventListener("click", sendMessage);
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // --- Initialisation & Resize Listener ---
        initChatbotUI();
        manageChatbotDisplay(); // Gère l'affichage initial de la bulle et les timers
        // Le listener de resize est moins crucial maintenant qu'il n'y a plus de switch mobile/desktop
        // On le garde au cas où des styles seraient dépendants de la taille.
        window.addEventListener('resize', debounce(manageChatbotDisplay, 250));

        console.log("Whatalead Chatbot Module Initialisé.");

        // Exposer une fonction pour permettre au module WhatsApp de notifier la fermeture du chat
        window.WhataleadChatbotModule = {
            manageChatbotDisplay // Expose la fonction pour la visibilité
        };


    } // --- Fin de initializeChatbot ---


    // --- Lancement ---
    // Récupère les DEFAULTS globaux qui étaient définis dans l'ancien scope
    const DEFAULTS = {
        GlobalConfig: { enableChatbot: true, enableWhatsApp: true },
        ChatbotUIConfig: { chatbotName: "Assistant Virtuel", avatarURL: null, helpText: "Une question ?", helpTextDelay: 2500, helpTextDisplayDuration: 6000, badgeContent: null, initialWebhookURL: null, messageWebhookURL: null },
        WhatsAppUIConfig: { whatsappPhoneNumber: null, whatsappHelpText: "Questions ? Sur WhatsApp !", whatsappHelpDelay: 2000, whatsappHelpDisplayDuration: 7000, whatsappMessage: "Bonjour !", whatsappBadgeContent: null },
        ColorConfig: { '--bubble-gradient-start': '#007BFF', '--bubble-gradient-end': '#00C6FF', '--header-gradient-start': '#007BFF', '--header-gradient-end': '#00C6FF', '--header-text-color': '#fff', '--chat-bg-color': '#fff', '--chat-body-bg': '#f7f9fc', '--bot-bubble-bg': '#e9ecef', '--user-bubble-bg': '#007BFF', '--user-bubble-text-color': '#fff', '--chat-border-radius': '12px', '--bubble-border-radius': '50%', '--msg-border-radius': '10px', '--transition-duration': '0.3s', '--box-shadow-intense': '0 10px 25px rgba(0,0,0,0.12)', '--box-shadow-soft': '0 4px 10px rgba(0,0,0,0.1)', '--whatsapp-green': '#25D366' }
    };


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeChatbot);
    } else {
        initializeChatbot();
    }

})(); // --- Fin de l'IIFE Chatbot ---
