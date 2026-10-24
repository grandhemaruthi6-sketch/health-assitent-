export function resolveApiFileUrl(fileUrl, apiBase = '/api', pageOrigin = 'http://localhost') {
  if (typeof fileUrl !== 'string' || !fileUrl.trim()) return null;
  const value = fileUrl.trim();
  if (/^(?:blob:|data:)/i.test(value)) return value;

  try {
    const api = new URL(apiBase || '/api', pageOrigin);
    const targetOrigin = /^https?:\/\//i.test(apiBase || '') ? api.origin : pageOrigin;
    return new URL(value, targetOrigin).toString();
  } catch {
    return value;
  }
}

export function withDownloadFlag(fileUrl) {
  if (typeof fileUrl !== 'string' || !fileUrl.trim()) return null;
  try {
    const url = new URL(fileUrl);
    url.searchParams.set('download', '1');
    return url.toString();
  } catch {
    return null;
  }
}
