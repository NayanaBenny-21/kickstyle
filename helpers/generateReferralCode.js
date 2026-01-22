module.exports = function generateReferralCode(name = '') {
  const prefix = name
    .replace(/\s+/g, '')
    .substring(0, 4)
    .toUpperCase();

  const random = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  return `${prefix}${random}`;
};