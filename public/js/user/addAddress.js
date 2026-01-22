document.addEventListener("DOMContentLoaded", () => {
  console.log("addAddress.js loaded");

  const form = document.getElementById("addAddressForm");

  const nameInput = form.name;
  const mobileInput = form.mobile;
  const pincodeInput = form.pincode;

  const nameError = document.getElementById("nameError");
  const mobileError = document.getElementById("mobileError");
  const pincodeError = document.getElementById("pincodeError");

  const nameRegex = /^[A-Za-z ]{3,}$/;
  const mobileRegex = /^[6-9]\d{9}$/;
  const pincodeRegex = /^[1-9][0-9]{5}$/;

  /* -----------------------------
      NAME VALIDATION
   ----------------------------- */

  nameInput.addEventListener("blur", () => {
    const value = nameInput.value.trim();

    if (!nameRegex.test(value)) {
      nameError.textContent = "Enter name includes alphabets only";
      nameInput.classList.add("is-invalid");
      nameInput.focus(); 
    } else {
      nameError.textContent = "";
      nameInput.classList.remove("is-invalid");
    }
  });

  nameInput.addEventListener("input", () => {
    nameError.textContent = "";
    nameInput.classList.remove("is-invalid");
  });

  /* -----------------------------
      MOBILE VALIDATION
   ----------------------------- */
  mobileInput.addEventListener("blur", () => {
    const value = mobileInput.value.trim();

    if (!mobileRegex.test(value)) {
      mobileError.textContent = "Enter a valid 10-digit mobile number";
      mobileInput.classList.add("is-invalid");
      mobileInput.focus();
    } else {
      mobileError.textContent = "";
      mobileInput.classList.remove("is-invalid");
    }
  });

  mobileInput.addEventListener("input", () => {
    mobileError.textContent = "";
    mobileInput.classList.remove("is-invalid");
  });

  /* -----------------------------
      PINCODE VALIDATION
   ----------------------------- */
  pincodeInput.addEventListener("blur", () => {
    const value = pincodeInput.value.trim();

    if (!pincodeRegex.test(value)) {
      pincodeError.textContent = "Enter a valid 6-digit pincode";
      pincodeInput.classList.add("is-invalid");
      pincodeInput.focus();
    } else {
      pincodeError.textContent = "";
      pincodeInput.classList.remove("is-invalid");
    }
  });

  pincodeInput.addEventListener("input", () => {
    pincodeError.textContent = "";
    pincodeInput.classList.remove("is-invalid");
  });

  /* -----------------------------
      FORM SUBMIT
   ----------------------------- */

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // FINAL CHECK BEFORE SUBMIT
    if (
      !nameRegex.test(nameInput.value.trim()) ||
      !mobileRegex.test(mobileInput.value.trim()) ||
      !pincodeRegex.test(pincodeInput.value.trim())
    ) {
      Swal.fire("Error", "Please fix the errors before submitting", "error");
      return;
    }

    const formData = {
      name: form.name.value.trim(),
      mobile: form.mobile.value.trim(),
      pincode: form.pincode.value.trim(),
      locality: form.locality.value.trim(),
      addressLine: form.address.value.trim(),
      city: form.city.value.trim(),
      state: form.state.value.trim(),
      landmark: form.landmark.value.trim(),
      addressType: form.addressType.value,
      isDefault: form.isDefault.checked,
    };

    try {
      const res = await fetch("/address/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid JSON response");
      }

      if (data.success) {
        await Swal.fire("Success", "Address saved successfully!", "success");
        window.location.href = "/address";
      } else {
        Swal.fire("Error", data.message || "Failed to save address", "error");
      }
    } catch (err) {
      console.log("catch block addAddress");
      window.location.href = "/address";
    }
  });
});
