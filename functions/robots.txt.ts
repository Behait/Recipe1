export const onRequestGet = async ({ request }: any) => {
  try {
    const origin = new URL(request.url).origin;
    const body = `User-agent: *
Disallow: /admin
Disallow: /api/
Disallow: /*?sort=
Sitemap: ${origin}/sitemap.xml
`;
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e: any) {
    console.error("/robots.txt error:", e);
    return new Response("User-agent: *\nAllow: /\n", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      status: 200,
    });
  }
};