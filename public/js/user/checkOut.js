document.addEventListener("DOMContentLoaded", () => {

  /* ================= DOM ELEMENTS ================= */
  const couponInput = document.getElementById("couponCode");
  const couponRow = document.getElementById("couponRow");
  const discountValue = document.getElementById("discountValue");
  const totalEl = document.getElementById("finalTotal");
  const couponActionRow = document.getElementById("couponActionRow");
  const couponError = document.getElementById("couponError");
  const couponWarning = document.getElementById("couponWarning");
  const removeCouponBtn = document.getElementById("removeCouponBtn");
  const orderBtn = document.getElementById("orderBtn");

  const couponModal = new bootstrap.Modal(document.getElementById("couponModal"));
  const couponModalList = document.getElementById("couponModalList");
  const noCouponsText = document.getElementById("noCouponsText");
const cartItems = document.querySelectorAll(".cart-item");


    if (window.couponSession && window.couponSession.code) {
    couponInput.value = window.couponSession.code;
    discountValue.textContent = `-₹${window.couponSession.discount}`;
    couponRow.classList.remove("d-none");
    couponActionRow.classList.remove("d-none");
  removeCouponBtn.classList.remove("d-none"); 

    // Recalculate total just in case
    totalEl.textContent = `₹${Number(totalEl.dataset.base || 0) + Number(totalEl.dataset.delivery || 0) + Number(totalEl.dataset.platform || 0) - Number(window.couponSession.discount)}`;
  checkItemMinOrderAmount();
  }

  /* ================= CALCULATE FINAL AMOUNT ================= */
  function calculateFinalAmount() {
    const subtotal = Number(totalEl.dataset.base || 0);
    const delivery = Number(totalEl.dataset.delivery || 0);
    const platform = Number(totalEl.dataset.platform || 0);
    const discount = Number(window.couponSession.discount || 0);

    // Use Math.round to avoid tiny decimals
    return Math.round(subtotal - discount + delivery + platform);
  }

  /* ================= OPEN COUPON MODAL ================= */
  document.getElementById("openCouponModal").addEventListener("click", async () => {
    couponModalList.innerHTML = "";
    noCouponsText.classList.add("d-none");

    try {
      const res = await fetch("/checkout/available-coupons");
      const data = await res.json();

      if (!data.success || !data.coupons.length) {
        noCouponsText.classList.remove("d-none");
        couponModal.show();
        return;
      }

      data.coupons.forEach(coupon => {
        const discountText = coupon.discountType === "percentage"
          ? `${coupon.discountValue}%`
          : `₹${coupon.discountValue}`;

        couponModalList.innerHTML += `
          <div class="col-md-6">
            <div class="border rounded-3 p-3 h-100">
              <div class="fw-bold text-danger">${coupon.couponCode}</div>
              <div class="fw-semibold">Flat ${discountText} OFF</div>
              <small class="text-muted">Min order ₹${coupon.minOrderAmount}</small>
              <button class="btn btn-sm btn-danger w-100 mt-2 apply-coupon-btn"
                data-code="${coupon.couponCode}">
                Apply
              </button>
            </div>
          </div>
        `;
      });

      couponModal.show();

    } catch (err) {
      noCouponsText.textContent = "Failed to load coupons";
      noCouponsText.classList.remove("d-none");
      couponModal.show();
      console.error(err);
    }
  });

/* ================= SHOW WARNING IF ITEM < MIN ORDER ================= */
function checkItemMinOrderAmount() {
  const coupon = window.couponSession;
  if (!coupon || !coupon.code) {
    couponRow.classList.add("d-none");
    couponActionRow.classList.add("d-none");
    removeCouponBtn.classList.add("d-none");
    couponWarning.style.display = "none";
    discountValue.textContent = "-₹0";
    return;
  }

  const minOrder = Number(coupon.minOrderAmount || 0);
  const discount = Number(coupon.discount || 0);

 let hasLowItem = false;

cartItems.forEach(item => {
  const price = Number(item.dataset.price || 0);
  const quantity = Number(item.dataset.quantity || 0);
  const itemTotal = price * quantity;

  console.log("ITEM TOTAL:", itemTotal, "MIN ORDER:", minOrder, "LOW?", hasLowItem);


  // If ANY item does not meet coupon minimum
  if (itemTotal < minOrder) {
    hasLowItem = true;
  }
});

// Always show UI rows
couponRow.classList.remove("d-none");
couponActionRow.classList.remove("d-none");
removeCouponBtn.classList.remove("d-none");

// Show/hide warning
if (hasLowItem) {
  couponWarning.classList.remove("d-none");
} else {
  couponWarning.classList.add("d-none");
}

}

  /* ================= APPLY COUPON ================= */
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("apply-coupon-btn")) return;

    const couponCode = e.target.dataset.code;
    couponError.classList.add("d-none");

    try {
      const res = await fetch("/checkout/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode })
      });

      const data = await res.json();
      if (!data.success) {
        Swal.fire("Invalid Coupon", data.message, "error");
        return;
      }

      // Store discount from backend
      window.couponSession = {
        couponId: data.couponId,
        discount: data.discount,
         code: couponCode,
        minOrderAmount: data.minOrderAmount  
      };
console.log("DEBUG Applied coupon minOrderAmount:", window.couponSession.minOrderAmount);
checkItemMinOrderAmount();
      // Update UI
      couponInput.value = couponCode;
      discountValue.textContent = `-₹${data.discount}`;
      totalEl.textContent = `₹${calculateFinalAmount()}`;
      couponRow.classList.remove("d-none");
      couponActionRow.classList.remove("d-none");
      removeCouponBtn.classList.remove("d-none");

      couponModal.hide();
checkItemMinOrderAmount();
      Swal.fire({
        icon: "success",
        title: "Coupon Applied",
        timer: 1200,
        showConfirmButton: false
      });

    } catch (err) {
      console.error("Coupon apply error:", err);
      Swal.fire("Error", "Failed to apply coupon", "error");
    }
  });

  /* ================= REMOVE COUPON ================= */
  removeCouponBtn.addEventListener("click", () => {
    window.couponSession = {};
    couponInput.value = "";
    discountValue.textContent = "-₹0";
    totalEl.textContent = `₹${calculateFinalAmount()}`;
    couponRow.classList.add("d-none");
    couponActionRow.classList.add("d-none");
    couponWarning.classList.add("d-none");

    Swal.fire({
      icon: "info",
      title: "Coupon Removed",
      timer: 1000,
      showConfirmButton: false
    });
  });



