document.addEventListener("DOMContentLoaded", () => {

  // ========================= REGEX =========================
  const nameRegex = /^[A-Za-z\s]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;  // Indian mobile numbers

  // ========================= INPUT ELEMENTS =========================
  const nameInput = document.querySelector("input[name='name']");
  const nameError = document.getElementById("fullNameError");

  const phoneInput = document.getElementById("phone");
  const phoneError = document.getElementById("phoneError");

  // ========================= PROFILE IMAGE HANDLING =========================
  const profileImageInput = document.getElementById("profileImageInput");
  const profilePreview = document.querySelector("img[alt='Profile Image']");
  const profileIcon = document.querySelector(".fa-user");
  const removeImageBtn = document.getElementById("removeImageBtn");
  const removeImageField = document.getElementById("removeImage");

  profileImageInput.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      alert("Only JPG, JPEG & PNG allowed.");
      this.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB.");
      this.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      profilePreview.src = e.target.result;
      profilePreview.style.display = "block";
      if (profileIcon) profileIcon.style.display = "none";
      removeImageBtn.style.display = "inline-block";
      removeImageField.value = "false";
    };

    reader.readAsDataURL(file);
  });

  removeImageBtn.addEventListener("click", () => {
    profilePreview.src = "";
    profilePreview.style.display = "none";
    if (profileIcon) profileIcon.style.display = "flex";
    profileImageInput.value = "";
    removeImageField.value = "true";
    removeImageBtn.style.display = "none";
  });

  // ========================= NAME VALIDATION =========================
nameInput.addEventListener("blur", () => {
  const n = nameInput.value.trim();

  if (!n) {
    nameError.textContent = "Please enter your name";
    nameInput.style.borderColor = "red";
    return;
  }

  if (!nameRegex.test(n)) {
    nameError.textContent = "Name should contain alphabets only";
    nameInput.style.borderColor = "red";
    return;
  }

  // VALID
  nameError.textContent = "";
  nameInput.style.borderColor = "#28a745"; // success green
});

  // ========================= PHONE VALIDATION =========================
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, ""); // allow only numbers
  });

  phoneInput.addEventListener("blur", () => {
    const phoneValue = phoneInput.value.trim();

    if (!phoneValue) {
      phoneError.textContent = "Phone number is required.";
      phoneInput.style.borderColor = "red";
      return;
    }

    if (!phoneRegex.test(phoneValue)) {
      phoneError.textContent = "Enter a valid 10-digit mobile number.";
      phoneInput.style.borderColor = "red";
      return;
    }

    // VALID phone
    phoneError.textContent = "";
    phoneInput.style.borderColor = "#28a745";
  });

  // ========================= FINAL FORM VALIDATION (BLOCK SUBMIT) =========================
  document.getElementById("editProfileForm").addEventListener("submit", (e) => {
    let hasError = false;

    const nameValue = nameInput.value.trim();
    const phoneValue = phoneInput.value.trim();

    // Validate name
    if (!nameValue || !nameRegex.test(nameValue)) {
      nameError.textContent = "Please enter a valid name.";
      nameInput.style.borderColor = "red";
      hasError = true;
    }

    // Validate phone
    if (!phoneRegex.test(phoneValue)) {
      phoneError.textContent = "Enter a valid 10-digit mobile number.";
      phoneInput.style.borderColor = "red";
      hasError = true;
    }


    if (hasError) {
      e.preventDefault();
    }
  });

  // ========================= EMAIL OTP LOGIC (UNCHANGED) =========================

  const emailModal = new bootstrap.Modal(document.getElementById("emailOtpModal"));
  const newEmailInput = document.getElementById("newEmail");
  const emailErrorModal = document.getElementById("emailError");
  const sendEmailBtn = document.getElementById("sendEmailOtpBtn");
  const resendEmailBtn = document.getElementById("resendEmailOtpBtn");
  const verifyEmailOtpBtn = document.getElementById("verifyEmailOtpBtn");
  const emailOtpInput = document.getElementById("emailOtp");
  const changeEmailBtn = document.getElementById("changeEmailBtn");
  let emailOtpTimer = null;

  changeEmailBtn.addEventListener("click", () => {
    newEmailInput.value = "";
    emailOtpInput.value = "";
    emailErrorModal.textContent = "";
    resendEmailBtn.disabled = true;
    resendEmailBtn.textContent = "Resend";
    emailModal.show();
  });

  const startOtpTimer = () => {
    sendEmailBtn.disabled = true;
    resendEmailBtn.disabled = true;
    let countdown = 60;
    resendEmailBtn.textContent = `Resend (${countdown}s)`;

    emailOtpTimer = setInterval(() => {
      countdown--;
      resendEmailBtn.textContent = `Resend (${countdown}s)`;
      if (countdown <= 0) {
        clearInterval(emailOtpTimer);
        resendEmailBtn.disabled = false;
        resendEmailBtn.textContent = "Resend";
      }
    }, 1000);
  };

  // SEND EMAIL OTP
  sendEmailBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = newEmailInput.value.trim();
    if (!email) return (emailErrorModal.textContent = "Please enter an email");
    if (!emailRegex.test(email)) return (emailErrorModal.textContent = "Invalid email");

    try {
      const res = await fetch("/profile/edit-profile/send-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: email }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("success", data.message);
        startOtpTimer();
      } else {
        showToast("error", data.message);
      }
    } catch {
      showToast("error", "Server error");
    }
  });

  // RESEND EMAIL OTP
  resendEmailBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/profile/edit-profile/resend-email-otp", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        showToast("success", data.message);
        startOtpTimer();
      } else {
        showToast("error", data.message);
      }
    } catch {
      showToast("error", "Failed to resend");
    }
  });

  // VERIFY OTP
  verifyEmailOtpBtn.addEventListener("click", async () => {
    const otp = emailOtpInput.value.trim();
    if (!otp) return (emailErrorModal.textContent = "Enter OTP");

    try {
      const res = await fetch("/profile/edit-profile/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();

      if (data.success) {
        showToast("success", "Email verified!");

        const newEmail = newEmailInput.value.trim();
        document.getElementById("verifiedEmail").value = newEmail;

        const emailInput = document.getElementById("email");
        emailInput.value = newEmail;
        emailInput.removeAttribute("readonly");

        emailModal.hide();
      } else {
        showToast("error", "Invalid OTP");
      }
    } catch {
      showToast("error", "Server error");
    }
  });

  // Toast
  function showToast(icon, text) {
    Swal.fire({
      icon,
      text,
      toast: true,
      position: "bottom",
      timer: 2500,
      showConfirmButton: false,
      width: 350,
      padding: "0.5em 1em",
      customClass: { popup: "small-toast" },
    });
  }

});
