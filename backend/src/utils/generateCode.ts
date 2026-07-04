// Generates a random 6-character code like "C2X9KP"
// Excludes confusing characters (0, O, 1, I, L) for clarity
export const generateJoinCode = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};