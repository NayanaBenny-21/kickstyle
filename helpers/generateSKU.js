
function generateSKU(productName, brand, color, size) {

  const clean = (s) => s.toUpperCase().replace(/\s+/g, "");

  const shortBrand = brand.substring(0, 3).toUpperCase();

  // color map 
  const colorMap = {
    BLACK: "BLK",
    BLUE: "BLU",
    GREEN: "GRN",
    BROWN: "BRN",
    RED: "RED"
  };

  const colorKey = color.toUpperCase();
  const shortColor = colorMap[colorKey] || colorKey.substring(0, 3);

  return `${shortBrand}-${clean(productName)}-${shortColor}-${size}`;
}

module.exports = generateSKU;