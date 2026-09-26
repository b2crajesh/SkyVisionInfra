/**
 * Masks a sensitive alphanumeric string, leaving only the last `visibleTail`
 * characters visible, grouped in blocks of 4 separated by hyphens, e.g.
 * mask("123456789012") -> "XXXX-XXXX-9012"
 * mask("ABCDE1234F")   -> "XXXX-XX34F"  (best-effort for shorter/odd lengths)
 */
export function mask(value: string | null | undefined, visibleTail = 4): string {
  if (!value) return "";
  const clean = value.trim();
  if (clean.length <= visibleTail) {
    return "X".repeat(Math.max(clean.length - 1, 0)) + clean.slice(-1);
  }

  const visible = clean.slice(-visibleTail);
  const maskedLength = clean.length - visibleTail;
  const maskedPart = "X".repeat(maskedLength);
  const combined = maskedPart + visible;

  // group into blocks of 4 from the left for readability
  const groups: string[] = [];
  for (let i = 0; i < combined.length; i += 4) {
    groups.push(combined.slice(i, i + 4));
  }
  return groups.join("-");
}

export function maskAadhaar(value: string | null | undefined): string {
  return mask(value, 4);
}

export function maskPan(value: string | null | undefined): string {
  return mask(value, 4);
}
