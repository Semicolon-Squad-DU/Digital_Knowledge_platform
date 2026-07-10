/** Validates ISBN-10 and ISBN-13 checksums (hyphens/spaces ignored). */
export function isValidIsbn(raw: string): boolean {
  const isbn = raw.replace(/[-\s]/g, "").toUpperCase();

  if (isbn.length === 10) {
    if (!/^\d{9}[\dX]$/.test(isbn)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += (i + 1) * parseInt(isbn[i], 10);
    sum += 10 * (isbn[9] === "X" ? 10 : parseInt(isbn[9], 10));
    return sum % 11 === 0;
  }

  if (isbn.length === 13) {
    if (!/^\d{13}$/.test(isbn)) return false;
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(isbn[i], 10) * (i % 2 === 0 ? 1 : 3);
    return sum % 10 === 0;
  }

  return false;
}
