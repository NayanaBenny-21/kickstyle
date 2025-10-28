document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addAddressForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

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

      const data = await res.json();

      if (data.success) {
        await Swal.fire("Success", data.message || "Address saved successfully!", "success");
        window.location.href = "/address";
      } else {
        Swal.fire("Error", data.message || "Failed to save address", "error");
      }
    } catch (err) {
      console.error("Error submitting address form:", err);
      Swal.fire("Error", "Server error while saving address", "error");
    }
  });
});
