function decodeBase64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function uploadImage(env: any, base64ImageBytes: string, keyPrefix: string) {
  const key = `recipes/${keyPrefix}-${Date.now()}.png`;
  const data = decodeBase64ToUint8(base64ImageBytes);
  const bucket = (env as any).R2_BUCKET;
  if (!bucket) throw new Error('R2 bucket binding missing');

  await bucket.put(key, data, {
    httpMetadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  const base = (env as any).R2_PUBLIC_BASE_URL || '';
  const url = base ? (base.endsWith('/') ? `${base}${key}` : `${base}/${key}`) : key;
  return { image_key: key, image_url: url };
}