export const onRequestGet = async ({ env, request }: any) => {
  const url = new URL(request.url);
  const writeTest = url.searchParams.get("writeTest") === "1";

  const dbConfigured = Boolean((env as any).DB_CONNECTION_STRING);
  const geminiKeyConfigured = Boolean((env as any).GEMINI_API_KEY);
  const r2Bound = Boolean((env as any).R2_BUCKET);
  const r2PublicBaseUrl = Boolean((env as any).R2_PUBLIC_BASE_URL);
  const vertexEnabled = ((env as any).GOOGLE_GENAI_USE_VERTEXAI === "True") || ((env as any).GOOGLE_GENAI_USE_VERTEXAI === true);
  const vertexProject = (env as any).GOOGLE_CLOUD_PROJECT || null;
  const vertexLocation = (env as any).GOOGLE_CLOUD_LOCATION || null;

  const result: any = {
    dbConfigured,
    geminiKeyConfigured,
    r2Bound,
    r2PublicBaseUrl,
    vertexEnabled,
    vertexProject,
    vertexLocation,
  };

  if (writeTest && r2Bound) {
    try {
      const key = `debug/ping-${Date.now()}.txt`;
      await (env as any).R2_BUCKET.put(key, "ping", {
        httpMetadata: {
          contentType: "text/plain",
          cacheControl: "public, max-age=60",
        },
      });
      const base = (env as any).R2_PUBLIC_BASE_URL || "";
      const publicUrl = base ? (base.endsWith('/') ? `${base}${key}` : `${base}/${key}`) : key;
      result.r2WriteTest = { success: true, key, url: publicUrl };
    } catch (e: any) {
      result.r2WriteTest = { success: false, error: e?.message || String(e) };
    }
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};