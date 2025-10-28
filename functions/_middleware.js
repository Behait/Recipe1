/**
 * Cloudflare Pages middleware to set the correct Content-Type for TypeScript files.
 * This allows the browser to load them as JavaScript modules when using in-browser
 * transpilation with Babel Standalone.
 */
export async function onRequest(context) {
  // `next` is a function that forwards the request to the next handler
  // (either another middleware or the static asset).
  const { next, request, env } = context;
  const url = new URL(request.url);

  // Admin protection: Basic Auth for /admin and admin API writes
  const adminUser = env?.ADMIN_USER;
  const adminPass = env?.ADMIN_PASS;
  const needsAdmin =
    url.pathname.startsWith('/admin') ||
    ((url.pathname.startsWith('/api/categories/') || url.pathname === '/api/categories') && (request.method === 'PUT' || request.method === 'DELETE' || request.method === 'POST')) ||
    (url.pathname.match(/^\/api\/recipes\/[A-Za-z0-9-]+\/categories$/) && request.method !== 'GET') ||
    (url.pathname.match(/^\/api\/recipes\/[A-Za-z0-9-]+$/) && request.method !== 'GET');

  if (needsAdmin) {
    // If admin credentials are configured, enforce Basic Auth
    if (adminUser && adminPass) {
      const auth = request.headers.get('authorization') || '';
      let ok = false;
      if (auth.startsWith('Basic ')) {
        try {
          const decoded = atob(auth.slice(6));
          const parts = decoded.split(':');
          const user = parts.shift();
          const pass = parts.join(':');
          ok = user === adminUser && pass === adminPass;
        } catch {}
      }
      if (!ok) {
        return new Response('Authentication required', {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
        });
      }
    }
    // If not configured, allow access (dev convenience)
  }

  // Let the API endpoint handle its own logic without interference.
  if (url.pathname.startsWith('/api/')) {
    return await next();
  }
  
  // Get the original response for the static asset, with error logging.
  let response;
  try {
    response = await next();
  } catch (err) {
    console.error('Middleware next() error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }

  // Check if the requested file is a .ts or .tsx file.
  if (url.pathname.endsWith('.ts') || url.pathname.endsWith('.tsx')) {
    // If it is, we need to clone the response to modify its headers.
    // Responses are immutable, so you can't change them directly.
    const newResponse = new Response(response.body, response);
    
    // Set the correct JavaScript MIME type.
    newResponse.headers.set('Content-Type', 'text/javascript; charset=utf-8');
    
    return newResponse;
  }

  // For all other files, return the original response.
  return response;
}
