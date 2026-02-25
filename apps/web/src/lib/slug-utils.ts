export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, '') // trim leading/trailing hyphens
    .slice(0, 50); // max length
}

export function isValidSlug(slug: string): { valid: boolean; error?: string } {
  if (slug.length < 3) return { valid: false, error: 'Must be at least 3 characters' };
  if (slug.length > 50) return { valid: false, error: 'Must be 50 characters or less' };
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Only lowercase letters, numbers, and hyphens' };
  }
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Cannot start or end with a hyphen' };
  }
  if (/--/.test(slug)) {
    return { valid: false, error: 'Cannot contain consecutive hyphens' };
  }
  return { valid: true };
}
