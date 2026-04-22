document.addEventListener("DOMContentLoaded", () => {

  console.log("productImageCrop.js loaded");

  const galleryInput = document.getElementById("galleryFiles");
  const preview = document.getElementById("preview");
  const cropModalEl = document.getElementById("cropModal");
  const cropImage = document.getElementById("cropImage");
  const cropBtn = document.getElementById("cropBtn");
  const croppedInput = document.getElementById("croppedImages");

  const cropModal = new bootstrap.Modal(cropModalEl);

  let cropper = null;
  let filesQueue = [];
  const dataTransfer = new DataTransfer();

  // When user selects images
  galleryInput.addEventListener("change", (e) => {

    console.log("Files selected");

    filesQueue = Array.from(e.target.files);

    if (filesQueue.length > 0) {
      openCropper(filesQueue.shift());
    }

  });

  function openCropper(file) {

    const reader = new FileReader();

    reader.onload = function (e) {

      cropImage.src = e.target.result;

      cropModal.show();

    };

    reader.readAsDataURL(file);
  }

  // Wait until modal AND image are visible
  cropModalEl.addEventListener("shown.bs.modal", () => {

    cropImage.onload = () => {

      if (cropper) cropper.destroy();

      cropper = new Cropper(cropImage, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 1,
        movable: true,
        zoomable: true
      });

    };

  });

  // Crop button
  cropBtn.addEventListener("click", () => {

    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      width: 800,
      height: 800
    });

    canvas.toBlob((blob) => {

      const croppedFile = new File(
        [blob],
        "cropped_" + Date.now() + ".jpg",
        { type: "image/jpeg" }
      );

      dataTransfer.items.add(croppedFile);
      croppedInput.files = dataTransfer.files;

      // preview
      const img = document.createElement("img");

      img.src = URL.createObjectURL(blob);
      img.style.width = "90px";
      img.style.height = "90px";
      img.style.objectFit = "cover";
      img.classList.add("m-2", "border", "rounded");

      preview.appendChild(img);

      cropModal.hide();

      // next image
      if (filesQueue.length > 0) {
        openCropper(filesQueue.shift());
      }

    });

  });

});