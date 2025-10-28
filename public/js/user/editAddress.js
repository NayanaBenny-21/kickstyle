document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("editAddressForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const addressId = form.dataset.id;
    const fromPage = form.dataset.from; 
    const formData = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch(`/address/edit/${addressId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: data.message || "Address updated successfully",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
         if (fromPage === "selectAddress") {
            window.location.href = "/checkout/select-address";
          } else {
            window.location.href = "/address";
          }
        });
      } else {
        Swal.fire("Error", data.message || "Failed to update address", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Something went wrong", "error");
    }
  });
});
