document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("offerForm");
  const offerType = document.getElementById("offerType");
  const productSection = document.getElementById("productSection");
  const categorySection = document.getElementById("categorySection");
  const productSelect = document.getElementById("productSelect");
  const categorySelect = document.getElementById("categorySelect");
  const discountType = document.querySelector("select[name='discountType']");
  const discountValue = document.querySelector("input[name='discountValue']");

  // Errors
  const offerNameError = document.getElementById("offerNameError");
  const offerTypeError = document.getElementById("offerTypeError");
  const discountTypeError = document.getElementById("discountTypeError");
  const discountValueError = document.getElementById("discountValueError");
  const productError = document.getElementById("productError");
  const categoryError = document.getElementById("categoryError");
  const dateError = document.getElementById("dateError");

  let choicesInstance;

  const show = (el, msg) => {
    el.textContent = msg;
    el.classList.remove("d-none");
  };
  const hide = el => el.classList.add("d-none");


  discountValue.disabled = !discountType.value;

  if (offerType.value === "product") {
    productSection.classList.remove("d-none");
    categorySection.classList.add("d-none");

    choicesInstance = new Choices(productSelect, {
      removeItemButton: true
    });

  } else if (offerType.value === "category") {
    categorySection.classList.remove("d-none");
    productSection.classList.add("d-none");
  }

  /* ---------------- OFFER TYPE CHANGE ---------------- */

  offerType.addEventListener("change", () => {
    hide(productError);
    hide(categoryError);

    if (offerType.value === "product") {
      productSection.classList.remove("d-none");
      categorySection.classList.add("d-none");

      if (!choicesInstance) {
        choicesInstance = new Choices(productSelect, {
          removeItemButton: true
        });
      }

    } else if (offerType.value === "category") {
      categorySection.classList.remove("d-none");
      productSection.classList.add("d-none");
    } else {
      productSection.classList.add("d-none");
      categorySection.classList.add("d-none");
    }
  });

  /* ---------------- DISCOUNT TYPE ---------------- */

  discountType.addEventListener("change", () => {
    discountValue.disabled = !discountType.value;
  });

  /* ---------------- FLAT DISCOUNT VALIDATION ---------------- */

  const getMinProductPrice = () => {
    const selected = [...productSelect.selectedOptions];
    if (!selected.length) return Infinity;
    return Math.min(...selected.map(o => Number(o.dataset.price || 0)));
  };

  const validateFlatDiscount = () => {
    if (discountType.value !== "flat" || offerType.value !== "product") {
      hide(discountValueError);
      return true;
    }

    const val = Number(discountValue.value);
    const minPrice = getMinProductPrice();

    if (val > minPrice) {
      show(discountValueError, `Flat discount cannot exceed ₹${minPrice}`);
      return false;
    }

    hide(discountValueError);
    return true;
  };

  discountValue.addEventListener("input", validateFlatDiscount);
  productSelect.addEventListener("change", validateFlatDiscount);

  /* ---------------- FORM SUBMIT ---------------- */

  form.addEventListener("submit", e => {
    let valid = true;
    const val = Number(discountValue.value);

    if (!form.offerName.value.trim()) {
      show(offerNameError, "Offer name required");
      valid = false;
    } else hide(offerNameError);

    if (!offerType.value) {
      show(offerTypeError, "Select offer type");
      valid = false;
    } else hide(offerTypeError);

    if (!discountType.value) {
      show(discountTypeError, "Select discount type");
      valid = false;
    } else hide(discountTypeError);

    if (!val || val <= 0) {
      show(discountValueError, "Enter valid discount");
      valid = false;
    }

    if (discountType.value === "percentage" && val > 100) {
      show(discountValueError, "Percentage cannot exceed 100");
      valid = false;
    }

    if (discountType.value === "flat" && !validateFlatDiscount()) {
      valid = false;
    }

    if (new Date(form.startDate.value) >= new Date(form.endDate.value)) {
      show(dateError, "End date must be after start date");
      valid = false;
    } else hide(dateError);

    if (offerType.value === "product") {
      const values = choicesInstance?.getValue(true) || [];
      if (!values.length) {
        show(productError, "Select at least one product");
        valid = false;
      } else hide(productError);
    }

    if (offerType.value === "category" && !categorySelect.value) {
      show(categoryError, "Select category");
      valid = false;
    } else hide(categoryError);

    if (!valid) e.preventDefault();
  });

  /*----------------------------------Status---------------- */
const statusToggle = document.getElementById("statusToggle");
const statusInput = document.getElementById("isActiveInput");
const statusLabel = document.getElementById("statusLabel");

if (statusToggle && statusInput) {
  const updateStatus = () => {
    if (statusToggle.checked) {
      statusInput.value = "true";
      statusLabel.textContent = "Active";
    } else {
      statusInput.value = "false";
      statusLabel.textContent = "Blocked";
    }
  };

 
  updateStatus();

  statusToggle.addEventListener("change", updateStatus);
}
});
