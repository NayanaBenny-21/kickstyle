document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  function validateField(field) {
    let valid = true;

    if (field.hasAttribute("required")) {
      if (field.type === "checkbox") {
        valid = field.checked;
      } else if (field.type === "number") {
        valid = field.value !== "" && !isNaN(field.value);
      } else {
        valid = field.value.trim() !== "";
      }
    }

    if (!valid) {
      field.classList.add("is-invalid");
      if (!field.parentElement.querySelector(".error-message")) {
        const error = document.createElement("div");
        error.classList.add("text-danger", "error-message", "mt-1");
        error.textContent = "This field is required";
        field.parentElement.appendChild(error);
      }
    } else {
      field.classList.remove("is-invalid");
      const msg = field.parentElement.querySelector(".error-message");
      if (msg) msg.remove();
    }

    return valid;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault(); 
    let allValid = true;

    // get all inputs, textareas, selects including dynamically added ones
    const fields = form.querySelectorAll("input, textarea, select");
    fields.forEach(field => {
      const valid = validateField(field);
      if (!valid) allValid = false;
    });

    if (allValid) {
      form.submit(); // only submit if all fields are valid
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // live remove red border and error message
  form.addEventListener("input", (e) => validateField(e.target));
  form.addEventListener("change", (e) => validateField(e.target));


  
});
