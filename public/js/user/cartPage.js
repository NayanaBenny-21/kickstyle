document.addEventListener("DOMContentLoaded", () => {
 
 
  // Update Quantity
  document.querySelectorAll(".updateQtyBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const productId = btn.dataset.product;
      const variantId = btn.dataset.variant;
      const change = parseInt(btn.dataset.change);

            const qtyInput = btn.closest(".d-flex").querySelector("input");
      const decBtn = btn.closest(".d-flex").querySelector('button[data-change="-1"]');
            const currentQty = parseInt(qtyInput.value);
      const newQty = currentQty + change;

      if (newQty < 1) return;
      decBtn.disabled = newQty <= 1;
      try {
        const res = await fetch(`/cart/update-quantity`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantId, quantity: newQty }),
        });

        const data = await res.json();
        if (data.success) window.location.reload();
        else Swal.fire("Error", data.message, "error");
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to update quantity", "error");
      }
    });
  });

  // Remove item
  document.querySelectorAll(".removeItemBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const productId = btn.dataset.product;
      const variantId = btn.dataset.variant

      const confirm = await Swal.fire({
        title: "Remove Item",
        text: "Are you sure you want to remove this item ",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Remove",
      });

      if (!confirm.isConfirmed) return;

      try {
const res = await fetch("/cart/remove-item", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantId }),
        });
        const data = await res.json();
        if (data.success) window.location.reload();
      } catch (err) {
        console.error(err);
      }
    });
  });

  // Place Order
  document.getElementById("placeOrderBtn")?.addEventListener("click", () => {
    window.location.href = "/checkout";
  });
});
