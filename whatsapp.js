// ====================================
// == Whatalead WhatsApp Module ==
// ====================================
(function() {
    "use strict";

    // --- Configuration par défaut spécifique à WhatsApp ---
    const WHATSAPP_DEFAULTS = {
        GlobalConfig: { enableWhatsApp: true }, // Note: enableChatbot n'est plus pertinent ici
        WhatsAppUIConfig: { whatsappPhoneNumber: null, whatsappHelpText: "Questions ? Sur WhatsApp !", whatsappHelpDelay: 2000, whatsappHelpDisplayDuration: 7000, whatsappMessage: "Bonjour !", whatsappBadgeContent: null },
        // Seules les couleurs utilisées par WhatsApp sont listées ici par souci de clarté
        ColorConfig: {
            '--whatsapp-green': '#25D366',
            // Couleurs pour badge et ombre potentiellement partagées
            '--box-shadow-soft': '0 4px 10px rgba(0,0,0,0.1)',
             // Autres couleurs (comme le rouge du badge) pourraient être ajoutées si nécessaire
        }
    };

    // --- Fonctions Utilitaires (Nécessaires pour WhatsApp) ---
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
    // Pas besoin de : loadChatHistory, saveChatHistory, initializeChatSession, debounce ici

    // --- CSS Spécifique à WhatsApp ---
    const WHATSAPP_CSS = `:root{/* Variables utilisées par WhatsApp, seront définies par la config globale */}:root{--whatsapp-green:#25D366;--box-shadow-soft:0 4px 10px rgba(0,0,0,.1)}#whatalead-whatsapp-container *{margin:0;padding:0;box-sizing:border-box}#whatalead-whatsapp-container{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif}#whatsapp-button-container{display:none;position:fixed;bottom:20px;right:20px;z-index:2147483647;flex-direction:row-reverse;align-items:center}#whatsapp-text{display:none;background:#fff;color:#333;padding:9px 14px;border-radius:8px;font-size:13px;margin-right:12px;box-shadow:var(--box-shadow-soft);animation:whatalead-fadeInHelp .5s ease;white-space:nowrap}/* Keyframes réutilisé du CSS original si nécessaire */@keyframes whatalead-fadeInHelp{from{opacity:0;transform:translateX(15px)}to{opacity:1;transform:translateX(0)}}#whatsapp-button{background-color:var(--whatsapp-green);border:none;width:60px;height:60px;border-radius:50%;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:transform .2s ease-out,box-shadow .2s ease-out}#whatsapp-button:hover{transform:scale(1.05);box-shadow:0 6px 16px rgba(0,0,0,.2)}#whatsapp-button svg{width:32px;height:32px;fill:#fff;}#whatsapp-badge{display:none;position:absolute;top:-5px;right:-5px;min-width:22px;height:22px;background:#DC3545;color:#fff;font-size:12px;text-align:center;line-height:22px;border-radius:50%;font-weight:700;box-shadow:0 2px 5px rgba(0,0,0,.2);animation:whatalead-pulse 1.5s infinite;padding:0 5px}/* Keyframes réutilisé du CSS original si nécessaire */@keyframes whatalead-pulse{0%{transform:scale(1);box-shadow:0 2px 5px rgba(0,0,0,.2)}50%{transform:scale(1.1);box-shadow:0 4px 10px rgba(0,0,0,.3)}100%{transform:scale(1);box-shadow:0 2px 5px rgba(0,0,0,.2)}}`;

    // --- HTML Spécifique à WhatsApp ---
    const WHATSAPP_HTML = `<div id="whatsapp-button-container"><button id="whatsapp-button" aria-label="Contacter via WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg><div id="whatsapp-badge"></div></button><div id="whatsapp-text"></div></div>`;

    // --- Fonction Principale d'Initialisation de WhatsApp ---
    async function initializeWhatsApp() {
        const userConfig = window.WhataleadChatbotConfig || {};
        // Fusionne la config utilisateur avec les défauts WhatsApp ET les défauts généraux
        const Config = mergeDeep(mergeDeep(WHATSAPP_DEFAULTS, { ColorConfig: DEFAULTS.ColorConfig }), userConfig); // S'assure d'avoir toutes les couleurs par défaut
        console.log("Whatalead WhatsApp Module - Config:", Config);

        // --- Vérification Activation WhatsApp ---
        if (!Config.GlobalConfig.enableWhatsApp) {
            console.log("Whatalead WhatsApp Module: Désactivé par la configuration.");
            return;
        }

        // --- Vérifications Configuration WhatsApp ---
        if (!Config.WhatsAppUIConfig.whatsappPhoneNumber) {
            console.error("Whatalead WhatsApp Module: 'whatsappPhoneNumber' manquant. Bouton non initialisé.");
            return;
        }

        // --- Injection Dépendances et Styles ---
        const styleElement = document.createElement('style');
        styleElement.textContent = WHATSAPP_CSS;
        document.head.appendChild(styleElement);

        // Appliquer les couleurs de la configuration globale
        const root = document.documentElement;
        const globalDefaults = DEFAULTS || { ColorConfig: {} }; // Fallback
        for (const [key, value] of Object.entries(Config.ColorConfig)) {
            if (value && globalDefaults.ColorConfig.hasOwnProperty(key)) {
                root.style.setProperty(key, value);
            }
        }


        // --- Injection HTML ---
        const whatsappContainer = document.createElement('div');
        whatsappContainer.id = 'whatalead-whatsapp-container'; // Conteneur spécifique
        whatsappContainer.innerHTML = WHATSAPP_HTML;
        document.body.appendChild(whatsappContainer);

        // --- Références DOM ---
        const whatsappButtonContainer = document.getElementById("whatsapp-button-container");
        const whatsappTextEl = document.getElementById("whatsapp-text");
        const whatsappButton = document.getElementById("whatsapp-button");
        const whatsappBadgeEl = document.getElementById("whatsapp-badge");

        // Vérification de la création des éléments essentiels
        if (!whatsappButtonContainer || !whatsappTextEl || !whatsappButton || !whatsappBadgeEl) {
             console.error("Whatalead WhatsApp Module: Échec création éléments HTML essentiels. Arrêt.");
             if (whatsappContainer) document.body.removeChild(whatsappContainer);
             if (styleElement) document.head.removeChild(styleElement);
             return;
        }

        // --- Variables d'état ---
        let whatsappTimerId = null;
        let whatsappHideTimerId = null;
        let isWhatsAppHelpSequenceActive = false; // Ajouté pour gérer l'état de la séquence d'aide

        // --- Fonctions UI WhatsApp ---
        const initWhatsAppUI = () => {
            // Pas grand chose à initialiser ici pour l'instant, mais la fonction est là
            whatsappButtonContainer.style.display = 'flex'; // Afficher le bouton
        };

        // --- Gestion des Timers WhatsApp ---
        const clearWhatsAppTimers = () => {
            console.log("Clearing WhatsApp timers..."); // Debug
            if (whatsappTimerId) clearTimeout(whatsappTimerId);
            if (whatsappHideTimerId) clearTimeout(whatsappHideTimerId);
            whatsappTimerId = whatsappHideTimerId = null;
            isWhatsAppHelpSequenceActive = false; // S'assurer que la séquence est marquée comme inactive
             console.log("WhatsApp timers cleared. Sequence inactive."); // Debug
       };


        const runWhatsAppTimers = () => {
             if (isWhatsAppHelpSequenceActive) {
                 console.log("WhatsApp help sequence already active, skipping new timers."); // Debug
                 return; // Ne pas relancer si une séquence est déjà en cours
             }

             // Vérifier si le chat est ouvert (si le module chatbot existe)
             const chatContainer = document.getElementById('chat-container');
             if (chatContainer && chatContainer.classList.contains('active')) {
                 console.log("WhatsApp timers skipped, chat window is open.");
                 return; // Ne pas montrer l'aide WhatsApp si le chat est ouvert
             }


             clearWhatsAppTimers(); // Nettoyer les anciens timers avant d'en lancer de nouveaux
             console.log("Attempting to start WhatsApp timers..."); // Debug


            if (Config.WhatsAppUIConfig.whatsappHelpText) {
                console.log("Starting new WhatsApp help sequence..."); // Debug
                isWhatsAppHelpSequenceActive = true; // Marquer la séquence comme active

                whatsappTimerId = setTimeout(() => {
                    if (!isWhatsAppHelpSequenceActive) { // Vérifier si la séquence n'a pas été annulée entre temps
                        console.log("WhatsApp sequence was cancelled before text display."); // Debug
                        return;
                    }
                     console.log("WhatsApp help timer fired. Displaying text."); // Debug
                    whatsappTextEl.textContent = Config.WhatsAppUIConfig.whatsappHelpText;
                    whatsappTextEl.style.fontWeight = 'bold'; // Gardé de l'original
                    whatsappTextEl.style.display = "block";

                    if (Config.WhatsAppUIConfig.whatsappHelpDisplayDuration > 0) {
                        whatsappHideTimerId = setTimeout(() => {
                             if (!isWhatsAppHelpSequenceActive) { // Vérifier avant de masquer
                                console.log("WhatsApp sequence was cancelled before hiding text."); // Debug
                                return;
                             }
                            console.log("Hiding WhatsApp help text and ending sequence."); // Debug
                            whatsappTextEl.style.display = "none";
                            isWhatsAppHelpSequenceActive = false; // Marquer la séquence comme terminée
                        }, Config.WhatsAppUIConfig.whatsappHelpDisplayDuration);
                    } else {
                         console.log("WhatsApp help text stays visible indefinitely (duration <= 0). Sequence remains active until cleared."); // Debug
                         // La séquence reste active jusqu'à ce que clearWhatsAppTimers soit appelé
                    }
                }, Config.WhatsAppUIConfig.whatsappHelpDelay);
            } else {
                whatsappTextEl.style.display = 'none';
                 isWhatsAppHelpSequenceActive = false; // Pas de texte, pas de séquence active
            }

            if (Config.WhatsAppUIConfig.whatsappBadgeContent) {
                 // Le timeout du badge est souvent le même que celui du help text
                setTimeout(() => {
                    // Vérifier si la séquence d'aide n'a pas été annulée et si le chat n'est pas ouvert
                    const chatContainer = document.getElementById('chat-container');
                    if (!isWhatsAppHelpSequenceActive && !Config.WhatsAppUIConfig.whatsappHelpText) {
                         // Si pas de texte d'aide, on vérifie juste si le chat est ouvert
                         if(chatContainer && chatContainer.classList.contains('active')) return;
                    } else if (!isWhatsAppHelpSequenceActive) {
                        // Si une séquence était prévue mais annulée, ne pas afficher le badge non plus
                         console.log("WhatsApp sequence cancelled before badge display timeout.");
                         return;
                    }
                    if(chatContainer && chatContainer.classList.contains('active')) {
                        console.log("WhatsApp badge display skipped, chat window is open.");
                        return;
                    }

                    whatsappBadgeEl.textContent = Config.WhatsAppUIConfig.whatsappBadgeContent;
                    whatsappBadgeEl.style.display = "block";
                 }, Config.WhatsAppUIConfig.whatsappHelpDelay); // Utilise le même délai que helpText par défaut
            } else {
                whatsappBadgeEl.style.display = 'none';
            }
        };


         // --- Gestion de la Visibilité / État ---
         const manageWhatsAppDisplay = () => {
             // Vérifie si le chat est ouvert (si le module existe et est visible)
             const chatContainer = document.getElementById('chat-container');
             const isChatCurrentlyOpen = chatContainer && chatContainer.classList.contains('active');

             if (isChatCurrentlyOpen) {
                 whatsappButtonContainer.style.display = 'none';
                 clearWhatsAppTimers(); // Arrête les timers si le chat est ouvert
                 whatsappTextEl.style.display = 'none';
                 whatsappBadgeEl.style.display = 'none';
             } else {
                 whatsappButtonContainer.style.display = 'flex';
                 runWhatsAppTimers(); // Lance les timers pour help text / badge WhatsApp
             }
         };


        // --- Listeners d'Événements WhatsApp ---
        whatsappButton.addEventListener("click", () => {
            console.log("WhatsApp button clicked.");
            clearWhatsAppTimers(); // Arrêter les timers d'aide
            whatsappTextEl.style.display = 'none';
            whatsappBadgeEl.style.display = 'none';

            const phone = Config.WhatsAppUIConfig.whatsappPhoneNumber.replace(/\D/g, '');
            const message = encodeURIComponent(Config.WhatsAppUIConfig.whatsappMessage || '');
            window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
        });

        // --- Initialisation ---
        initWhatsAppUI();
        manageWhatsAppDisplay(); // Gère l'affichage initial et les timers

        console.log("Whatalead WhatsApp Module Initialisé.");

        // Exposer la fonction pour permettre au module Chatbot de notifier la réapparition du bouton
        window.WhataleadWhatsAppModule = {
             manageWhatsAppDisplay // Expose la fonction pour la visibilité
        };


    } // --- Fin de initializeWhatsApp ---

    // --- Lancement ---
    // Récupère les DEFAULTS globaux qui étaient définis dans l'ancien scope
    const DEFAULTS = {
        GlobalConfig: { enableChatbot: true, enableWhatsApp: true },
        ChatbotUIConfig: { chatbotName: "Assistant Virtuel", avatarURL: null, helpText: "Une question ?", helpTextDelay: 2500, helpTextDisplayDuration: 6000, badgeContent: null, initialWebhookURL: null, messageWebhookURL: null },
        WhatsAppUIConfig: { whatsappPhoneNumber: null, whatsappHelpText: "Questions ? Sur WhatsApp !", whatsappHelpDelay: 2000, whatsappHelpDisplayDuration: 7000, whatsappMessage: "Bonjour !", whatsappBadgeContent: null },
        ColorConfig: { '--bubble-gradient-start': '#007BFF', '--bubble-gradient-end': '#00C6FF', '--header-gradient-start': '#007BFF', '--header-gradient-end': '#00C6FF', '--header-text-color': '#fff', '--chat-bg-color': '#fff', '--chat-body-bg': '#f7f9fc', '--bot-bubble-bg': '#e9ecef', '--user-bubble-bg': '#007BFF', '--user-bubble-text-color': '#fff', '--chat-border-radius': '12px', '--bubble-border-radius': '50%', '--msg-border-radius': '10px', '--transition-duration': '0.3s', '--box-shadow-intense': '0 10px 25px rgba(0,0,0,0.12)', '--box-shadow-soft': '0 4px 10px rgba(0,0,0,0.1)', '--whatsapp-green': '#25D366' }
    };


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWhatsApp);
    } else {
        initializeWhatsApp();
    }

})(); // --- Fin de l'IIFE WhatsApp ---
