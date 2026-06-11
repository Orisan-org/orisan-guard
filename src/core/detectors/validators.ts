/** Luhn checksum over a digits-only string. */
export function luhnValid(digits: string): boolean {
  if (!/^\d{12,19}$/.test(digits)) return false;

  let sum = 0;
  let doubleNext = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = Number(digits[index]);
    if (doubleNext) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    doubleNext = !doubleNext;
  }

  return sum % 10 === 0;
}

/** SSN structural validity: area not 000/666/900-999, group not 00, serial not 0000. */
export function ssnStructureValid(
  area: string,
  group: string,
  serial: string,
): boolean {
  if (
    !/^\d{3}$/.test(area) ||
    !/^\d{2}$/.test(group) ||
    !/^\d{4}$/.test(serial)
  ) {
    return false;
  }

  const areaNumber = Number(area);
  return (
    area !== "000" &&
    area !== "666" &&
    areaNumber < 900 &&
    group !== "00" &&
    serial !== "0000"
  );
}

/** Known payment-card IIN prefix check on a digits-only string. */
export function knownCardPrefix(digits: string): boolean {
  if (!/^\d{12,19}$/.test(digits)) return false;

  const length = digits.length;
  const firstTwo = Number(digits.slice(0, 2));
  const firstFour = Number(digits.slice(0, 4));

  if (digits.startsWith("4"))
    return length === 13 || length === 16 || length === 19;
  if (
    (firstTwo >= 51 && firstTwo <= 55) ||
    (firstFour >= 2221 && firstFour <= 2720)
  ) {
    return length === 16;
  }
  if (digits.startsWith("34") || digits.startsWith("37")) return length === 15;
  if (digits.startsWith("6011") || firstTwo === 64 || firstTwo === 65) {
    return length >= 16 && length <= 19;
  }
  if (digits.startsWith("35")) return length >= 16 && length <= 19;
  if (firstTwo === 30 || firstTwo === 36 || firstTwo === 38) {
    return length >= 14 && length <= 19;
  }

  return false;
}
