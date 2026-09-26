import crypto from "crypto";

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%";
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function randomChar(charset: string): string {
  const idx = crypto.randomInt(0, charset.length);
  return charset[idx];
}

/**
 * Generates a random temporary password (10 chars) with at least one
 * uppercase, lowercase, digit and symbol character.
 */
export function generateTempPassword(length = 10): string {
  const chars = [
    randomChar(UPPER),
    randomChar(LOWER),
    randomChar(DIGITS),
    randomChar(SYMBOLS),
  ];
  while (chars.length < length) {
    chars.push(randomChar(ALL));
  }
  // shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
