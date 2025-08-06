/**
 * Formats a phone number with dashes
 * Handles formats: XXX-XXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');

  // Apply formatting based on length
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  } else if (phoneNumber.length <= 10) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  } else {
    // If more than 10 digits, truncate to 10
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
}

/**
 * Validates if a phone number is complete (10 digits)
 */
export function isValidPhoneNumber(value: string): boolean {
  const phoneNumber = value.replace(/\D/g, '');
  return phoneNumber.length === 10;
}

/**
 * Gets raw phone number without formatting (for database storage)
 */
export function getRawPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}
