function stripPort(ip: string): string {
  const s = ip.trim();
  if (!s) return s;

  // [::1]:1234
  const bracket = s.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracket?.[1]) return bracket[1];

  // IPv4:port
  const v4port = s.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
  if (v4port?.[1]) return v4port[1];

  return s;
}

export function normalizeIp(ip?: string | null): string | null {
  if (!ip) return null;
  const s = stripPort(ip);
  if (!s) return null;

  // IPv4-mapped IPv6 ::ffff:1.2.3.4
  const mapped = s.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped?.[1]) return mapped[1];

  return s;
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;

  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 0) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const s = ip.toLowerCase();
  if (s === '::1') return true;
  if (s.startsWith('fe80:')) return true; // link-local
  if (s.startsWith('fc') || s.startsWith('fd')) return true; // ULA fc00::/7 (cheap check)
  return false;
}

export function isPublicIp(ip: string): boolean {
  const norm = normalizeIp(ip);
  if (!norm) return false;
  if (norm.includes('.')) return !isPrivateIpv4(norm);
  if (norm.includes(':')) return !isPrivateIpv6(norm);
  return false;
}

export function pickBestPublicIpFromXff(xff?: string | null): string | null {
  if (!xff) return null;
  const parts = xff
    .split(',')
    .map((s) => normalizeIp(s))
    .filter((s): s is string => Boolean(s));
  if (parts.length === 0) return null;
  return parts.find((ip) => isPublicIp(ip)) || null;
}

