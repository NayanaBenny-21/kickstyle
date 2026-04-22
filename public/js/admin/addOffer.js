document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("offerForm");
  const offerType = document.getElementById("offerType");
  const productSection = document.getElementById("productSection");
  const categorySection = document.getElementById("categorySection");
  const productSelect = document.getElementById("productSelect");
  const categorySelect = document.getElementById("categorySelect");
  const discountType = document.querySelector("select[name='discountType']");
  const discountValue = document.querySelector("input[name='discountValue']");

  // Error elements
  const offerNameError = document.getElementById("offerNameError");
  const offerTypeError = document.getElementById("offerTypeError");
  const discountTypeError = document.getElementById("discountTypeError");
  const discountValueError = document.getElementById("discountValueError");
  const productError = document.getElementById("productError");
  const categoryError = document.getElementById("categoryError");
  const dateError = document.getElementById("dateError");

  let choicesInstance;

  const show = (el, msg) => { el.textContent = msg; el.classList.remove("d-none"); };
  const hide = el => el.classList.add("d-none");

  // Show/hide product or category selection
  offerType.addEventListener("change", () => {
    if (offerType.value === "product") {
      productSection.classList.remove("d-none");
      categorySection.classList.add("d-none");
      if (!choicesInstance) {
        choicesInstance = new Choices(productSelect, { removeItemButton: true });
      }
    } else if (offerType.value === "category") {
      categorySection.classList.remove("d-none");
      productSection.classList.add("d-none");
    } else {
      productSection.classList.add("d-none");
      categorySection.classList.add("d-none");
    }
    discountValue.value = "";
  });

  // Enable discount input only after selecting discount type
  discountType.addEventListener("change", () => {
    discountValue.disabled = !discountType.value;
    discountValue.value = "";
  });

  // Calculate max allowed flat discount for selected products
  const getMinProductPrice = () => {
    const selectedOptions = [...productSelect.selectedOptions];
    if (!selectedOptions.length) return Infinity;
    const prices = selectedOptions.map(o => Number(o.dataset.price || 0));
    return Math.min(...prices);
  };

  // Validate flat discount dynamically
  const validateFlatDiscount = () => {
    if (discountType.value !== "flat") {
      hide(discountValueError);
      return true;
    }
    if (offerType.value !== "product") return true;

    const minPrice = getMinProductPrice();
    const val = Number(discountValue.value);
    if (val > minPrice) {
      show(discountValueError, `Flat discount cannot exceed ₹${minPrice}`);
      return false;
    } else {
      hide(discountValueError);
      return true;
    }
  };

  discountValue.addEventListener("input", validateFlatDiscount);
  productSelect.addEventListener("change", validateFlatDiscount);

  form.addEventListener("submit", e => {
    let valid = true;

    if (!form.offerName.value.trim()) { show(offerNameError, "Offer name required"); valid = false; } 
    else hide(offerNameError);

    if (!offerType.value) { show(offerTypeError, "Select offer type"); valid = false; } 
    else hide(offerTypeError);

    if (!discountType.value) { show(discountTypeError, "Select discount type"); valid = false; } 
    else hide(discountTypeError);

    const val = Number(discountValue.value);
    if (!val || val <= 0) { show(discountValueError, "Enter valid discount"); valid = false; } 
    else hide(discountValueError);

    if (discountType.value === "percentage" && val > 100) { 
      show(discountValueError, "Percentage cannot exceed 100"); valid = false; 
    }

    if (discountType.value === "flat" && offerType.value === "product") {
      if (!validateFlatDiscount()) valid = false;
    }

    if (new Date(form.startDate.value) >= new Date(form.endDate.value)) { 
      show(dateError, "End date must be after start date"); valid = false; 
    } else hide(dateError);

    if (offerType.value === "product") {
      const values = choicesInstance?.getValue(true) || [];
      if (!values.length) { show(productError, "Select at least one product"); valid = false; } 
      else hide(productError);
    }

    if (offerType.value === "category" && !categorySelect.value) {
      show(categoryError, "Select category"); valid = false;
    } else hide(categoryError);

    if (!valid) e.preventDefault();
  });
});
