document.addEventListener("DOMContentLoaded", () => {

  const addTermBtn = document.getElementById("add-term");
  const termsContainer = document.getElementById("terms-container");
  const termsError = document.getElementById("termsError");
  const form = document.querySelector("form");

  /* ===============================
     REMOVE HANDLER
  =============================== */
  function attachRemoveHandler(button) {
    button.addEventListener("click", () => {
      const rows = termsContainer.querySelectorAll("input[name='termsAndConditions[]']");
      if (rows.length === 1) return; // block last row delete
      button.parentElement.remove();
    });
  }

  document.querySelectorAll(".remove-term").forEach(btn =>
    attachRemoveHandler(btn)
  );

  /* ===============================
     ADD NEW TERM
  =============================== */
  addTermBtn.addEventListener("click", () => {
    const div = document.createElement("div");
    div.className = "mb-2 d-flex";

    div.innerHTML = `
      <input type="text"
             name="termsAndConditions[]"
             class="form-control me-2"
             placeholder="Enter T&C point">
      <button type="button" class="btn btn-outline-danger remove-term">
        <i class="bi bi-trash"></i>
      </button>
    `;

    termsContainer.appendChild(div);
    attachRemoveHandler(div.querySelector(".remove-term"));
  });

  /* ===============================
     FORM VALIDATION
  =============================== */
  form.addEventListener("submit", e => {
    const inputs = [...termsContainer.querySelectorAll("input[name='termsAndConditions[]']")];
    let hasError = false;

    inputs.forEach(input => {
      if (!input.value.trim()) {
        input.classList.add("is-invalid");
        hasError = true;
      } else {
        input.classList.remove("is-invalid");
      }
    });

    if (hasError) {
      e.preventDefault();
      termsError.textContent = "Terms & Conditions cannot be empty";
      termsError.classList.remove("d-none");
    } else {
      termsError.classList.add("d-none");
    }
  });

  /* ===============================
     STATUS LABEL
  =============================== */
  const statusToggle = document.getElementById("statusToggle");
  const statusLabel = document.getElementById("statusLabel");

  if (statusToggle && statusLabel) {
    statusLabel.textContent = statusToggle.checked ? "Active" : "Blocked";
    statusToggle.addEventListener("change", () => {
      statusLabel.textContent = statusToggle.checked ? "Active" : "Blocked";
    });
  }
});
