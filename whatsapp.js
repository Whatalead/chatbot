// ====================================
// == Whatalead WhatsApp Module ==
// ====================================
(function() {
  "use strict";

  // --- Defaults spécifiques à WhatsApp ---
  const WHATSAPP_DEFAULTS = {
    WhatsAppUIConfig: {
      whatsappPhoneNumber: null,
      whatsappHelpText: "Questions ? Sur WhatsApp !",
      whatsappHelpDelay: 2000,
      whatsappHelpDisplayDuration: 7000,
      whatsappMessage: "Bonjour !",
      whatsappBadgeContent: null,
      showHelpOnce: false
    },
    ColorConfig: {
      '--whatsapp-green': '#25D366',
      '--box-shadow-soft': '0 4px 10px rgba(0,0,0,0.1)'
    }
  };

  // --- Utilitaires de merge deep ---
  function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
  function mergeDeep(target, source) {
    const out = { ...target };
    if (isObject(target) && isObject(source)) {
      for (const key of Object.keys(source)) {
        if (isObject(source[key])) {
          out[key] = mergeDeep(target[key] || {}, source[key]);
        } else if (source[key] !== undefined) {
          out[key] = source[key];
        }
      }
    }
    return out;
  }

  // --- CSS & HTML ---
  const WHATSAPP_CSS = `
:root{--whatsapp-green:#25D366;--box-shadow-soft:0 4px 10px rgba(0,0,0,.1)}
#whatalead-whatsapp-container *{margin:0;padding:0;box-sizing:border-box}
#whatalead-whatsapp-container{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif}
#whatsapp-button-container{display:flex;position:fixed;bottom:20px;right:20px;z-index:2147483647;flex-direction:row-reverse;align-items:center}
#whatsapp-text{display:none;background:#fff;color:#333;padding:9px 14px;border-radius:8px;font-size:13px;margin-right:12px;box-shadow:var(--box-shadow-soft);animation:whatalead-fadeInHelp .5s ease;white-space:nowrap}
@keyframes whatalead-fadeInHelp{from{opacity:0;transform:translateX(15px)}to{opacity:1;transform:translateX(0)}}
#whatsapp-button{background-color:var(--whatsapp-green);border:none;width:60px;height:60px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:transform .2s ease-out,box-shadow .2s ease-out}
#whatsapp-button:hover{transform:scale(1.05);box-shadow:0 6px 16px rgba(0,0,0,.2)}
#whatsapp-button svg{width:32px;height:32px;fill:#fff;}
#whatsapp-badge{display:none;position:absolute;top:-5px;right:-5px;min-width:22px;height:22px;background:#DC3545;color:#fff;font-size:12px;text-align:center;line-height:22px;border-radius:50%;font-weight:700;box-shadow:0 2px 5px rgba(0,0,0,.2);animation:whatalead-pulse 1.5s infinite;padding:0 5px}
@keyframes whatalead-pulse{0%{transform:scale(1);box-shadow:0 2px 5px rgba(0,0,0,.2)}50%{transform:scale(1.1);box-shadow:0 4px 10px rgba(0,0,0,.3)}100%{transform:scale(1);box-shadow:0 2px 5px rgba(0,0,0,.2)}}
`;

  const WHATSAPP_HTML = `
<div id="whatsapp-button-container">
  <button id="whatsapp-button" aria-label="Contacter via WhatsApp">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 
               5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 
               2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 
               11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448
               l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592
               5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89
               -9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 
               2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387
               -5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868
               -2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967
               -.941 1.165-.173.198-.347.223-.644.074-.297-.149
               -1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059
               -.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521
               .151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521
               -.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5
               -.669-.51-.173-.008-.371-.01-.57-.01s-.52.074-.792.372
               c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 
               1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 
               1.262.489 1.694.626.712.226 1.36.194 1.872.118
               .571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29
               .173-1.414z"/>
    </svg>
    <div id="whatsapp-badge"></div>
  </button>
  <div id="whatsapp-text"></div>
</div>`;

  // --- Initialise le DOM et le style ---
  function injectUI() {
    const style = document.createElement('style');
    style.textContent = WHATSAPP_CSS;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'whatalead-whatsapp-container';
    container.innerHTML = WHATSAPP_HTML;
    document.body.appendChild(container);
  }

  // --- Manage timers pour helpText & badge ---
  function runWhatsAppTimers(cfg, textEl, badgeEl) {
    const key = 'whatalead_whatsapp_help_shown';
    const showOnce = cfg.WhatsAppUIConfig.showHelpOnce;
    const already = showOnce && localStorage.getItem(key);

    // Help text (une seule fois si demandé)
    if (!already && cfg.WhatsAppUIConfig.whatsappHelpText) {
      setTimeout(() => {
        textEl.textContent = cfg.WhatsAppUIConfig.whatsappHelpText;
        textEl.style.display = "block";
        if (cfg.WhatsAppUIConfig.whatsappHelpDisplayDuration > 0) {
          setTimeout(() => textEl.style.display = "none",
            cfg.WhatsAppUIConfig.whatsappHelpDisplayDuration
          );
        }
        if (showOnce) localStorage.setItem(key, '1');
      }, cfg.WhatsAppUIConfig.whatsappHelpDelay);
    }

    // Badge (à chaque chargement de page)
    if (cfg.WhatsAppUIConfig.whatsappBadgeContent) {
      setTimeout(() => {
        badgeEl.textContent = cfg.WhatsAppUIConfig.whatsappBadgeContent;
        badgeEl.style.display = "block";
      }, cfg.WhatsAppUIConfig.whatsappHelpDelay);
    }
  }

  // --- Point d'entrée ---
  function initializeWhatsApp() {
    // Empêche les ré-inits (ex: sur SPA navigation)
    if (window.WhataleadWhatsAppModule) return;

    const userCfg = window.WhataleadWhatsAppConfig || {};
    const cfg = mergeDeep(WHATSAPP_DEFAULTS, userCfg);

    if (!cfg.WhatsAppUIConfig.whatsappPhoneNumber) {
      console.error("WhatsApp Module: numéro manquant."); return;
    }

    // Applique les couleurs
    for (const [k,v] of Object.entries(cfg.ColorConfig)) {
      document.documentElement.style.setProperty(k, v);
    }

    injectUI();

    const textEl  = document.getElementById("whatsapp-text");
    const badgeEl = document.getElementById("whatsapp-badge");
    const btn     = document.getElementById("whatsapp-button");

    btn.addEventListener("click", () => {
      textEl.style.display = badgeEl.style.display = "none";
      const phone = cfg.WhatsAppUIConfig.whatsappPhoneNumber.replace(/\D/g, '');
      const msg   = encodeURIComponent(cfg.WhatsAppUIConfig.whatsappMessage);
      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    });

    runWhatsAppTimers(cfg, textEl, badgeEl);

    // Expose pour éviter ré-init
    window.WhataleadWhatsAppModule = { };
    console.log("WhatsApp Module initialisé.");
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWhatsApp);
  } else {
    initializeWhatsApp();
  }
})();
