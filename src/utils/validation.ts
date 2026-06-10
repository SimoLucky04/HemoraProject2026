// Helper di validazione e di "input masking" condivisi dai form.

// Tiene solo le cifre, con un eventuale limite di lunghezza.
export function digitsOnly(text: string, maxLength?: number): string {
  const digits = text.replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

// Cifre con un singolo separatore decimale (virgola normalizzata in punto).
export function decimalOnly(text: string, maxLength?: number): string {
  let cleaned = text.replace(/[^\d.,]/g, '').replace(',', '.');
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  return maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

// Solo lettere/cifre maiuscole, max 16 caratteri (formato codice fiscale).
export function fiscalCodeInput(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone.trim());
}

export function isValidFiscalCode(code: string): boolean {
  return /^[A-Z0-9]{16}$/.test(code.trim());
}
