// =============================================================================
// Translations Module — Aggregator
// =============================================================================

import { esUI } from "./locales/ui/es.js";
import { enUI } from "./locales/ui/en.js";

/**
 * UI translations by language code. Spanish is the only UI language;
 * English stays as the fallback for keys a locale does not define.
 * Element and Ion data are loaded dynamically via langController.js.
 */
export const translations = {
  "es": esUI,
  "en": enUI
};
