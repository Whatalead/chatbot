(function() {
    "use strict";

    const DEFAULTS = {
        GlobalConfig: { enableChatbot: true, enableWhatsApp: true },
        ChatbotUIConfig: { chatbotName: "Assistant Virtuel", avatarURL: null, helpText: "Une question ?", helpTextDelay: 2500, helpTextDisplayDuration: 6000, badgeContent: null, initialWebhookURL: null, messageWebhookURL: null },
        WhatsAppUIConfig: { whatsappPhoneNumber: null, whatsappHelpText: "Questions ? Sur WhatsApp !", whatsappHelpDelay: 2000, whatsappHelpDisplayDuration: 7000, whatsappMessage: "Bonjour !", whatsappBadgeContent: null },
        ColorConfig: { '--bubble-gradient-start': '#007BFF', '--bubble-gradient-end': '#00C6FF', '--header-gradient-start': '#007BFF', '--header-gradient-end': '#00C6FF', '--header-text-color': '#fff', '--chat-bg-color': '#fff', '--chat-body-bg': '#f7f9fc', '--bot-bubble-bg': '#e9ecef', '--user-bubble-bg': '#007BFF', '--user-bubble-text-color': '#fff', '--chat-border-radius': '12px', '--bubble-border-radius': '50%', '--msg-border-radius': '10px', '--transition-duration': '0.3s', '--box-shadow-intense': '0 10px 25px rgba(0,0,0,0.12)', '--box-shadow-soft': '0 4px 10px rgba(0,0,0,0.1)', '--whatsapp-green': '#25D366' }
    };

    function mergeDeep(target, source) {
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
    function isObject(item) { return (item && typeof item === 'object' && !Array.isArray(item)); }
    function loadChatHistory() { try { const h = sessionStorage.getItem('whatalead_chatHistory'); return h ? JSON.parse(h) : []; } catch (e) { console.error("Erreur lecture historique chat:", e); return []; } }
    function saveChatHistory(history) { try { sessionStorage.setItem('whatalead_chatHistory', JSON.stringify(history)); } catch (e) { console.error("Erreur sauvegarde historique chat:", e); } }
    async function initializeChatSession(initialWebhookURL, currentConvId) {
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
    function debounce(func, wait) { let timeout; return function executedFunction(...args) { const later = () => { clearTimeout(timeout); func(...args); }; clearTimeout(timeout); timeout = setTimeout(later, wait); }; }

    // --- MODIFICATION CSS : Cible le SVG au lieu de i ---
    const WIDGET_CSS = `:root{--bubble-gradient-start:#007BFF;--bubble-gradient-end:#00C6FF;--header-gradient-start:#007BFF;--header-gradient-end:#00C6FF;--header-text-color:#fff;--chat-bg-color:#fff;--chat-body-bg:#f7f9fc;--bot-bubble-bg:#e9ecef;--user-bubble-bg:#007BFF;--user-bubble-text-color:#fff;--chat-border-radius:12px;--bubble-border-radius:50%;--msg-border-radius:10px;--transition-duration:.3s;--box-shadow-intense:0 10px 25px rgba(0,0,0,.12);--box-shadow-soft:0 4px 10px rgba(0,0,0,.1);--whatsapp-green:#25D366}#whatalead-widget-container *{margin:0;padding:0;box-sizing:border-box}#whatalead-widget-container{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#333}#chat-container{display:none;position:fixed;bottom:95px;right:20px;width:min(370px,90vw);height:520px;background:var(--chat-bg-color);border-radius:var(--chat-border-radius);box-shadow:var(--box-shadow-intense);z-index:2147483646;flex-direction:column;overflow:hidden;transition:all var(--transition-duration) ease;opacity:0;transform:translateY(20px) scale(.95)}#chat-container.active{opacity:1;transform:translateY(0) scale(1)}#chat-window{display:flex;flex-direction:column;height:100%}#chat-window-header{display:flex;align-items:center;padding:12px 15px;background:linear-gradient(135deg,var(--header-gradient-start),var(--header-gradient-end));color:var(--header-text-color);border-top-left-radius:var(--chat-border-radius);border-top-right-radius:var(--chat-border-radius);flex-shrink:0}#chat-header-avatar{display:none;width:36px;height:36px;border-radius:50%;margin-right:12px;object-fit:cover;border:2px solid rgba(255,255,255,.5)}#header-info{flex-grow:1;display:flex;flex-direction:column}#chat-window-header h4{font-size:1.05rem;font-weight:600;line-height:1.2;margin-bottom:2px}#online-indicator{font-size:.8rem;display:flex;align-items:center;opacity:.85}#online-indicator::before{content:"";display:inline-block;width:7px;height:7px;background-color:#34C759;border-radius:50%;margin-right:5px}#chat-close{background:none;border:none;font-size:1.4rem;color:var(--header-text-color);cursor:pointer;transition:transform .2s,opacity .2s;padding:5px;margin-left:10px;opacity:.8}#chat-close:hover{transform:scale(1.1);opacity:1}#chat-window-body{flex:1;padding:15px;overflow-y:auto;background:var(--chat-body-bg);display:flex;flex-direction:column}.bot-message,.user-message{margin:6px 0;padding:10px 14px;border-radius:var(--msg-border-radius);max-width:85%;line-height:1.45;box-shadow:0 1px 1px rgba(0,0,0,.05);animation:whatalead-fadeIn .3s ease-out}@keyframes whatalead-fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.bot-message{background:var(--bot-bubble-bg);align-self:flex-start;color:#212529;border-bottom-left-radius:4px}.user-message{background:var(--user-bubble-bg);color:var(--user-bubble-text-color);align-self:flex-end;margin-left:auto;border-bottom-right-radius:4px}#chat-window-footer{display:flex;padding:10px 15px;border-top:1px solid #e0e0e0;background:#fff;flex-shrink:0}#chat-input{flex:1;padding:10px 15px;border:1px solid #ced4da;border-radius:20px;margin-right:10px;outline:none;font-size:.95rem;transition:border-color .3s,box-shadow .3s}#chat-input:focus{border-color:var(--bubble-gradient-start);box-shadow:0 0 0 3px rgba(0,123,255,.15)}#chat-send{padding:9px 18px;background:linear-gradient(135deg,var(--header-gradient-start),var(--header-gradient-end));color:#fff;border:none;border-radius:20px;cursor:pointer;font-size:.95rem;font-weight:500;transition:all .2s ease-out;box-shadow:0 2px 4px rgba(0,123,255,.2)}#chat-send:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,123,255,.25)}#chat-send:active:not(:disabled){transform:translateY(0);box-shadow:0 1px 2px rgba(0,123,255,.2)}#chat-send:disabled{opacity:.7;cursor:not-allowed}#chat-input:disabled{background-color:#e9ecef}#chat-footer-info{text-align:center;padding:8px;font-size:11px;color:#888;background:#f8f9fa;border-bottom-left-radius:var(--chat-border-radius);border-bottom-right-radius:var(--chat-border-radius);flex-shrink:0}#chat-footer-info a{color:#6c757d;text-decoration:none;transition:color .2s}#chat-footer-info a:hover{color:#0056b3;text-decoration:underline}#chat-bubble{display:none;position:fixed;bottom:20px;right:20px;width:60px;height:60px;background:linear-gradient(135deg,var(--bubble-gradient-start),var(--bubble-gradient-end));border-radius:var(--bubble-border-radius);box-shadow:0 5px 15px rgba(0,123,255,.3);cursor:pointer;z-index:2147483647;justify-content:center;align-items:center;transition:all var(--transition-duration) ease-out}#chat-bubble:hover{transform:scale(1.08);box-shadow:0 8px 22px rgba(0,123,255,.35)}#chat-bubble svg{width:30px;height:30px;fill:var(--header-text-color)}#notification-badge{display:none;position:absolute;top:-5px;right:-5px;min-width:22px;height:22px;background:#DC3545;color:#fff;font-size:12px;text-align:center;line-height:22px;border-radius:50%;font-weight:700;box-shadow:0 2px 5px rgba(0,0,0,.2);animation:whatalead-pulse 1.5s infinite;padding:0 5px}@keyframes whatalead-pulse{0%{transform:scale(1);box-shadow:0 2px 5px rgba(0,0,0,.2)}50%{transform:scale(1.1);box-shadow:0 4px 10px rgba(0,0,0,.3)}100%{transform:scale(1);box-shadow:0 2px 5px rgba(0,0,0,.2)}}#help-text{display:none;position:fixed;bottom:35px;right:95px;background:#343a40;color:#fff;padding:9px 15px;border-radius:8px;font-size:13px;z-index:2147483645;box-shadow:var(--box-shadow-soft);animation:whatalead-fadeInHelp .5s ease-out;white-space:nowrap}@keyframes whatalead-fadeInHelp{from{opacity:0;transform:translateX(15px)}to{opacity:1;transform:translateX(0)}}.typing-indicator{padding:10px 14px!important;background:var(--bot-bubble-bg)!important}.typing-indicator .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background-color:rgba(0,0,0,.4);margin:0 2px;animation:whatalead-typingDots 1.2s infinite ease-in-out}.typing-indicator .dot:nth-child(2){animation-delay:.2s}.typing-indicator .dot:nth-child(3){animation-delay:.4s}@keyframes whatalead-typingDots{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}#whatsapp-button-container{display:none;position:fixed;bottom:20px;right:20px;z-index:2147483647;flex-direction:row-reverse;align-items:center}#whatsapp-text{display:none;background:#fff;color:#333;padding:9px 14px;border-radius:8px;font-size:13px;margin-right:12px;box-shadow:0 2px 8px rgba(0,0,0,.15);animation:whatalead-fadeInHelp .5s ease;white-space:nowrap}#whatsapp-button{background-color:var(--whatsapp-green);border:none;width:60px;height:60px;border-radius:50%;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:transform .2s ease-out,box-shadow .2s ease-out}#whatsapp-button:hover{transform:scale(1.05);box-shadow:0 6px 16px rgba(0,0,0,.2)}#whatsapp-button svg{width:32px;height:32px;fill:#fff;}#whatsapp-badge{display:none;position:absolute;top:-5px;right:-5px;min-width:22px;height:22px;background:#DC3545;color:#fff;font-size:12px;text-align:center;line-height:22px;border-radius:50%;font-weight:700;box-shadow:0 2px 5px rgba(0,0,0,.2);animation:whatalead-pulse 1.5s infinite;padding:0 5px}`;

    // --- MODIFICATION HTML : Remplace <i> par <svg> ---
    // (Note: J'utilise un SVG simple et courant pour WhatsApp. Vous pouvez remplacer le contenu de <path> si vous préférez une autre version)
    const WIDGET_HTML = `<div id="chat-container"><div id="chat-window"><div id="chat-window-header"><img id="chat-header-avatar" src="" alt="Avatar"><div id="header-info"><h4 id="chat-title"></h4><span id="online-indicator">En ligne</span></div><button id="chat-close" aria-label="Fermer le chat">✕</button></div><div id="chat-window-body" aria-live="polite"></div><div id="chat-window-footer"><input type="text" id="chat-input" placeholder="Écrire un message..." aria-label="Votre message" autocomplete="off"><button id="chat-send">Envoyer</button></div><div id="chat-footer-info"><a href="https://whatalead.app" target="_blank" rel="noopener noreferrer" title="Whatalead">Powered by Whatalead</a></div></div></div><div id="chat-bubble"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg><div id="notification-badge"></div></div><div id="help-text"></div><div id="whatsapp-button-container"><button id="whatsapp-button" aria-label="Contacter via WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg><div id="whatsapp-badge"></div></button><div id="whatsapp-text"></div></div>`;

    async function initializeWidget() {
        const userConfig = window.WhataleadChatbotConfig || {};
        const Config = mergeDeep(DEFAULTS, userConfig);
        console.log("Whatalead Config:", Config);

        // --- Vérifications Configuration ---
        if (Config.GlobalConfig.enableChatbot && (!Config.ChatbotUIConfig.initialWebhookURL || !Config.ChatbotUIConfig.messageWebhookURL)) { console.error("Whatalead Chatbot: Webhooks manquants. Chatbot désactivé."); Config.GlobalConfig.enableChatbot = false; }
        if (Config.GlobalConfig.enableWhatsApp && !Config.WhatsAppUIConfig.whatsappPhoneNumber) { console.error("Whatalead Chatbot: Numéro WhatsApp manquant. WhatsApp désactivé."); Config.GlobalConfig.enableWhatsApp = false; }
        if (!Config.GlobalConfig.enableChatbot && !Config.GlobalConfig.enableWhatsApp) { console.log("Whatalead Widget: Arrêt car rien n'est activé."); return; }

        // --- Injection Dépendances et Styles ---
        // On garde le chargement de Font Awesome au cas où il serait utilisé ailleurs ou pour d'autres icônes futures.
        if (!document.querySelector('link[href*="font-awesome"]')) { const faLink = document.createElement('link'); faLink.rel = 'stylesheet'; faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'; document.head.appendChild(faLink); }
        const styleElement = document.createElement('style'); styleElement.textContent = WIDGET_CSS; document.head.appendChild(styleElement);
        const root = document.documentElement;
        for (const [key, value] of Object.entries(Config.ColorConfig)) { if (value && DEFAULTS.ColorConfig.hasOwnProperty(key)) { root.style.setProperty(key, value); } }

        // --- Injection HTML ---
        const widgetContainer = document.createElement('div'); widgetContainer.id = 'whatalead-widget-container'; widgetContainer.innerHTML = WIDGET_HTML; document.body.appendChild(widgetContainer);

        // --- Références DOM ---
        const chatContainer = document.getElementById("chat-container"), chatBubble = document.getElementById("chat-bubble"), chatClose = document.getElementById("chat-close"), chatTitle = document.getElementById("chat-title"), chatAvatar = document.getElementById("chat-header-avatar"), chatInput = document.getElementById("chat-input"), chatSend = document.getElementById("chat-send"), chatBody = document.getElementById("chat-window-body"), helpTextEl = document.getElementById("help-text"), notificationBadgeEl = document.getElementById("notification-badge"), whatsappButtonContainer = document.getElementById("whatsapp-button-container"), whatsappTextEl = document.getElementById("whatsapp-text"), whatsappButton = document.getElementById("whatsapp-button"), whatsappBadgeEl = document.getElementById("whatsapp-badge");
        if (!chatContainer || !chatBubble || !whatsappButtonContainer) { console.error("Whatalead Widget: Échec création HTML. Arrêt."); if (widgetContainer) document.body.removeChild(widgetContainer); if (styleElement) document.head.removeChild(styleElement); return; }

        // --- Variables d'état ---
        let conversationId = null;
        let chatHistory = [];
        let activeMode = 'none';
        let helpTextTimerId = null;
        let helpTextHideTimerId = null;
        let whatsappTimerId = null;
        let whatsappHideTimerId = null;
        let isChatOpen = false;
        let isWhatsAppHelpSequenceActive = false;

        // --- Détermination Mode Actif ---
        if (Config.GlobalConfig.enableChatbot && Config.GlobalConfig.enableWhatsApp) activeMode = 'both'; else if (Config.GlobalConfig.enableChatbot) activeMode = 'chatbot_only'; else if (Config.GlobalConfig.enableWhatsApp) activeMode = 'whatsapp_only';
        console.log("Whatalead Widget - Mode:", activeMode);

        // --- Initialisation Session Chat (si nécessaire) ---
        if (activeMode === 'chatbot_only' || activeMode === 'both') { conversationId = await initializeChatSession(Config.ChatbotUIConfig.initialWebhookURL); if (conversationId) { chatHistory = loadChatHistory(); } else { console.warn("Whatalead Chatbot: ID session non obtenu."); } }

        // --- Fonctions UI ---
        const initChatbotUI = () => { chatTitle.textContent = Config.ChatbotUIConfig.chatbotName || ''; if (Config.ChatbotUIConfig.avatarURL) { chatAvatar.src = Config.ChatbotUIConfig.avatarURL; chatAvatar.style.display = 'block'; } else { chatAvatar.style.display = 'none'; } };
        const initWhatsAppUI = () => {}; // Rien de spécifique ici pour le moment

        // --- Gestion des Timers (modifiée) ---
        const clearTimers = () => {
            console.log("Clearing timers..."); // Debug
            if (helpTextTimerId) clearTimeout(helpTextTimerId);
            if (helpTextHideTimerId) clearTimeout(helpTextHideTimerId);
            if (whatsappTimerId) clearTimeout(whatsappTimerId);
            if (whatsappHideTimerId) clearTimeout(whatsappHideTimerId);
            helpTextTimerId = helpTextHideTimerId = whatsappTimerId = whatsappHideTimerId = null;
            isWhatsAppHelpSequenceActive = false;
            console.log("Timers cleared. WhatsApp sequence inactive."); // Debug
        };

        const runChatbotTimers = () => {
            clearTimers();
            if (!Config.GlobalConfig.enableChatbot || isChatOpen) return;

            if (Config.ChatbotUIConfig.helpText) {
                helpTextTimerId = setTimeout(() => {
                    if (isChatOpen) return;
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
                setTimeout(() => {
                    if (isChatOpen) return;
                    notificationBadgeEl.textContent = Config.ChatbotUIConfig.badgeContent;
                    notificationBadgeEl.style.display = "block";
                }, Config.ChatbotUIConfig.helpTextDelay);
            } else {
                notificationBadgeEl.style.display = 'none';
            }
        };

        const runWhatsAppTimers = () => {
            if (isWhatsAppHelpSequenceActive) {
                console.log("WhatsApp help sequence already active, skipping.");
                return;
            }

            clearTimers();
            if (!Config.GlobalConfig.enableWhatsApp) return;

            if (Config.WhatsAppUIConfig.whatsappHelpText) {
                console.log("Starting new WhatsApp help sequence...");
                isWhatsAppHelpSequenceActive = true;

                whatsappTimerId = setTimeout(() => {
                    if (!isWhatsAppHelpSequenceActive) {
                         console.log("WhatsApp sequence was cancelled before text display.");
                         return;
                    }
                    console.log("WhatsApp help timer fired. Displaying text.");
                    whatsappTextEl.textContent = Config.WhatsAppUIConfig.whatsappHelpText;
                    whatsappTextEl.style.fontWeight = 'bold';
                    whatsappTextEl.style.display = "block";

                    if (Config.WhatsAppUIConfig.whatsappHelpDisplayDuration > 0) {
                        whatsappHideTimerId = setTimeout(() => {
                             if (!isWhatsAppHelpSequenceActive) {
                                console.log("WhatsApp sequence was cancelled before hiding text.");
                                return;
                             }
                            console.log("Hiding WhatsApp help text and ending sequence.");
                            whatsappTextEl.style.display = "none";
                            isWhatsAppHelpSequenceActive = false;
                        }, Config.WhatsAppUIConfig.whatsappHelpDisplayDuration);
                    } else {
                        console.log("WhatsApp help text stays visible. Sequence active until cleared.");
                    }
                }, Config.WhatsAppUIConfig.whatsappHelpDelay);
            } else {
                whatsappTextEl.style.display = 'none';
                isWhatsAppHelpSequenceActive = false;
            }

            if (Config.WhatsAppUIConfig.whatsappBadgeContent) {
                setTimeout(() => {
                    whatsappBadgeEl.textContent = Config.WhatsAppUIConfig.whatsappBadgeContent;
                    whatsappBadgeEl.style.display = "block";
                }, Config.WhatsAppUIConfig.whatsappHelpDelay);
            } else {
                whatsappBadgeEl.style.display = 'none';
            }
        };

        // --- Gestion de la Visibilité ---
        const updateWidgetVisibility = () => {
            if (isChatOpen) return;

            const isCurrentlyMobile = window.innerWidth <= 600;

            chatBubble.style.display = 'none';
            whatsappButtonContainer.style.display = 'none';
            helpTextEl.style.display = 'none';
            whatsappTextEl.style.display = 'none';
            notificationBadgeEl.style.display = 'none';
            whatsappBadgeEl.style.display = 'none';

            clearTimers(); // Nettoyer avant de relancer

            switch (activeMode) {
                case 'chatbot_only':
                    initChatbotUI();
                    chatBubble.style.display = 'flex';
                    runChatbotTimers();
                    break;
                case 'whatsapp_only':
                    initWhatsAppUI();
                    whatsappButtonContainer.style.display = 'flex';
                    runWhatsAppTimers();
                    break;
                case 'both':
                    initChatbotUI();
                    initWhatsAppUI();
                    if (isCurrentlyMobile) {
                        whatsappButtonContainer.style.display = 'flex';
                        runWhatsAppTimers();
                    } else {
                        chatBubble.style.display = 'flex';
                        runChatbotTimers();
                    }
                    break;
                case 'none': default: break;
            }
         };

        // --- Fonctions Gestion Chat --- (inchangées)
        const scrollToBottom = () => { setTimeout(() => { if(chatBody) chatBody.scrollTop = chatBody.scrollHeight; }, 50); };
        const appendMessage = (text, type, skipAnimation = false) => { if (!chatBody || !text) return; const d = document.createElement("div"); const c = type === 'user' ? 'user-message' : 'bot-message'; d.classList.add(c); d.textContent = text; if (skipAnimation) d.style.animation = 'none'; chatBody.appendChild(d); scrollToBottom(); };
        const showTypingIndicator = () => { if (!chatBody || chatBody.querySelector('.typing-indicator')) return; const d = document.createElement("div"); d.classList.add("bot-message", "typing-indicator"); d.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>'; chatBody.appendChild(d); scrollToBottom(); };
        const removeTypingIndicator = () => { if (!chatBody) return; const i = chatBody.querySelector('.typing-indicator'); if (i) chatBody.removeChild(i); };
        const populateChatFromHistory = () => { if (!chatBody) return; chatBody.innerHTML = ''; if (chatHistory.length === 0) { appendMessage("Bonjour ! Comment puis-je vous aider ?", 'bot', true); } else { chatHistory.forEach(msg => appendMessage(msg.text, msg.type, true)); } scrollToBottom(); };
        const sendMessage = async () => {
             if (!chatInput || !Config.ChatbotUIConfig.messageWebhookURL) return; const userText = chatInput.value.trim(); if (!userText) return;
             if (!conversationId) { conversationId = await initializeChatSession(Config.ChatbotUIConfig.initialWebhookURL); if (!conversationId) { appendMessage("Désolé, erreur technique.", 'bot'); return; } }
             appendMessage(userText, 'user'); chatHistory.push({ type: 'user', text: userText }); saveChatHistory(chatHistory); chatInput.value = ""; chatInput.disabled = true; chatSend.disabled = true; showTypingIndicator();
             const payload = { message: userText, websiteConvId: conversationId, current_webpage: window.location.href };
             try {
                const response = await fetch(Config.ChatbotUIConfig.messageWebhookURL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) }); removeTypingIndicator();
                if (!response.ok) { let eT = `HTTP ${response.status}`; try { const eB = await response.text(); eT += ` - ${eB||response.statusText}`; } catch (_) {} throw new Error(eT); }
                const data = await response.json(); const replyText = data.reply || data.message || "..."; appendMessage(replyText, 'bot'); chatHistory.push({ type: 'bot', text: replyText }); saveChatHistory(chatHistory);
             } catch (error) { console.error("Erreur msg:", error); removeTypingIndicator(); const eM = "Erreur technique."; appendMessage(eM, 'bot'); chatHistory.push({ type: 'bot', text: eM }); saveChatHistory(chatHistory); }
             finally { chatInput.disabled = false; chatSend.disabled = false; chatInput.focus(); }
         };

        // --- Listeners d'Événements ---
        if (activeMode === 'chatbot_only' || activeMode === 'both') {
            chatBubble.addEventListener("click", () => {
                console.log("Chat bubble clicked.");
                clearTimers();
                helpTextEl.style.display = 'none'; notificationBadgeEl.style.display = 'none';
                isChatOpen = true; populateChatFromHistory(); chatContainer.style.display = "flex"; void chatContainer.offsetWidth; chatContainer.classList.add("active");
                chatBubble.style.display = "none"; if (whatsappButtonContainer) whatsappButtonContainer.style.display = 'none'; if (whatsappTextEl) whatsappTextEl.style.display = 'none';
                setTimeout(() => { chatInput.focus(); }, 350);
            });
            chatClose.addEventListener("click", () => {
                console.log("Chat close clicked.");
                isChatOpen = false; chatContainer.classList.remove("active");
                setTimeout(() => {
                    chatContainer.style.display = "none";
                    updateWidgetVisibility();
                }, parseFloat(root.style.getPropertyValue('--transition-duration') || '0.3') * 1000);
            });
            chatSend.addEventListener("click", sendMessage);
            chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
        }
        if (activeMode === 'whatsapp_only' || activeMode === 'both') {
            whatsappButton.addEventListener("click", () => {
                console.log("WhatsApp button clicked.");
                clearTimers();
                whatsappTextEl.style.display = 'none'; whatsappBadgeEl.style.display = 'none';
                const phone = Config.WhatsAppUIConfig.whatsappPhoneNumber.replace(/\D/g, '');
                const message = encodeURIComponent(Config.WhatsAppUIConfig.whatsappMessage || '');
                window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
            });
        }

        // --- Initialisation & Resize Listener ---
        updateWidgetVisibility();
        window.addEventListener('resize', debounce(updateWidgetVisibility, 250));

        console.log("Whatalead Widget Initialisé.");
    } // --- Fin de initializeWidget ---

    // --- Lancement ---
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeWidget); }
    else { initializeWidget(); }

})(); // --- Fin de l'IIFE ---
