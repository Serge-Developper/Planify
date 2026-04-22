import { ref } from 'vue'
import type { DynamicThemeFix } from 'darkreader'

export function useAutoDark() {
  const enabled = ref(false)

  let darkReaderPromise: Promise<any> | null = null
  async function init() {
    if (!darkReaderPromise) {
      darkReaderPromise = import('darkreader')
    }
    return await darkReaderPromise
  }

  // Ajout: liste des sélecteurs dont Dark Reader doit ignorer le style inline
  const IGNORE_INLINE_SELECTORS = [
    '[data-darkreader-ignore]',
    '.classic-border-preview',
    '.account-btn',
    '.color-swatch',
    '.user-avatar',
    '.user-avatar-container',
    // Pop-up Profil (leaderboards)
    '.profile-avatar',
    '.profile-avatar-scaler',
    '.profile-avatar-stage',
    '.profile-popup',
    '.profile-popup-overlay'
  ]

  function buildFixCSS(): string {
    return `
      /* Footer en blanc (Dark via DR) */
      .planify-footer,
      .planify-footer *,
      .planify-footer a,
      .planify-footer h5,
      .planify-footer p,
      .planify-footer li,
      .planify-footer .footer-bottom,
      .planify-footer .footer-powered,
      .planify-footer .footer-col ul li a {
        color: #ffffff !important;
      }

      /* Anciennes classes footer-liste */
      .footer-bar-liste,
      .footer-content-liste,
      .footer-links-liste,
      .footer-links-liste a,
      .footer-contact-liste,
      .footer-contact-liste a,
      .footer-legal-liste { color: #ffffff !important; }

      /* Hover vert en sombre pour les éléments cliquables du footer */
      .planify-footer a:hover,
      .planify-footer button:hover,
      .planify-footer .youtube-link:hover,
      .footer-links-liste a:hover,
      .footer-contact-liste a:hover {
        color: #35cd40 !important;
      }
      .planify-footer .footer-social a:hover {
        background: #6EFF78 !important;
        color: #fff !important;
      }

      /* Popups: lisibilité sans blanchir chaque descendant */
      .popup-overlay { color: #ffffff !important; }
      .popup-content { color: #ffffff !important; }
      .popup-content-ajout-tache { color: #ffffff !important; }
      .popup-my-tasks { color: #ffffff !important; }
      .items-overlay, .user-items-modal, .modal { color: #ffffff !important; }

      /* FAQ: questions en blanc, réponses en gris */
      .odoo-faq summary { color: #ffffff !important; }
      .odoo-faq p, .odoo-faq details { color: #bfc4c8 !important; }

      /* PRÉSERVER les couleurs dans les descriptions riches (devoirs/exam) */
      .popup-content .multiline-html,
      .popup-content .multiline-html *,
      .popup-content-ajout-tache .multiline-html,
      .popup-content-ajout-tache .multiline-html *,
      .rich-editable,
      .rich-editable * {
        color: unset;
      }

      /* Liens contenus riches (garder vert d’accent en sombre) */
      .popup-content .multiline-html a,
      .popup-content-ajout-tache .multiline-html a {
        color: var(--link-color, #00f811) !important;
      }

      /* Accueil: titres clés en blanc (Auto Dark) */
      .odoo-banner-title,
      .planify-highlight-title,
      .odoo-section-title-left {
        color: #ffffff !important;
      }

      /* Contact: deux lignes en gris, le reste en blanc (Auto Dark) */
      .contact-form-column .contact-lead,
      .contact-info-list li div p {
        color: #bfc4c8 !important;
      }
      .contact-info-column h5,
      .contact-info-list li span,
      label,
      .contact-main small:not(.promo-hint),
      .youtube-link {
        color: #ffffff !important;
      }
      /* Exception: la note promo reste grise en sombre */
      .contact-main .form-group small.promo-hint { color: #bfc4c8 !important; }

      /* Footer / FAQ / popups existants */
      .profile-popup-overlay { background: rgba(0,0,0,0.6) !important; }
      .profile-popup {
        background: #1e2123 !important;
        color: #ffffff !important;
        box-shadow: 0 2px 24px rgba(0,0,0,0.4) !important;
      }
      .profile-popup h2,
      .profile-popup .popup-big-title,
      .profile-popup .profile-info,
      .profile-popup .public-note-title { color: #ffffff !important; }

      /* Titre musique défilant */
      .profile-popup .marquee {
        background: rgba(255,255,255,0.06) !important;
        color: #ffffff !important;
      }

      /* Note publique */
      .profile-popup .public-note-box {
        color: #ffffff !important;
        background: rgba(255,255,255,0.06) !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
      }
      .profile-popup .public-note-empty {
        color: #bfc4c8 !important;
        background: rgba(255,255,255,0.03) !important;
        border-color: rgba(255,255,255,0.12) !important;
      }

      /* Coins et volume */
      .profile-popup .coins-profile-row .coins-value { color: #6EFF78 !important; }
      .popup-volume span { color: #ffffff !important; }
      .popup-volume input[type="range"] { accent-color: #6EFF78 !important; }

      /* Icône close légèrement rehaussée */
      .profile-popup .close-img { filter: brightness(1) contrast(1.05) !important; }
    `
  }

  async function applyAutoDark(options: { brightness?: number; contrast?: number; sepia?: number } = {}) {
    const dr = await init()

    // IMPORTANT: utiliser window.fetch pour éviter les erreurs CORS sur Google Fonts
    try { dr.setFetchMethod(window.fetch) } catch {}

    const fixes: DynamicThemeFix = {
      invert: [],
      ignoreInlineStyle: IGNORE_INLINE_SELECTORS, // Ajout: ignorer style inline pour les cibles bordures
      ignoreImageAnalysis: [],
      disableStyleSheetsProxy: false,
      css: buildFixCSS(),
    }

    const theme = {
      mode: 1,
      brightness: options.brightness ?? 100,
      contrast: options.contrast ?? 95,
      sepia: options.sepia ?? 0,
      grayscale: 0,
      useFont: false,
      fontFamily: 'Inter',
      textStroke: 0,
      engine: 'dynamicTheme',
      stylesheet: '',
      darkSchemeBackgroundColor: '#181a1b',
      darkSchemeTextColor: '#ffffff',
      lightSchemeBackgroundColor: '#dcdad7',
      lightSchemeTextColor: '#181a1b',
      scrollbarColor: '',
    }

    dr.enable(theme, fixes)
    enabled.value = true
  }

  async function followOS(options: { brightness?: number; contrast?: number; sepia?: number } = {}) {
    const dr = await init()

    // IMPORTANT: définir fetch avant auto/enable
    try { dr.setFetchMethod(window.fetch) } catch {}

    const theme = {
      mode: 1,
      brightness: options.brightness ?? 100,
      contrast: options.contrast ?? 95,
      sepia: options.sepia ?? 0,
      grayscale: 0,
      useFont: false,
      fontFamily: 'Inter',
      textStroke: 0,
      engine: 'dynamicTheme',
      stylesheet: '',
      darkSchemeBackgroundColor: '#181a1b',
      darkSchemeTextColor: '#ffffff',
      lightSchemeBackgroundColor: '#dcdad7',
      lightSchemeTextColor: '#181a1b',
      scrollbarColor: '',
    }

    dr.auto(theme)

    if (dr.isEnabled()) {
      const fixes: DynamicThemeFix = {
        invert: [],
        ignoreInlineStyle: IGNORE_INLINE_SELECTORS, // Ajout: même ignore en mode auto
        ignoreImageAnalysis: [],
        disableStyleSheetsProxy: false,
        css: buildFixCSS(),
      }
      dr.enable(theme, fixes)
    }
    enabled.value = dr.isEnabled()
  }

  async function disableAutoDark() {
    const dr = await init()
    if (dr.isEnabled()) dr.disable()
    enabled.value = false
  }

  return { enabled, applyAutoDark, disableAutoDark, followOS }
}