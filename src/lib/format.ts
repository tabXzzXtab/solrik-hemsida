import type { Lang } from '~/i18n/routes';

/** A value still written as "[…]" in the config is a placeholder. */
export function isPlaceholder(value: string | undefined | null): boolean {
  return !value || /\[[^\]]*\]/.test(value);
}

/** Only real http(s) URLs (not placeholders). */
export function isRealUrl(value: string | undefined | null): value is string {
  return !!value && !isPlaceholder(value) && /^https?:\/\//.test(value);
}

/** "040-12 34 56" → "tel:+4640123456". Empty or placeholder → null. */
export function telHref(phone: string): string | null {
  if (isPlaceholder(phone)) return null;
  let digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  else if (digits.startsWith('0')) digits = `+46${digits.slice(1)}`;
  return `tel:${digits}`;
}

export function mailHref(email: string, subject?: string): string | null {
  if (isPlaceholder(email)) return null;
  return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}

const LOCALES: Record<Lang, string> = { sv: 'sv-SE', en: 'en-GB' };

export function formatDate(date: Date, lang: Lang, style: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat(LOCALES[lang], style === 'long'
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

/** Splits a date for the prominent news date block. */
export function dateParts(date: Date, lang: Lang) {
  const locale = LOCALES[lang];
  return {
    day: new Intl.DateTimeFormat(locale, { day: 'numeric' }).format(date),
    month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', ''),
    year: String(date.getFullYear()),
  };
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Replace {tokens} with values; unknown tokens are kept. */
export function fill(text: string, vars: Record<string, string | number | undefined>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (vars[key] !== undefined ? String(vars[key]) : match));
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
