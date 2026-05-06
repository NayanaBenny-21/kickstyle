document.addEventListener("DOMContentLoaded", () => {

  let cropper = null;
  let currentInput = null;

  const cropImage = document.getElementById("cropImage");
  const cropBtn = document.getElementById("cropBtn");
  const cropModal = new bootstrap.Modal(document.getElementById("cropModal"));

  const mainInput = document.getElementById("mainImageInput");
  const galleryInput = document.getElementById("galleryFiles");
  const mainPreview = document.getElementById("mainPreview");
  const preview = document.getElementById("preview");
  const container = document.getElementById("variantContainer");

  let fileQueue = [];
  let currentIndex = 0;

  // 🔥 GLOBAL (used by validation file)
  window.variantFiles = {};
  window.galleryFiles = [];

  // ================= UI =================
  function updateVariantUI(box) {
    const img = box.querySelector(".variantPreview");
    const editBtn = box.querySelector(".editImageBtn");
    const removeBtn = box.querySelector(".removeImageBtn");
    const uploadBtn = box.querySelector(".uploadImageBtn");

    const isDefault = img.src.includes("no-image.png");

    editBtn.classList.toggle("d-none", isDefault);
    removeBtn.classList.toggle("d-none", isDefault);
    uploadBtn.classList.toggle("d-none", !isDefault);
  }

  document.querySelectorAll(".variant-image-box").forEach(updateVariantUI);

  // ================= OPEN CROPPER =================
  function openCropper(file, input) {
    if (cropper) cropper.destroy();
    currentInput = input;

    const reader = new FileReader();
    reader.onload = (e) => {
      cropImage.src = e.target.result;
      cropModal.show();

      cropImage.onload = () => {
        cropper = new Cropper(cropImage, {
          aspectRatio: 1,
          viewMode: 1
        });
      };
    };

    reader.readAsDataURL(file);
  }

  // ================= FILE CHANGE =================
  document.addEventListener("change", (e) => {
    const input = e.target;

    if (
      input.files &&
      input.files.length > 0 &&
      (input === mainInput ||
        input === galleryInput ||
        input.classList.contains("variantImageInput"))
    ) {
      fileQueue = Array.from(input.files);
      currentIndex = 0;
      openCropper(fileQueue[currentIndex], input);
    }
  });

  // ================= CROPPER SAVE =================
  cropBtn.addEventListener("click", () => {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({ width: 500, height: 500 });

    canvas.toBlob((blob) => {
      const file = new File([blob], `cropped_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // ===== MAIN IMAGE =====
      if (currentInput === mainInput) {
        const dt = new DataTransfer();
        dt.items.add(file);
        mainInput.files = dt.files;

        mainPreview.innerHTML = `<img src="${URL.createObjectURL(blob)}" width="150">`;
      }

      // ===== GALLERY =====
      else if (currentInput === galleryInput) {
        const div = document.createElement("div");
        div.className = "position-relative me-2 mb-2";

        div.innerHTML = `
          <img src="${URL.createObjectURL(blob)}" width="120" height="120">
          <button class="removeBtn btn btn-danger btn-sm position-absolute" style="top:5px;right:5px;">×</button>
        `;

        preview.appendChild(div);
        window.galleryFiles.push(file);
      }

      // ===== VARIANT =====
      else if (currentInput.classList.contains("variantImageInput")) {
        let index = currentInput.dataset.index;

        if (!index) {
          const items = document.querySelectorAll(".variant-item");
          index = Array.from(items).indexOf(currentInput.closest(".variant-item"));
        }

        window.variantFiles[index] = file;

        const box = currentInput.closest(".variant-image-box");
        box.querySelector(".variantPreview").src = URL.createObjectURL(blob);

        updateVariantUI(box);
      }

      currentIndex++;

      if (fileQueue[currentIndex]) {
        openCropper(fileQueue[currentIndex], currentInput);
      } else {
        cropModal.hide();
        cropper.destroy();
        cropper = null;
      }
    }, "image/jpeg");
  });

  // ================= REMOVE GALLERY =================
  preview.addEventListener("click", (e) => {
    if (e.target.classList.contains("removeBtn")) {
      const index = Array.from(preview.children).indexOf(e.target.parentElement);

      e.target.parentElement.remove();
      window.galleryFiles.splice(index, 1);
    }
  });

  // ================= CLICK VARIANT IMAGE =================
  document.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("variantPreview") ||
      e.target.classList.contains("editImageBtn") ||
      e.target.classList.contains("uploadImageBtn")
    ) {
      const box = e.target.closest(".variant-image-box");
      const input = box.querySelector(".variantImageInput");
      input.click();
    }
  });

  // ================= REMOVE VARIANT IMAGE =================
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("removeImageBtn")) {
      const box = e.target.closest(".variant-image-box");
      const input = box.querySelector(".variantImageInput");
      const index = input.dataset.index;

      box.querySelector(".variantPreview").src = "/images/no-image.png";
      input.value = "";

      delete window.variantFiles[index];

      updateVariantUI(box);
    }
  });

  // ================= REINDEX =================
  function reindexVariants() {
    const items = document.querySelectorAll(".variant-item");
    const newFiles = {};

    items.forEach((item, i) => {
      item.querySelectorAll("input, select").forEach(input => {

        if (input.name && input.name.includes("variants[")) {
          input.name = input.name.replace(/variants\[\d+\]/, `variants[${i}]`);
        }

        if (input.classList.contains("variantImageInput")) {
          const oldIndex = input.dataset.index;

          input.dataset.index = i;
          input.name = `variantImages[${i}]`;

          if (window.variantFiles[oldIndex]) {
            newFiles[i] = window.variantFiles[oldIndex];
          }
        }
      });
    });

    window.variantFiles = newFiles;
  }

  // ================= ADD VARIANT =================
// ================= ADD VARIANT =================
let count = container.querySelectorAll(".variant-item").length;

document.getElementById("addVariantBtn").addEventListener("click", () => {

  const div = document.createElement("div");
  div.className = "variant-item d-flex align-items-center gap-2 border p-2 rounded mb-2 bg-light";

  div.innerHTML = `
    <select name="variants[${count}][color]" class="form-control form-control-sm" required>
      <option value="" disabled selected>Select Color</option>
      <option value="Red">Red</option>
      <option value="Blue">Blue</option>
      <option value="Green">Green</option>
      <option value="Black">Black</option>
      <option value="White">White</option>
    </select>

    <select name="variants[${count}][size]" class="form-control form-control-sm" required>
      <option value="" disabled selected>Select Size</option>
      <option value="6">6</option>
      <option value="7">7</option>
      <option value="8">8</option>
      <option value="9">9</option>
      <option value="10">10</option>
      <option value="11">11</option>
      <option value="42">42</option>
      <option value="43">43</option>
      <option value="44">44</option>
    </select>

    <input name="variants[${count}][sku]" class="form-control form-control-sm" placeholder="SKU">

    <input name="variants[${count}][stock]" type="number" class="form-control form-control-sm" placeholder="Stock">

    <div class="variant-image-box">
      <input type="file" name="variantImages[${count}]" 
        class="variantImageInput d-none" data-index="${count}">

      <img src="/images/no-image.png" 
           class="variantPreview" width="90"
           style="cursor:pointer; border-radius:6px; border:1px solid #ddd;">

      <div class="variant-actions">
        <small class="uploadImageBtn text-success">Upload</small>
        <small class="editImageBtn text-primary d-none">Edit</small>
        <small class="removeImageBtn text-danger ms-2 d-none">Remove</small>
      </div>
    </div>

    <button type="button" class="btn btn-outline-danger btn-sm removeVariantBtn">
      X
    </button>

    <input type="hidden" name="variants[${count}][_id]">
    <input type="hidden" name="variants[${count}][existingImage]">
  `;

  container.appendChild(div);

  updateVariantUI(div.querySelector(".variant-image-box"));
  
      if (window.updateSKU) {
      window.updateSKU(div);
    }

  count++;
});

  // ================= REMOVE VARIANT =================
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".removeVariantBtn");
  if (!btn) return;

  const item = btn.closest(".variant-item");
  if (!item) return;

  item.remove();
  reindexVariants();
});

});