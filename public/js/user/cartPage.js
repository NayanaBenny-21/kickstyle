document.addEventListener("DOMContentLoaded", () => {

  // ===================== Helper Functions =====================

  // Fetch available stock for a variant
  async function getVariantStock(productId, variantId) {
    try {
      const res = await fetch(`/product/${productId}/get-stock/${variantId}`);
      const data = await res.json();
      return data.success ? data.stock : null;
    } catch (error) {
      console.error("Error fetching stock:", error);
      return null;
    }
  }

  // Update totals in the order summary
  function updateTotals() {
    let subTotal = 0;

    document.querySelectorAll(".cart-item").forEach(item => {
      const price = parseFloat(item.dataset.price);
      const qtyInput = item.querySelector(".qtyInput");
      const qty = parseInt(qtyInput.value);
      const itemTotal = price * qty;
      subTotal += itemTotal;

      // Update item total in order summary
      const summarySpan = document.getElementById(`summary-total-${item.dataset.product}-${item.dataset.variant}`);
      if (summarySpan) summarySpan.textContent = `₹${itemTotal.toFixed(2)}`;

      // Update item name with quantity
      const summaryName = document.getElementById(`summary-name-${item.dataset.product}-${item.dataset.variant}`);
      if (summaryName) summaryName.textContent = `${summaryName.textContent.split('(')[0].trim()} (x${qty})`;
    });

    const shipping = subTotal > 1000 ? 0 : 40;
    const platformFee = 7;
    const grandTotal = subTotal + shipping + platformFee;

    document.getElementById("subTotal").textContent = `₹${subTotal.toFixed(2)}`;
    document.getElementById("shippingCharge").textContent = `₹${shipping.toFixed(2)}`;
    document.getElementById("platformFee").textContent = `₹${platformFee.toFixed(2)}`;
    document.getElementById("grandTotal").textContent = `₹${grandTotal.toFixed(2)}`;
  }

  // Update cart count in navbar
  async function updateCartCount() {
    try {
      const res = await fetch("/cart/count");
      const data = await res.json();
      if (data.success) {
        const badge = document.getElementById("cartCountBadge");
        if (badge) badge.textContent = data.count;
      }
    } catch (err) {
      console.error("Error updating cart count:", err);
    }
  }

  // ===================== Stock Refresh =====================
  async function refreshStock() {
    const cartItems = Array.from(document.querySelectorAll(".cart-item"));

    for (const item of cartItems) {
      const productId = item.dataset.product;
      const variantId = item.dataset.variant;
      const incBtn = item.querySelector('button[data-change="1"]');
      const qtyInput = item.querySelector(".qtyInput");

      try {
        const avlStock = await getVariantStock(productId, variantId);
        if (avlStock === null) continue;

        const maxAllowed = Math.min(avlStock, 5);
        const currentQty = parseInt(qtyInput.value);

        // Disable "+" if stock reached
        incBtn.disabled = currentQty >= maxAllowed;

        // Reduce quantity if stock reduced
        if (currentQty > maxAllowed) {
          qtyInput.value = maxAllowed;

          // Update server
          await fetch("/cart/update-quantity", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, variantId, quantity: maxAllowed })
          });

          updateTotals();
          updateCartCount();
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  // Refresh stock every 3 seconds
  setInterval(refreshStock, 3000);

  // ===================== Quantity Buttons =====================
  document.querySelectorAll(".updateQtyBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const row = btn.closest(".cart-item");
      const productId = row.dataset.product;
      const variantId = row.dataset.variant;
      const qtyInput = row.querySelector(".qtyInput");
      const decBtn = row.querySelector('button[data-change="-1"]');
      const incBtn = row.querySelector('button[data-change="1"]');

      const change = parseInt(btn.dataset.change);
      let newQty = parseInt(qtyInput.value) + change;

      const avlStock = await getVariantStock(productId, variantId);
      if (avlStock === null) return;

      const maxAllowed = Math.min(avlStock, 5);
      if (newQty < 1) return;
      if (newQty > maxAllowed) newQty = maxAllowed;

      qtyInput.value = newQty;
      incBtn.disabled = newQty >= maxAllowed;
      decBtn.disabled = newQty <= 1;

      // Update backend
      try {
        const res = await fetch("/cart/update-quantity", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantId, quantity: newQty })
        });
        const data = await res.json();

        if (data.success) {
          updateTotals();
          updateCartCount();
        } else if (data.limitError) {
          Swal.fire("Limit Reached", "You can only order 5 units", "warning");
        } else {
          Swal.fire("Error", data.message, "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Failed to update quantity", "error");
      }
    });
  });

  // ===================== Remove Item =====================
  document.querySelectorAll(".removeItemBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const row = btn.closest(".cart-item");
      const productId = row.dataset.product;
      const variantId = row.dataset.variant;

      const confirmResult = await Swal.fire({
        title: "Remove Item",
        text: "Are you sure you want to remove this item?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Remove"
      });

      if (!confirmResult.isConfirmed) return;

      try {
        const res = await fetch("/cart/remove-item", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, variantId })
        });
        const data = await res.json();

        if (data.success) {
          row.remove();
          document.getElementById(`summary-item-${productId}-${variantId}`)?.remove();
          updateTotals();
          updateCartCount();

          if (document.querySelectorAll(".cart-item").length === 0) {
            document.querySelector(".order-summary")?.classList.add("d-none");
            document.querySelector("#cartItemsSection")?.classList.add("d-none");
            document.querySelector("#emptyCartMessage")?.classList.remove("d-none");
          }
              if (document.querySelectorAll(".cart-item").length === 0) {

        // Hide cart items section
        document.getElementById("cartItemsSection")?.classList.add("d-none");

        // Hide order summary card
        document.querySelector(".order-summary")?.classList.add("d-none");

        // Show empty cart section
        document.getElementById("emptyCartMessage")?.classList.remove("d-none");
    }
        }
      } catch (err) {
        console.error(err);
      }
    });
  });

  // ===================== Place Order =====================
  document.getElementById("placeOrderBtn")?.addEventListener("click", async () => {
  try {
    const res = await fetch("/cart/check-stock-before-order", { method: "POST" });
    const data = await res.json();

    if (!data.success) {
      const msg = data.items
        .map(i => `${i.productName}:  available stock ${i.available} only`)
        .join("\n");
      Swal.fire("Stock Alert", msg, "info");
      return;
    }

    window.location.href = "/cart/select-address";
  } catch (err) {
    console.error("Error checking stock:", err);
    Swal.fire("Error", "Failed to check stock. Try again.", "error");
  }
});


updateTotals();
updateCartCount();

});