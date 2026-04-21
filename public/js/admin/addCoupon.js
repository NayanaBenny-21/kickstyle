document.addEventListener("DOMContentLoaded", () => {
const form = document.getElementById("couponForm");

function validateField(field) {
  if (field.disabled) return true;

  let valid = true;
  const value = field.value.trim();

  // ===== NAME =====
  if (field.name === "name") {
    const hasValidChars = /^[a-zA-Z0-9 ]+$/.test(value);
    valid = value !== "" && hasValidChars;

    showError(field, valid, "Only letters & numbers allowed");
  }

  // ===== COUPON CODE =====
  else if (field.name === "couponCode") {
    const isValid = /^[A-Z0-9]{3,}$/.test(value);

    valid = value !== "" && isValid;

    showError(field, valid, "Use uppercase letters & numbers only (min 3 chars)");
  }

  // ===== DEFAULT =====
  else if (field.hasAttribute("required")) {
    valid = value !== "";
    showError(field, valid, "This field is required");
  }

  return valid;
}

function showError(field, valid, message) {
  const old = field.parentElement.querySelector(".error-message");
  if (old) old.remove();

  if (!valid) {
    field.classList.add("is-invalid");

    const error = document.createElement("div");
    error.classList.add("text-danger", "error-message", "mt-1");
    error.textContent = message;

   field.parentElement.insertBefore(error, field);
  } else {
    field.classList.remove("is-invalid");
  }
}

 form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let allValid = true;
  const fields = form.querySelectorAll("input, textarea, select");

  fields.forEach(field => {
    const valid = validateField(field);
    if (!valid) allValid = false;
  });

  if (!allValid) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // SEND TO BACKEND
 const formData = new URLSearchParams(new FormData(form));

  try {
const res = await fetch("/admin/coupon/add", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: formData
});
    const data = await res.json();

    if (!res.ok) {
      // ❌ SHOW BACKEND ERROR IN SWAL
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message
      });
    } else {
      // ✅ SUCCESS
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Coupon added successfully"
      }).then(() => {
        window.location.href = "/admin/coupon-management";
      });
    }

  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Something went wrong", "error");
  }
});

  // live remove red border and error message
  form.addEventListener("input", (e) => validateField(e.target));
  form.addEventListener("change", (e) => validateField(e.target));


  
});
