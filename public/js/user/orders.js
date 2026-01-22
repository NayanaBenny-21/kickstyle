document.addEventListener("DOMContentLoaded", () => {

  // ================== ITEM ROW CLICK ==================
  document.querySelectorAll(".item-row").forEach(row => {
    row.addEventListener("click", e => {
      // Ignore clicks on buttons or links
      if (e.target.closest("button") || e.target.closest("a")) return;

      const itemId = row.dataset.itemId;
      const orderId = row.dataset.orderId;

      if (itemId && orderId) {
        window.location.href = `/orders/${orderId}/item/${itemId}`;
      }
    });
  });

  // ================== CANCEL ORDER / ITEM ==================
  document.addEventListener("click", e => {
    const orderBtn = e.target.closest(".cancel-order-btn");
    if (orderBtn) {
      e.preventDefault();
      showCancelAlert(orderBtn.dataset.orderId, "order");
      return;
    }

    const itemBtn = e.target.closest(".cancel-item-btn");
    if (itemBtn) {
      e.preventDefault();
      showCancelAlert(itemBtn.dataset.itemId, "item");
      return;
    }
  });

  // ================== RETRY PAYMENT ==================
  document.querySelectorAll(".retry-payment-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      e.stopPropagation(); // Prevent row click
      e.preventDefault();

      const orderId = btn.dataset.orderId;
      const shippingAddressId = btn.dataset.shippingId;

      if (!orderId || !shippingAddressId) {
        return Swal.fire("Error", "Cannot retry payment: missing order info", "error");
      }

      try {
        console.log("Retry payment clicked:", orderId, shippingAddressId);

        // Step 1: Call backend to create Razorpay order
        const res = await fetch("/razorpay/retry-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, shippingAddressId })
        });
        const data = await res.json();

        if (!data.success) {
          return Swal.fire("Error", data.message || "Unable to retry payment", "error");
        }

        // Step 2: Open Razorpay Checkout
        const options = {
          key: data.razorpayKey,
          amount: data.order.amount,
          currency: data.order.currency,
          order_id: data.order.id,
          name: "Kickstyle",
          prefill: {
            name: data.userDetails.name,
            email: data.userDetails.email,
            contact: data.userDetails.phone
          },
          handler: async response => {
            try {
              // Step 3: Verify payment on backend
              const verifyRes = await fetch("/razorpay/verify-retry-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  originalOrderId: orderId,
                  shippingAddressId
                })
              });
              const verifyData = await verifyRes.json();

              if (verifyData.success) {
                window.location.href = verifyData.redirect;
              } else {
                Swal.fire("Error", verifyData.message || "Payment verification failed", "error");
              }
            } catch (err) {
              console.error("Verify retry payment error:", err);
              Swal.fire("Error", "Payment verification failed", "error");
            }
          },
          theme: { color: "#3399cc" }
        };

        const rzp = new Razorpay(options);
        rzp.open();

      } catch (err) {
        console.error("Retry payment error:", err);
        Swal.fire("Error", "Something went wrong while retrying payment", "error");
      }
    });
  });

// Return entire order confirmation + reason
document.querySelectorAll('.return-order-btn').forEach(button => {
  button.addEventListener('click', async () => {
    const orderId = button.getAttribute('data-order-id');

    // Ask for reason
    const { value: reason } = await Swal.fire({
      title: 'Return Entire Order',
      input: 'textarea',
      inputLabel: 'Reason for return',
      inputPlaceholder: 'Type your reason here...',
      inputAttributes: {
        maxlength: 200
      },
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel'
    });

    if (reason && reason.trim()) {
      try {
        const res = await fetch(`/orders/${orderId}/return-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason })
        });

        const data = await res.json();
        if (data.success) {
          Swal.fire('Success!', 'Return request sent', 'success')
            .then(() => location.reload());
        } else {
          Swal.fire('Error!', data.message || 'Could not request return', 'error');
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error!', 'Something went wrong', 'error');
      }
    }
  });
});


}); // DOMContentLoaded end

// ================== SWEETALERT CANCEL ==================
function showCancelAlert(id, type) {
  const isOrder = type === "order";
  Swal.fire({
    title: isOrder ? "Cancel entire order?" : "Cancel this item?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes"
  }).then(result => {
    if (result.isConfirmed) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = isOrder ? `/orders/cancel-order/${id}` : `/orders/cancel-item/${id}`;
      document.body.appendChild(form);
      form.submit();
    }
  });
}
