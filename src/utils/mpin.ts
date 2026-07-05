const MPIN_PEPPER = 'atharvcare_mpin_v1';

export const isValidMpin = (value: string, allowedLengths: readonly number[] = [4, 6]) =>
  /^\d+$/.test(value) && allowedLengths.includes(value.length);

export const hashMpin = (mpin: string, scope = 'default') => {
  const input = `${scope}:${mpin}:${MPIN_PEPPER}`;
  let hash = 5381;

  for (let i = 0; i < input.length; i += 1) {
    hash = Math.imul(hash, 33) + input.charCodeAt(i);
  }

  return `mpin_${Math.abs(hash).toString(16)}`;
};

export const getMpinScope = (userId?: string | null) => userId?.trim() || 'guest';
