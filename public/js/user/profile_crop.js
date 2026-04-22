document.addEventListener("DOMContentLoaded", () => {

  // ========================= ELEMENTS =========================
  const profileImageInput = document.getElementById("profileImageInput");
  const profilePreview = document.getElementById("profilePreview");
  const profileIcon = document.querySelector(".fa-user"); 
  const removeImageBtn = document.getElementById("removeImageBtn");
  const removeInput = document.getElementById("removeImage"); // hidden input to tell backend
  const croppedInput = document.getElementById("croppedImageInput");

  const cropModal = new bootstrap.Modal(document.getElementById("cropModal"));
  const cropImage = document.getElementById("cropImage");
  const cropBtn = document.getElementById("cropBtn");

  let cropper = null;

  // ========================= IMAGE SELECTION =========================
  profileImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, JPEG and PNG images are allowed.");
      profileImageInput.value = "";
      return;
    }

    // Validate size (<2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB.");
      profileImageInput.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    cropImage.src = url;

    // Destroy previous cropper if exists
    if (cropper) cropper.destroy();

    cropper = new Cropper(cropImage, {
      aspectRatio: 1,
      viewMode: 1,
      movable: true,
      zoomable: true,
      rotatable: false,
      scalable: false,
      dragMode: "move",
      autoCropArea: 1
    });

    cropModal.show();
  });

  // ========================= CROP BUTTON =========================
  cropBtn.addEventListener("click", () => {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
      width: 300,
      height: 300,
      fillColor: "#fff"
    });

    const base64 = canvas.toDataURL("image/jpeg");

    // Update preview
    profilePreview.src = base64;
  profilePreview.classList.remove("d-none");
  profileIcon.classList.add("d-none");

    // Save to hidden input for backend
    croppedInput.value = base64;

    removeInput.value = "false";

    removeImageBtn.style.display = "inline-block";

    cropModal.hide();
  });

 // ========================= REMOVE IMAGE =========================
  removeImageBtn.addEventListener("click", () => {
    profilePreview.src = "";
    profilePreview.classList.add("d-none");
    profileIcon.classList.remove("d-none");

    profileImageInput.value = "";
    croppedInput.value = "";
    removeInput.value = "true";

    removeImageBtn.style.display = "none";
  });

});
