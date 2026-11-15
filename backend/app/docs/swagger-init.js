/* Swagger UI Initialisierung – lokal und CSP-kompatibel
 * Gepinnte Version: swagger-ui-dist@5.17.14
 * Quelle der vendorten Assets: https://github.com/swagger-api/swagger-ui/tree/v5.17.14/dist
 */

(function () {
  if (typeof window === 'undefined') return;
  if (typeof window.SwaggerUIBundle !== 'function') {
    console.warn('[SwaggerUI] Bundle nicht geladen – prüfen Sie /api/docs/assets/swagger-ui-bundle.js');
    return;
  }
  if (typeof window.SwaggerUIStandalonePreset !== 'undefined') {
    window.ui = window.SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      layout: 'StandaloneLayout',
      deepLinking: true,
      presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
    });
  } else {
    // Fallback: ohne StandalonePreset, damit die UI überhaupt initialisiert
    window.ui = window.SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      layout: 'BaseLayout',
      deepLinking: true,
      presets: [window.SwaggerUIBundle.presets.apis],
    });
  }
})();
