document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name");
  const nameError = document.getElementById("fullNameError");

  const nameRegex = /^[A-Za-z\s]+$/;
  const phoneRegex = /^[0-9]{10}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ===== Modal =====
  const emailModalEl = document.getElementById("emailOtpModal");
  const emailModal = new bootstrap.Modal(emailModalEl);

  // ===== Modal elements =====
  const newEmailInput = document.getElementById("newEmail");
  const emailErrorModal = document.getElementById("emailError");
  const sendEmailBtn = document.getElementById("sendEmailOtpBtn");
  const resendEmailBtn = document.getElementById("resendEmailOtpBtn");
const verifyEmailOtpBtn = document.getElementById("verifyEmailOtpBtn");
const emailOtpInput = document.getElementById("emailOtp");

  let emailOtpTimer = null;
  // ====== Show Modal ======
  document.getElementById("changeEmailBtn").addEventListener("click", () => {
     if(emailOtpTimer) {
        clearInterval(emailOtpTimer);
    emailOtpTimer = null;
}
    newEmailInput.value = "";
    emailErrorModal.textContent = "";
    sendEmailBtn.disabled = false;
    resendEmailBtn.disabled = true;
    resendEmailBtn.innerText = "Resend (60s)";
    emailModal.show();
  });

  document.getElementById("changePhoneBtn").addEventListener("click", () => {
    if(phoneOtpTimer) {
        clearInterval(phoneOtpTimer);
    phoneOtpTimer = null;
};
    newPhoneInput.value = "";
    phoneErrorModal.textContent = "";
    sendPhoneBtn.disabled = false;
    resendPhoneBtn.disabled = true;
    resendPhoneBtn.innerText = "Resend (60s)";
    phoneModal.show();
  });

  // ===== Name Validation =====
  nameInput.addEventListener("input", () => {
    const name = nameInput.value.trim();
    if (!name) nameError.textContent = "Please enter your name";
    else if (!nameRegex.test(name)) nameError.textContent = "Name should contain only alphabets";
    else nameError.textContent = "";
  });
 // ==========Phone Number Validation ====
  const phoneInput = document.getElementById("phone");
  const phoneError = document.getElementById("phoneError");

  phoneInput.addEventListener("input", () => {
    // Remove non-digit characters
    phoneInput.value = phoneInput.value.replace(/\D/g, "");

    // Validate 10 digits
    if (!/^\d{10}$/.test(phoneInput.value)) {
      phoneError.textContent = "Enter a valid 10-digit mobile number";
    } else {
      phoneError.textContent = "";
    }
  });

//=========Image Preview ==== 
const profileInput = document.getElementById("profileImageInput");
  const profilePreview = document.getElementById("profilePreview");
  const profileIcon = document.getElementById("profileIcon");

  // Store original state
  const originalSrc = profilePreview.src;
  const originalHasImage = profilePreview.style.display === "block";

  profileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      // Show preview image
      profilePreview.src = event.target.result;
      profilePreview.style.display = "block";
      // Hide icon
      profileIcon.style.display = "none";
    };
    reader.readAsDataURL(file);
  });

  // Cancel button restores original image/icon
  document.querySelector(".btn-outline-secondary").addEventListener("click", (e) => {
    // Reset preview to original state
    if (originalHasImage) {
      profilePreview.src = originalSrc;
      profilePreview.style.display = "block";
      profileIcon.style.display = "none";
    } else {
      profilePreview.style.display = "none";
      profileIcon.style.display = "flex";
    }

    // Clear file input
    profileInput.value = "";
  });
  // ===== OTP Timer Function =====
  const startOtpTimer = (btn, resendBtn, type) => {
    btn.disabled = true;
    resendBtn.disabled = true;
    let countdown = 60;
    resendBtn.innerText = `Resend (${countdown}s)`;
  const timer = setInterval(() => {
    countdown--;
    resendBtn.innerText = `Resend (${countdown}s)`;

    if (countdown <= 0) {
      clearInterval(timer);
      if (type === "email") emailOtpTimer = null;
      if (type === "phone") phoneOtpTimer = null;
      resendBtn.disabled = false;
      resendBtn.innerText = "Resend";
    }
  }, 1000);
    if (type === "email") emailOtpTimer = timer;
  else if (type === "phone") phoneOtpTimer = timer;
  };

  // ===== Email OTP Send =====
  sendEmailBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = newEmailInput.value.trim();

  if (!email) {
    emailErrorModal.textContent = "Please enter your email";
    return;
  }

  if (!emailRegex.test(email)) {
    emailErrorModal.textContent = "Invalid email format";
    return;
  }

  emailErrorModal.textContent = "";

  try {
    const res = await fetch('/profile/edit-profile/send-email-otp', {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail: email }),
    });

    const data = await res.json();

    if (data.success) {
      showToast("success", data.message || "OTP sent to email!");
      startOtpTimer(sendEmailBtn, resendEmailBtn, "email");
    } else {
      showToast("error", data.message || "Failed to send OTP");
    }
  } catch (err) {
    console.error("Error sending OTP:", err);
    showToast("error", "Something went wrong!");
  }
});


  

  // ===== Resend Buttons =====
resendEmailBtn.addEventListener("click", async () => {
    try {
        const res = await fetch("/profile/edit-profile/resend-email-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (data.success) showToast("success", data.message);
        else showToast("error", data.message);
        startOtpTimer(sendEmailBtn, resendEmailBtn, "email"); 
    } catch (err) {
        console.error(err);
        showToast("error", "Failed to resend OTP");
    }
});


//===========Email  OTP verification =========
verifyEmailOtpBtn.addEventListener('click', async(e) => {
  e.preventDefault();

  const otp = emailOtpInput.value.trim();
  if(!otp) {
        document.getElementById("emailError").textContent = "Enter OTP";
    return;
  };
  try {
    const res = await fetch("/profile/edit-profile/verify-email-otp",{
      method : 'POST',
      headers : {'Content-Type' : 'application/json'},
      body : JSON.stringify({otp})
    });
    const data = await res.json();
    if(data.success) {
      showToast("success", data.message || 'Email verified!');
      emailModal.hide();
      emailOtpInput.value = '';
    }else {
      showToast("error", data.message || 'Invalid OTP');
    }
  } catch (error) {
          console.error("Error verifying email OTP:", err);
    showToast("error", "Something went wrong!");
  }
});


  // ===== Toast Notification =====
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
