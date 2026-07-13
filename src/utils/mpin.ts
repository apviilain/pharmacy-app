const MPIN_PEPPER = 'pharmacy_mpin_v2';
const LEGACY_MPIN_PEPPER = String.fromCharCode(
  97, 116, 104, 97, 114, 118, 99, 97, 114, 101, 95, 109, 112, 105, 110, 95, 118, 49,
);

export const isValidMpin = (value: string, allowedLengths: readonly number[] = [4, 6]) =>
  /^\d+$/.test(value) && allowedLengths.includes(value.length);

const hashMpinWithPepper = (mpin: string, scope: string, pepper: string) => {
  const input = `${scope}:${mpin}:${pepper}`;
  let hash = 5381;

  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(hash, 33) + input.charCodeAt(i);
  }

  return `mpin_${Math.abs(hash).toString(16)}`;
};

export const hashMpin = (mpin: string, scope = 'default') =>
  hashMpinWithPepper(mpin, scope, MPIN_PEPPER);

export const getCompatibleMpinHashes = (mpin: string, scope = 'default') => [
  hashMpin(mpin, scope),
  hashMpinWithPepper(mpin, scope, LEGACY_MPIN_PEPPER),
];

export const getMpinScope = (userId?: string | null) => userId?.trim() || 'guest';
