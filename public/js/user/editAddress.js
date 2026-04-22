document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("editAddressForm");

  const pincodeInput = document.querySelector("input[name='pincode']");
  const pincodeError = document.getElementById("pincodeError");

  const mobileInput = document.querySelector("input[name='mobile']");
  const mobileError = document.getElementById("mobileError");

  const pincodeRegex = /^[1-9][0-9]{5}$/;
  const mobileRegex = /^[6-9]\d{9}$/;

  // ---------------------------
  // PINCODE VALIDATION
  // ---------------------------
  pincodeInput.addEventListener("blur", () => {
    const value = pincodeInput.value.trim();
    if (!pincodeRegex.test(value)) {
      pincodeError.textContent = "Please enter a valid 6-digit pincode.";
      pincodeInput.classList.add("is-invalid");
    } else {
      pincodeError.textContent = "";
      pincodeInput.classList.remove("is-invalid");
    }
  });

  pincodeInput.addEventListener("input", () => {
    pincodeError.textContent = "";
    pincodeInput.classList.remove("is-invalid");
  });

  // ---------------------------
  // MOBILE VALIDATION
  // ---------------------------
  mobileInput.addEventListener("blur", () => {
    const value = mobileInput.value.trim();
    if (!mobileRegex.test(value)) {
      mobileError.textContent = "Please enter a valid 10-digit phone number";
      mobileInput.classList.add("is-invalid");
    } else {
      mobileError.textContent = "";
      mobileInput.classList.remove("is-invalid");
    }
  });

  mobileInput.addEventListener("input", () => {
    mobileError.textContent = "";
    mobileInput.classList.remove("is-invalid");
  });

  // ---------------------------
  // FORM SUBMIT
  // ---------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const addressId = form.dataset.id;

    // Use hidden input for "from" page fallback
    const fromPage = form.querySelector("input[name='from']")?.value || 'profile';
 console.log("Form submit → fromPage:", fromPage);
    const formData = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(`/address/edit/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: data.message || "Address updated successfully",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          // Redirect based on "from"
          if (fromPage === "checkout" || fromPage === "selectAddress") {
            window.location.href = "/cart/select-address";
          } else {
            window.location.href = "/address";
          }
        });
      } else {
        Swal.fire("Error", data.message || "Failed to update address", "error");
      }
    } catch (error) {
      console.error("edit address:", error);
      Swal.fire("Error", "Something went wrong", "error");
    }
  });
});
