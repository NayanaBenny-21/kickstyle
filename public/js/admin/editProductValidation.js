document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("productForm");
const mainInput = document.getElementById("mainImageInput");

  // ================= SKU GENERATOR =================
  function generateSKU(name, brand, color, size) {
    const clean = s => s.toUpperCase().replace(/\s+/g, "");
    const shortBrand = brand.substring(0, 3).toUpperCase();

    const colorMap = {
      BLACK: "BLK",
      BLUE: "BLU",
      GREEN: "GRN",
      BROWN: "BRN",
      RED: "RED",
      WHITE: "WHT"
    };

    const c = color.toUpperCase();
    const shortColor = colorMap[c] || c.substring(0, 3);

    return `${shortBrand}-${clean(name)}-${shortColor}-${size}`;
  }

  // ================= AUTO SKU =================
  function updateSKU(variant) {
    const name = document.querySelector('[name="product_name"]').value.trim();
    const brand = document.querySelector('[name="brand"]').value.trim();
    const color = variant.querySelector('[name*="[color]"]').value;
    const size = variant.querySelector('[name*="[size]"]').value;
    const skuField = variant.querySelector('[name*="[sku]"]');

    if (!name || !brand || !color || !size) return;
    skuField.value = generateSKU(name, brand, color, size);
  }

  document.addEventListener("change", (e) => {
    const variant = e.target.closest(".variant-item");
    if (!variant) return;

    if (e.target.name.includes("[color]") || e.target.name.includes("[size]")) {
      updateSKU(variant);
    }
  });

  document.querySelector('[name="product_name"]').addEventListener("input", () => {
    document.querySelectorAll(".variant-item").forEach(updateSKU);
  });

  document.querySelector('[name="brand"]').addEventListener("change", () => {
    document.querySelectorAll(".variant-item").forEach(updateSKU);
  });

  // ================= DUPLICATE SKU CHECK =================
  function checkDuplicateSKU() {
    const set = new Set();
    for (let input of document.querySelectorAll('[name*="[sku]"]')) {
      if (set.has(input.value)) return input.value;
      set.add(input.value);
    }
    return null;
  }

// SUBMIT
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let errors = [];

  // ===== BASIC =====
  const productName = form.querySelector('[name="product_name"]').value.trim();
  const brand = form.querySelector('[name="brand"]').value;
  const category = form.querySelector('[name="category_id"]').value;

  if (!productName) errors.push("• Product name is required");
  if (!brand) errors.push("• Brand is required");
  if (!category) errors.push("• Category is required");

  // ===== MAIN IMAGE =====
  const mainImageInput = document.getElementById("mainImageInput");
  const mainPreviewImg = document.querySelector("#mainPreview img");

  if (!mainPreviewImg && mainImageInput.files.length === 0) {
    errors.push("• Main image is required");
  }

  // ===== GALLERY =====
  const galleryImages = document.querySelectorAll("#preview img");

  if (galleryImages.length < 3) {
    errors.push("• Minimum 3 gallery images required");
  }

  // ===== VARIANTS =====
  const variants = document.querySelectorAll(".variant-item");

  variants.forEach((variant, i) => {
    const color = variant.querySelector('[name*="[color]"]').value;
    const size = variant.querySelector('[name*="[size]"]').value;
    const sku = variant.querySelector('[name*="[sku]"]').value.trim();
    const stock = variant.querySelector('[name*="[stock]"]').value;

    if (!color || !size || !sku || !stock) {
      errors.push(`• Variant ${i + 1}: All fields are required`);
    }

    const img = variant.querySelector(".variantPreview");
    const src = img.getAttribute("src") || "";

    if (src.includes("no-image.png")) {
      errors.push(`• Variant ${i + 1}: Image is required`);
    }
  });

  // ===== DUPLICATE SKU =====
  const dup = checkDuplicateSKU();
  if (dup) {
    errors.push(`• Duplicate SKU: ${dup}`);
  }

  // ===== SHOW ERRORS =====
  if (errors.length > 0) {
    return Swal.fire({
      icon: "warning",
      title: "Required",
      html: `<div style="text-align:left">${errors.join("<br>")}</div>`
    });
  }

  // ===== SUBMIT =====
  const formData = new FormData(form);

// MAIN IMAGE
if (mainInput.files.length > 0) {
  formData.set("mainImage", mainInput.files[0]);
}

// GALLERY IMAGES
if (window.galleryFiles && window.galleryFiles.length > 0) {
  window.galleryFiles.forEach(file => {
    formData.append("galleryImages", file);
  });
}

if (window.variantFiles) {
  Object.keys(window.variantFiles).forEach(index => {
    formData.set(`variantImages[${index}]`, window.variantFiles[index]);
  });
}

  try {
    const res = await fetch(form.action, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire("Success", data.message, "success").then(() => {
        window.location.href = "/admin/product-management";
      });
    } else {
      Swal.fire("Error", data.message || "Update failed", "error");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Something went wrong", "error");
  }
});
});