/* ================= PLACE ORDER ================= */
orderBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const paymentMethod = document.querySelector("input[name='paymentMethod']:checked")?.value;
  const shippingAddressId = document.body.dataset.selectedAddress;
  const finalAmount = calculateFinalAmount();

  if (!paymentMethod) return Swal.fire("Error", "Select a payment method", "error");
  if (!shippingAddressId) return Swal.fire("Error", "No shipping address selected", "error");

  /* ---------- COD ---------- */
  if (paymentMethod === "cod") {
    const res = await fetch("/checkout/place-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod: "cod",
        shippingAddressId,
        couponId: window.couponSession?.couponId || null,
        discount: window.couponSession?.discount || 0,
        transactionId: null
      })
    });
    const data = await res.json();
    if (!data.success) return Swal.fire("Error", data.message, "error");
    window.location.href = `/order-success/${data.orderId}`;
    return;
  }

  /* ---------- WALLET ---------- */
/* ---------- WALLET ---------- */
if (paymentMethod === "wallet") {
  const finalAmount = calculateFinalAmount();

  // 1️⃣ Check wallet balance
  const balanceRes = await fetch("/wallet/check-balance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: finalAmount })
  });

  const balanceData = await balanceRes.json();
  if (!balanceData.success || !balanceData.canUseWallet) {
    return Swal.fire(
      "Insufficient Wallet Balance",
      "Please choose another payment method.",
      "error"
    );
  }

  // 2️⃣ Create wallet order (backend will deduct wallet, decrease stock, create order)
  const placeOrderRes = await fetch("/checkout/wallet-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shippingAddressId })
  });

  const placeOrderData = await placeOrderRes.json();
  if (!placeOrderData.success) {
    return Swal.fire("Error", placeOrderData.message, "error");
  }

  // 3️⃣ Success Swal + redirect
  Swal.fire({
    icon: "success",
    title: "Wallet Payment Successful!",
    text: "Your order has been placed.",
    timer: 2000,
    showConfirmButton: false
  }).then(() => {
    window.location.href = "/orders";
  });

  return;
}


  /* ---------- RAZORPAY ---------- */
if (paymentMethod === "razorpay") {
  const finalAmount = calculateFinalAmount(); 
    console.log("🟢 [DEBUG] Final amount before Razorpay (INR):", finalAmount);
  const razorRes = await fetch("/razorpay/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: finalAmount * 100 }) 
  });

  const razorData = await razorRes.json();
    console.log("🟢 [DEBUG] Razorpay create-order response:", razorData);

  if (!razorData.success) return Swal.fire("Error", "Failed to create Razorpay order", "error");
async function handleFail() {
  await fetch("/razorpay/payment-failed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shippingAddressId,
      totalAmount: calculateFinalAmount(), 
      couponId: window.couponSession?.couponId || null,
      transactionId: "FAILED-" + Date.now(),
    }),
  });

  Swal.fire("Payment Failed", "Your payment did not complete").then(() => {
    window.location.href = "/orders";
  });
}



  const options = {
    key: window.razorpayKey,
    amount: razorData.order.amount, // this is in paise
    currency: razorData.order.currency,
    order_id: razorData.order.id,
    name: "Your Store",
    description: "Order Payment",
    prefill: {
      name: window.userName,
      email: window.userEmail,
      contact: window.userPhone
    },
 handler: async function (response) {
    try {
      const verifyRes = await fetch("/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          shippingAddressId,
          couponId: window.couponSession?.couponId || null,
          discount: window.couponSession?.discount || 0,
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        window.location.href = verifyData.redirect;
      } else {
        handleFail(); 
      }
    } catch (err) {
      console.error("Verification error:", err);
      handleFail();
    }
  },

    modal: { ondismiss: handleFail }
  };
console.log("[DEBUG] Razorpay Options:", options);

  const rzp = new Razorpay(options);
  rzp.on("payment.failed", handleFail);
  rzp.open();
}
});

});