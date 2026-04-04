export function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function estimateReadTime(content = '') {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  if (!words) return '0 min read';
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function formatCompactNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.0', '')}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}k`;
  return String(value);
}

export function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function normalizeHandle(value = '') {
  return String(value).toLowerCase().replace(/^@/, '');
}
