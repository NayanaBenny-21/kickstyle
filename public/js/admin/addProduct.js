document.addEventListener("DOMContentLoaded", () => {

  // ===== HELPER: CHECK REQUIRED FIELDS =====
  function isBasicDetailsFilled() {
    const productName = document.querySelector('[name="product_name"]').value.trim();
    const brand = document.querySelector('[name="brand"]').value;
    const category = document.querySelector('[name="category_id"]').value;
    const basePrice = document.querySelector('[name="base_price"]').value;

    return productName && brand && category && basePrice;
  }

  // ===== ERROR FUNCTIONS =====
function showError(field, message) {
  removeError(field);

  const error = document.createElement("div");
  error.className = "text-danger small field-error mb-1";
  error.innerText = message;

  field.classList.add("is-invalid");

  // 👉 INSERT ABOVE FIELD
  field.parentElement.insertBefore(error, field);
}
  function removeError(field) {
    field.classList.remove("is-invalid");
    const err = field.parentElement.querySelector(".field-error");
    if (err) err.remove();
  }

  // ===== CROP SETUP =====
  let cropper;
  let currentInput = null;

  const cropImage = document.getElementById("cropImage");
  const cropBtn = document.getElementById("cropBtn");
  const preview = document.getElementById("preview");
  const mainPreview = document.getElementById("mainPreview");

  const mainInput = document.getElementById("mainImageInput");
  const galleryInput = document.getElementById("galleryFiles");

  const cropModal = new bootstrap.Modal(document.getElementById("cropModal"));

  function openCropper(file, input) {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }

    cropImage.src = "";

    const reader = new FileReader();
    reader.onload = function (e) {
      cropImage.src = e.target.result;
      currentInput = input;
      cropModal.show();

      setTimeout(() => {
        if (cropper) {
          cropper.destroy();
        }

        cropper = new Cropper(cropImage, {
          aspectRatio: 1,
          viewMode: 1
        });
      }, 300);
    };

    reader.readAsDataURL(file);
  }

  // ===== IMAGE INPUT CONTROL =====
  document.addEventListener("change", function (e) {

    const input = e.target;

    // 🚫 BLOCK IMAGE UPLOAD
    if (
      input.id === "mainImageInput" ||
      input.id === "galleryFiles" ||
      input.classList.contains("variantImageInput")
    ) {

      if (!isBasicDetailsFilled()) {

        input.value = "";

        const productNameField = document.querySelector('[name="product_name"]');
        const brandField = document.querySelector('[name="brand"]');
        const categoryField = document.querySelector('[name="category_id"]');
        const priceField = document.querySelector('[name="base_price"]');

        if (!productNameField.value.trim()) showError(productNameField, "Enter product name first");
        if (!brandField.value) showError(brandField, "Select brand first");
        if (!categoryField.value) showError(categoryField, "Select category first");
        if (!priceField.value) showError(priceField, "Enter base price first");

        productNameField.focus();
        return;
      }
    }

    // MAIN IMAGE
    if (input.id === "mainImageInput") {
      const file = input.files[0];
      if (!file) return;
      openCropper(file, input);
    }

    // GALLERY
    if (input.id === "galleryFiles") {
      const files = Array.from(input.files);
      if (files.length === 0) return;
      openCropper(files[0], input);
    }

    // VARIANT IMAGE
    if (input.classList.contains("variantImageInput")) {
      const file = input.files[0];
      if (!file) return;
      openCropper(file, input);
    }

  });

  // ===== CROPPING =====
  cropBtn.addEventListener("click", () => {

    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      width: 500,
      height: 500
    });

    canvas.toBlob((blob) => {

      // ===== FILE NAMING =====
      let productName = document.querySelector('[name="product_name"]').value || "product";
      let brand = document.querySelector('[name="brand"]').value || "brand";

      productName = productName.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      brand = brand.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

      const timestamp = Date.now();

      let fileName = "image.jpg";

      if (currentInput === mainInput) {
        fileName = `${productName}_${brand}_main_${timestamp}.jpg`;
      } 
      else if (currentInput === galleryInput) {
        fileName = `${productName}_${brand}_gallery_${timestamp}.jpg`;
      } 
      else if (currentInput.classList.contains("variantImageInput")) {

        const variantItem = currentInput.closest(".variant-item");

        const color = variantItem.querySelector('[name*="[color]"]')?.value || "color";
        const size = variantItem.querySelector('[name*="[size]"]')?.value || "size";

        fileName = `${productName}_${brand}_${color}_${size}_${timestamp}.jpg`
          .toLowerCase()
          .replace(/\s+/g, "_");
      }

      const file = new File([blob], fileName, { type: "image/jpeg" });

      const container = new DataTransfer();
      container.items.add(file);
      currentInput.files = container.files;

      // ===== PREVIEW =====
      if (currentInput === galleryInput) {

        const wrapper = document.createElement("div");
        wrapper.classList.add("position-relative");

        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        img.style.width = "120px";
        img.style.height = "120px";
        img.style.objectFit = "cover";
        img.classList.add("rounded", "border");

        const removeBtn = document.createElement("button");
        removeBtn.innerHTML = "&times;";
        removeBtn.classList.add("btn", "btn-danger", "btn-sm", "position-absolute");

        removeBtn.style.top = "4px";
        removeBtn.style.right = "4px";

        removeBtn.onclick = () => {
          wrapper.remove();
          updateGalleryInput();
        };

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        preview.appendChild(wrapper);

        updateGalleryInput();
      }

      else if (currentInput === mainInput) {
        mainPreview.innerHTML = "";
        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        img.style.width = "150px";
        img.style.height = "150px";
        img.style.objectFit = "cover";
        img.classList.add("border", "rounded");
        mainPreview.appendChild(img);
      }

      else if (currentInput.classList.contains("variantImageInput")) {

        const variantItem = currentInput.closest(".variant-item");
        let wrapper = variantItem.querySelector(".variantPreview");

        if (!wrapper) {
          wrapper = document.createElement("div");
          wrapper.classList.add("variantPreview");
          variantItem.appendChild(wrapper);
        }

        wrapper.innerHTML = "";

        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        img.style.width = "80px";
        img.style.height = "80px";
        img.style.objectFit = "cover";

        wrapper.appendChild(img);
      }

      cropModal.hide();
      cropper.destroy();
      cropper = null;

    });
  });

  // ===== UPDATE GALLERY =====
  function updateGalleryInput() {
    const images = preview.querySelectorAll("img");
    const dt = new DataTransfer();

    images.forEach((img, i) => {
      fetch(img.src)
        .then(res => res.blob())
        .then(blob => {
          dt.items.add(new File([blob], `gallery_${i}.jpg`, { type: blob.type }));
          galleryInput.files = dt.files;
        });
    });
  }

  // ===== PRICE CALCULATION =====
  function calculateFinalPrice() {
    const base = parseFloat(document.querySelector('[name="base_price"]').value) || 0;
    const discount = parseFloat(document.querySelector('[name="discount_percentage"]').value) || 0;

    const final = base - (base * discount / 100);
    document.querySelector('[name="finalPrice"]').value = final.toFixed(2);
  }

  document.querySelector('[name="base_price"]').addEventListener("input", calculateFinalPrice);
  document.querySelector('[name="discount_percentage"]').addEventListener("input", calculateFinalPrice);


