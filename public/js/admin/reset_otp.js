document.addEventListener("DOMContentLoaded", () => {
  const resend = document.getElementById("resend");
  const timerElement = document.getElementById("timer");

  // Get remaining time from backend (used to continue timer after reload)
  let countdown = parseInt(window.remainingTime) || 0;

  let interval;
  let toastShown = false;

  // -------------------- TOAST FUNCTION --------------------
  // Reusable function to show alerts using SweetAlert
  function showToast(icon, text, redirect = null) {
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
    }).then(() => {
      // Optional redirect after toast
      if (redirect) {
        window.location.href = redirect;
      }
    });
  }

  // -------------------- TIMER FUNCTION --------------------
  function startTimer() {
    // Clear previous timer to avoid multiple intervals running
    if (interval) clearInterval(interval);

    // If time finished → show resend button
    if (countdown <= 0) {
      timerElement.style.display = "none";
      resend.style.display = "inline-block";
      resend.disabled = false;
      return;
    }

    // While timer is running → hide resend button
    resend.style.display = "none";
    resend.disabled = true;
    timerElement.style.display = "inline";

    interval = setInterval(() => {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;

      // Format time as mm:ss
      timerElement.textContent = `${minutes}:${
        seconds < 10 ? "0" : ""
      }${seconds} left`;

      countdown--;

      // When timer finishes
      if (countdown < 0) {
        clearInterval(interval);
        timerElement.textContent = "";
        timerElement.style.display = "none";
        resend.style.display = "inline-block";
        resend.disabled = false;
      }
    }, 1000);
  }

  // -------------------- INITIAL LOAD --------------------
  // Show toast only once and start timer if time exists
  if (countdown > 0 && !toastShown) {
    if (window.otpSent && window.remainingTime > 0) {
      showToast("success", "OTP sent to your email");
      toastShown = true; // prevent duplicate toast
    }

    startTimer();
  }

  // -------------------- RESEND OTP --------------------
  resend.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      // Call backend to resend OTP
      const res = await fetch(
        "/adminAuth/forgot-password/resend-otp",
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        // Restart timer after resend
        showToast("success", "OTP sent to your email");
        countdown = 60;
        startTimer();
      } else {
        // Show error + optional redirect
        showToast("error", data.message || "Failed to resend OTP").then(
          () => {
            if (data.redirect) window.location.href = data.redirect;
          }
        );
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Something went wrong. Try again.");
    }
  });

  // -------------------- OTP INPUT HANDLING --------------------
  const inputs = document.querySelectorAll(".otp-input");

  inputs.forEach((input) => {
    // Allow only numbers and move to next input automatically
    input.addEventListener("input", (e) => {
      if (isNaN(e.target.value)) {
        e.target.value = "";
      } else if (
        e.target.nextElementSibling &&
        e.target.value !== ""
      ) {
        input.nextElementSibling.focus();
      }
    });

    // Handle backspace navigation
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();

        // If current box has value → clear it
        if (input.value !== "") {
          input.value = "";
        }
        // If empty → move to previous input
        else if (input.previousElementSibling) {
          input.previousElementSibling.value = "";
          input.previousElementSibling.focus();
        }
      }
    });
  });
});