const onlyDigits = (value: string): string => value.replace(/\D/g, "");

const validateMod10 = (value: string): boolean => {
  const digits = value.split("").map(Number);
  const verifier = digits.pop();

  if (verifier === undefined) {
    return false;
  }

  let total = 0;
  digits.forEach((digit, index) => {
    let current = digit;
    if (index % 2 === 0) {
      current *= 2;
      if (current > 9) {
        current -= 9;
      }
    }
    total += current;
  });

  const nextTen = Math.ceil(total / 10) * 10;
  const expected = (nextTen - total) % 10;
  return expected === verifier;
};

export const normalizeIdentification = (value: string): string => value.trim().toUpperCase();

export const validateClientIdentification = (documentType: string, identification: string): boolean => {
  const normalizedType = documentType.trim().toUpperCase();
  const digits = onlyDigits(identification);

  if (normalizedType === "EXTRANJERO" || normalizedType === "PASSPORT" || normalizedType === "FOREIGN") {
    return identification.trim().length >= 3;
  }

  if (normalizedType === "CEDULA") {
    return digits.length === 10 && validateMod10(digits);
  }

  if (normalizedType === "RUC") {
    return digits.length === 13 && digits.endsWith("001") && validateMod10(digits.slice(0, 10));
  }

  return false;
};

export const normalizePhone = (value?: string): string => value?.replace(/\D/g, "") ?? "";

export const validatePhone = (value?: string): boolean => {
  if (!value) {
    return true;
  }

  return normalizePhone(value).length === 10;
};
