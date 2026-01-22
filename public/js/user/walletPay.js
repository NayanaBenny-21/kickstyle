
  const walletPayBtn = document.getElementById("walletPayBtn");

  if (walletPayBtn) {
    walletPayBtn.addEventListener("click", async () => {

      const orderId = walletPayBtn.dataset.orderId;
      const amount = walletPayBtn.dataset.amount;

      walletPayBtn.disabled = true;
      walletPayBtn.innerText = "Processing...";

      try {
        const res = await fetch("/wallet/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, amount })
        });

        const data = await res.json();

        if (data.success) {
          window.location.href = "/order-success";
        } else {
          alert(data.message);
          walletPayBtn.disabled = false;
          walletPayBtn.innerText = "Pay Using Wallet";
        }

      } catch (err) {
        alert("Payment failed");
        walletPayBtn.disabled = false;
        walletPayBtn.innerText = "Pay Using Wallet";
      }
    });
  }

