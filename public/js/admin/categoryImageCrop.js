document.addEventListener("DOMContentLoaded", () => {

  const imageInput = document.getElementById("categoryImageInput");
  const preview = document.getElementById("preview");
  const croppedInput = document.getElementById("croppedCategoryImage");

  const cropModalElement = document.getElementById("cropModal");
  const cropImage = document.getElementById("cropImage");
  const cropBtn = document.getElementById("cropBtn");

  if (!imageInput) return; // safety check

  const cropModal = new bootstrap.Modal(cropModalElement);

  let cropper;

  // ================= IMAGE SELECT =================
  imageInput.addEventListener("change", (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, JPEG and PNG images are allowed");
      imageInput.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      imageInput.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    cropImage.src = url;

    if (cropper) cropper.destroy();

    cropper = new Cropper(cropImage, {
      aspectRatio: 1,
      viewMode: 1,
      movable: true,
      zoomable: true,
      dragMode: "move",
      autoCropArea: 1
    });

    cropModal.show();
  });

  // ================= CROP BUTTON =================
  cropBtn.addEventListener("click", () => {

    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      width: 400,
      height: 400
    });

    const base64 = canvas.toDataURL("image/jpeg");

    // preview update
    preview.src = base64;

    // send to backend
    croppedInput.value = base64;

    cropModal.hide();
  });

});