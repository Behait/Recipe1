export function toSlug(input: string): string {
  const s = (input || '').trim().toLowerCase();
  // 保留中文与字母数字，其他替换为空；空白替换为连字符
  const replaced = s
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const base = replaced || 'recipe';
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}