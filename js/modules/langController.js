// =============================================================================
// Language Controller — Spanish-only i18n (English is the internal fallback)
// =============================================================================

import { translations } from "../data/translations.js";

const DEFAULT = "en";

const lang = "es";
let callbacks = [];
let cacheCleanupFns = [];

export const elementLocales = {};
export const ionLocales = {};

const ELEMENT_LOCALE_LOADERS = {
  es: async () => {
    const module = await import("../data/locales/es.js");
    return module.es_elements;
  },
};

const ION_LOCALE_LOADERS = {
  es: async () => {
    const module = await import("../data/locales/ions/es.js");
    return module.es_ions;
  },
};

export async function fetchElementLocale(langCode) {
  if (langCode === "en") return;
  // If we already loaded it, skip
  if (elementLocales[langCode]) return;

  const loader = ELEMENT_LOCALE_LOADERS[langCode];
  if (!loader) return;

  try {
    elementLocales[langCode] = await loader();
  } catch (e) {
    console.warn("Could not load element locale for", langCode, e);
  }
}

export async function fetchIonLocale(langCode) {
  if (langCode === "en") return;
  if (ionLocales[langCode]) return;

  const loader = ION_LOCALE_LOADERS[langCode];
  if (!loader) return;

  try {
    ionLocales[langCode] = await loader();
  } catch (e) {
    console.warn("Could not load ion locale for", langCode, e);
  }
}

// ── Public API ──

/** Lookup a translated string by dot-path key, e.g. t("nav.table", "Fallback") */
export function t(key, fallback, targetLang) {
  const parts = key.split(".");
  const useLang = targetLang || lang;
  let val = translations[useLang];
  for (const p of parts) {
    if (val == null) break;
    val = val[p];
  }
  if (val != null) return val;

  let fb = translations[DEFAULT];
  for (const p of parts) {
    if (fb == null) return fallback !== undefined ? fallback : key;
    fb = fb[p];
  }
  return fb != null ? fb : (fallback !== undefined ? fallback : key);
}
export function getLang() {
  return lang;
}

export function onLangChange(cb) {
  callbacks.push(cb);
}

export function registerCacheCleanup(fn) {
  cacheCleanupFns.push(fn);
}

// ── DOM translation ──

export function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria-label")));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
}

// ── Init ──

export function initLangController() {
  document.documentElement.lang = lang;

  Promise.all([fetchElementLocale(lang), fetchIonLocale(lang)]).then(() => {
    applyStaticTranslations();
    callbacks.forEach((cb) => cb(lang));
  });
}
