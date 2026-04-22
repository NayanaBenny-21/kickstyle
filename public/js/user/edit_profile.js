document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("changePasswordForm");

  const currentPassword = document.getElementById("currentPassword");
  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");

  const errorCurrent = document.getElementById("error-current");
  const errorNew = document.getElementById("error-new");
  const errorConfirm = document.getElementById("error-confirm");

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;

  // Disable initially
  newPassword.disabled = true;
  confirmPassword.disabled = true;

  /* ---------------------- 🔹 CHECK CURRENT PASSWORD ---------------------- */
  currentPassword.addEventListener("input", async () => {
    if (!currentPassword.value.trim()) {
      errorCurrent.textContent = "Please enter your current password.";
      newPassword.disabled = true;
      confirmPassword.disabled = true;
      return;
    }

    try {
      const res = await fetch("/check-current-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: currentPassword.value.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        errorCurrent.textContent = "";
        newPassword.disabled = false;
      } else {
        errorCurrent.textContent = "Current password is incorrect.";
        newPassword.disabled = true;
        confirmPassword.disabled = true;
      }
    } catch (err) {
      console.error("Error checking password:", err);
    }
  });

  /* ---------------------- 🔹 VALIDATE NEW PASSWORD ---------------------- */
  newPassword.addEventListener("input", () => {
    if (passwordRegex.test(newPassword.value)) {
      errorNew.textContent = "";
      confirmPassword.disabled = false;
    } else {
      errorNew.textContent =
        "Password must be 8–12 characters with letters, numbers & special characters.";
      confirmPassword.disabled = true;
    }
  });

  /* ---------------------- 🔹 CONFIRM PASSWORD MATCH ---------------------- */
  confirmPassword.addEventListener("input", () => {
    if (confirmPassword.value === newPassword.value) {
      errorConfirm.textContent = "";
    } else {
      errorConfirm.textContent = "Passwords do not match.";
    }
  });

  /* ---------------------- 🔹 SUBMIT FORM WITH AJAX ---------------------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (
      !currentPassword.value.trim() ||
      !passwordRegex.test(newPassword.value) ||
      confirmPassword.value !== newPassword.value
    ) {
      return;
    }

    try {
      const res = await fetch("/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: currentPassword.value.trim(),
          newPassword: newPassword.value.trim(),
          confirmPassword: confirmPassword.value.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        await Swal.fire({
          icon: "success",
          title: "Password Updated",
          text: data.message,
          confirmButtonColor: "#d33",
        });

        window.location.href = "/profile";
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message,
        });
      }
    } catch (err) {
      console.error("Error updating password:", err);
      Swal.fire("Error", "Something went wrong", "error");
    }
  });

  /* ---------------------- 🔹 TOGGLE PASSWORD VISIBILITY ---------------------- */
  function togglePassword(toggleId, inputId, iconId) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    toggle.addEventListener("click", () => {
      if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye-slash", "fa-eye");
      } else {
        input.type = "password";
        icon.classList.replace("fa-eye", "fa-eye-slash");
      }
    });
  }


  togglePassword("toggleCurrent", "currentPassword", "currentIcon");
  togglePassword("toggleNew", "newPassword", "newIcon");
  togglePassword("toggleConfirm", "confirmPassword", "confirmIcon");


  const imageInput = document.getElementById("imageUpload");
  const preview = document.getElementById("profilePreview");
  const icon = document.getElementById("iconContainer");

  // imageInput.addEventListener("change", function () {
  //   const file = this.files[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = function (e) {
  //     preview.src = e.target.result;
  //     preview.classList.remove("d-none");
  //     icon.classList.add("d-none");

  //     document.getElementById("removeImage").value = "false";
  //     document.getElementById("removeImageBtn").style.display = "inline-block";
  //   };
  //   reader.readAsDataURL(file);
  // });

  // Remove Button Fix
  const removeBtn = document.getElementById("removeImageBtn");
  const removeInput = document.getElementById("removeImage");

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {

      removeInput.value = "true";

      preview.classList.add("d-none");
      preview.src = "";

      icon.classList.remove("d-none");

      imageInput.value = "";

      removeBtn.style.display = "none";
    });
  }

});