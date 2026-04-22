document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("productForm");

  // ===== TRACK TOUCHED FIELDS =====
  const touchedFields = new Set();

  // ===== FIELD ORDER (TOP → BOTTOM) =====
  const fieldOrder = [
    "product_name",
    "brand",
    "category_id",
    "base_price",
    "discount_percentage"
  ];

  // ===== ERROR FUNCTIONS =====
  function showError(field, message) {
    removeError(field);

    const error = document.createElement("div");
    error.className = "text-danger small field-error mb-1";
    error.innerText = message;

    field.classList.add("is-invalid");

    // ✅ SHOW ABOVE FIELD
    field.parentElement.insertBefore(error, field);
  }

  function removeError(field) {
    field.classList.remove("is-invalid");
    const err = field.parentElement.querySelector(".field-error");
    if (err) err.remove();
  }

  // ===== VALIDATE SINGLE FIELD =====
function validateField(field) {
  const name = field.name || "";
  const value = field.value?.trim?.() || "";

  // REQUIRED (ALL FIELDS)
  if (field.hasAttribute("required")) {

    if (field.type === "file") {
      if (!field.files || field.files.length === 0) {
        showError(field, "This field is required");
        return false;
      }
    } else if (!value) {
      showError(field, "This field is required");
      return false;
    }
  }

  // Product name validation
  if (name === "product_name" && value) {
    if (!/^[A-Za-z\s]+$/.test(value)) {
      showError(field, "Product name must contain only alphabets");
      return false;
    }
  }

  // Number validation
  if (field.type === "number" && value) {
    if (parseFloat(value) < 0) {
      showError(field, "Value cannot be negative");
      return false;
    }
  }

  removeError(field);
  return true;
}

  // ===== PREVENT SKIPPING FIELDS =====
  function checkPreviousFields(currentField) {
    const currentIndex = fieldOrder.indexOf(currentField.name);

    if (currentIndex === -1) return true;

    for (let i = 0; i < currentIndex; i++) {
      const prev = document.querySelector(`[name="${fieldOrder[i]}"]`);

      if (prev && !prev.value.trim()) {
        showError(prev, "Please fill this field first");
        prev.focus();
        return false;
      }
    }

    return true;
  }

  // ===== FIELD EVENTS =====
  form.querySelectorAll("input, select, textarea").forEach(field => {

    field.addEventListener("focus", () => {
      checkPreviousFields(field);
    });

    field.addEventListener("blur", () => {
      touchedFields.add(field.name);
      validateField(field);
    });

    field.addEventListener("input", () => {
      if (field.value.trim()) removeError(field);
    });

  });

  // ===== VARIANT IMAGE CHECK =====
  document.addEventListener("change", (e) => {

    if (e.target.classList.contains("variantImageInput")) {

      const variant = e.target.closest(".variant-item");

      const color = variant.querySelector('[name*="[color]"]');
      const size = variant.querySelector('[name*="[size]"]');
      const stock = variant.querySelector('[name*="[stock]"]');

      if (!color.value || !size.value || !stock.value) {

        e.target.value = "";

        showError(color, "Select color first");
        showError(size, "Enter size first");
        showError(stock, "Enter stock first");

        return;
      }

      removeError(color);
      removeError(size);
      removeError(stock);
    }

  });

  // ===== SUBMIT VALIDATION =====
form.addEventListener("submit", (e) => {

  let valid = true;

  // Validate ALL fields (no touched check)
  form.querySelectorAll("input, select, textarea").forEach(field => {
    if (!validateField(field)) valid = false;
  });
const mainImage = document.getElementById("mainImageInput");
const gallery = document.getElementById("galleryFiles");

// MAIN IMAGE
if (!mainImage.files || mainImage.files.length === 0) {
  showError(mainImage, "This field is required");
  valid = false;
}

// GALLERY (min 3)
if (!gallery.files || gallery.files.length < 3) {
  showError(gallery, "Upload at least 3 images");
  valid = false;
}
  // ===== VARIANT VALIDATION =====
  document.querySelectorAll(".variant-item").forEach((variant) => {

    const color = variant.querySelector('[name*="[color]"]');
    const size = variant.querySelector('[name*="[size]"]');
    const stock = variant.querySelector('[name*="[stock]"]');
    const image = variant.querySelector(".variantImageInput");

    if (!color.value) {
      showError(color, "This field is required");
      valid = false;
    }

    if (!size.value) {
      showError(size, "This field is required");
      valid = false;
    }

    if (!stock.value) {
      showError(stock, "This field is required");
      valid = false;
    }

    if (!image.files || image.files.length === 0) {
      showError(image, "This field is required");
      valid = false;
    }

  });

  if (!valid) e.preventDefault();
});
});