// ================== SKU GENERATION ==================
function generateSKU(productName, brand, color, size) {
  const clean = (s) => s.toUpperCase().replace(/\s+/g, "");
  const shortBrand = brand.substring(0, 3).toUpperCase();

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

function tryGenerateSKU(variant) {

  const productName = document.querySelector('[name="product_name"]').value.trim();
  const brand = document.querySelector('[name="brand"]').value.trim();

  const colorField = variant.querySelector('[name*="[color]"]');
  const sizeField = variant.querySelector('[name*="[size]"]');
  const skuField = variant.querySelector('[name*="[sku]"]');

  const color = colorField.value.trim();
  const size = sizeField.value.trim();

  //  if not all filled → clear SKU
  if (!productName || !brand || !color || !size) {
    skuField.value = "";
    return;
  }

  // generate SKU
  skuField.value = generateSKU(productName, brand, color, size);
}

// Auto trigger
document.addEventListener("change", (e) => {
  const variant = e.target.closest(".variant-item");
  if (!variant) return;

  if (
    e.target.name.includes("[color]") ||
    e.target.name.includes("[size]")
  ) {
    tryGenerateSKU(variant);
  }
});

// Base fields trigger
document.querySelector('[name="product_name"]').addEventListener("input", () => {
  document.querySelectorAll(".variant-item").forEach(tryGenerateSKU);
});

document.querySelector('[name="brand"]').addEventListener("change", () => {
  document.querySelectorAll(".variant-item").forEach(tryGenerateSKU);
});

});