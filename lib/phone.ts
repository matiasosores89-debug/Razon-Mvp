/**
 * Converts Argentine phone numbers to a stable identifier.
 *
 * These inputs, for example, all identify the same customer:
 * 3814675336, 0381 467-5336 and +54 9 381 467-5336.
 */
export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("54") && digits.length > 10) {
    digits = digits.slice(2);

    if (digits.startsWith("9") && digits.length > 10) {
      digits = digits.slice(1);
    }
  }

  return digits.replace(/^0+/, "");
}
