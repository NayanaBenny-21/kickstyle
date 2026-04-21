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
  let count = container.querySelectorAll(".variant-item").length;

 document.getElementById("addVariantBtn").addEventListener("click", () => {
  const tr = document.createElement("tr");

  tr.className = "variant-item";

  tr.innerHTML = `
    <td>
      <select name="variants[${count}][color]" class="form-select" required>
        <option value="">Color</option>
        <option>Red</option>
        <option>Blue</option>
        <option>Black</option>
      </select>
    </td>

    <td>
      <select name="variants[${count}][size]" class="form-select" required>
        <option value="">Size</option>
        <option>6</option>
        <option>7</option>
        <option>8</option>
      </select>
    </td>

    <td>
      <input name="variants[${count}][sku]" class="form-control" placeholder="SKU">
    </td>

    <td>
      <input name="variants[${count}][stock]" type="number" class="form-control">
    </td>

    <td>
      <div class="variant-image-box text-center">
        <input type="file" name="variantImages[${count}]" 
          class="variantImageInput d-none" data-index="${count}">

        <img src="/images/no-image.png" 
             class="variantPreview mb-1" width="70">

        <div class="variant-actions">
          <small class="uploadImageBtn text-success">Upload</small>
          <small class="editImageBtn text-primary d-none">Edit</small>
          <small class="removeImageBtn text-danger d-none">Remove</small>
        </div>
      </div>
    </td>

    <td>
      <button type="button" class="btn btn-sm btn-danger removeVariantBtn">X</button>
    </td>

    <input type="hidden" name="variants[${count}][_id]">
    <input type="hidden" name="variants[${count}][existingImage]">
  `;

  container.appendChild(tr);

  updateVariantUI(tr.querySelector(".variant-image-box"));

  count++;
});

  // ================= REMOVE VARIANT =================
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("removeVariantBtn")) {
      e.target.closest(".variant-item").remove();
      reindexVariants();
    }
  });

});