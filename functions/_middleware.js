/**
 * Cloudflare Pages middleware to set the correct Content-Type for TypeScript files.
 * This allows the browser to load them as JavaScript modules when using in-browser
 * transpilation with Babel Standalone.
 */
export async function onRequest(context) {
  // `next` is a function that forwards the request to the next handler
  // (either another middleware or the static asset).
  const { next, request } = context;
  const url = new URL(request.url);

  // Let the API endpoint handle its own logic without interference.
  if (url.pathname.startsWith('/api/')) {
    return await next();
  }
  
  // Get the original response for the static asset.
  const response = await next();

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
