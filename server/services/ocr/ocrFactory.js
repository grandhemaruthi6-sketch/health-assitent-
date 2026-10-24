import { GoogleDocumentAiProvider } from './googleDocumentAiProvider.js';
import { MockOcrProvider } from './mockOcrProvider.js';

let activeProviderInstance = null;

/**
 * Creates or retrieves the active OCR provider
 * @param {string} [forcedProviderType] - Optional override
 * @returns {import('./ocrProvider').OcrProvider}
 */
export function getOcrProvider(forcedProviderType = null) {
  const providerType = forcedProviderType || process.env.OCR_PROVIDER || 'google-cloud-documentai';

  if (activeProviderInstance && !forcedProviderType) {
    return activeProviderInstance;
  }

  let provider;
  switch (providerType.toLowerCase()) {
    case 'google-cloud-documentai':
    case 'documentai':
      provider = new GoogleDocumentAiProvider();
      break;

    case 'mock':
    case 'test-synthetic':
    case 'test':
      provider = new MockOcrProvider();
      break;

    default:
      console.warn(`[OCR Factory] Unknown provider type '${providerType}'. Defaulting to Google Cloud Document AI.`);
      provider = new GoogleDocumentAiProvider();
      break;
  }

  if (!forcedProviderType) {
    activeProviderInstance = provider;
  }

  return provider;
}

/**
 * Reset provider instance (useful in tests)
 */
export function resetOcrProvider() {
  activeProviderInstance = null;
}
