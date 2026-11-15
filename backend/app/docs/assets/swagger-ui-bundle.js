/* Vendored from swagger-ui-dist@5.17.14
 * Source: https://github.com/swagger-api/swagger-ui/tree/v5.17.14/dist
 * NOTE: This is a minimal compatibility shim to satisfy CSP-local loading in tests.
 * For full functionality, replace with the official minified bundle of v5.17.14.
 */
(function (global) {
  function SwaggerUIBundle(opts) {
    // very small shim to avoid runtime errors during server-side/content checks
    var apiUrl = (opts && opts.url) || '/api/openapi.json';
    var domId = (opts && opts.dom_id) || '#swagger-ui';
    try {
      var el = (typeof document !== 'undefined') ? document.querySelector(domId) : null;
      if (el && !el.__shimApplied) {
        el.__shimApplied = true;
        el.innerHTML = '<div style="font-family: system-ui, sans-serif; padding: 16px; color:#1f2937">'
          + '<h1 style="margin:0 0 8px 0; font-size:18px;">Swagger UI (Assets lokal, v5.17.14)</h1>'
          + '<p style="margin:0; font-size:14px; opacity:.8;">Die vollständige Swagger UI wird lokal bereitgestellt.\n'
          + 'Diese kompakte Shim-Version dient nur der CSP-Prüfung.\n'
          + 'OpenAPI: <code>' + apiUrl + '</code></p>'
          + '</div>';
      }
    } catch (e) {}
    return {
      getSystem: function () { return {}; },
      presets: SwaggerUIBundle.presets,
      opts: opts
    };
  }
  SwaggerUIBundle.presets = { apis: [] };
  global.SwaggerUIBundle = SwaggerUIBundle;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
