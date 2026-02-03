document.addEventListener("DOMContentLoaded", () => {
   console.log("OrderDetails JS loaded");
  const ratingBoxes = document.querySelectorAll(".rating-stars");

  ratingBoxes.forEach(box => {
    const stars = box.querySelectorAll(".star");
    const itemId = box.dataset.itemId;
    let selected = parseInt(box.dataset.rating) || 0;

    // Show saved rating on load
    stars.forEach(s => {
      const val = parseInt(s.dataset.value);
      if (val <= selected) s.classList.add("selected");
    });

    stars.forEach(star => {
      const val = parseInt(star.dataset.value);

      // Hover effect
      star.addEventListener("mouseover", () => {
        stars.forEach(s => {
          if (parseInt(s.dataset.value) <= val) {
            s.classList.add("hover");
          } else {
            s.classList.remove("hover");
          }
        });
      });

      box.addEventListener("mouseleave", () => {
        stars.forEach(s => s.classList.remove("hover"));
      });

      // Click to select rating
      star.addEventListener("click", async () => {
        selected = val;

        stars.forEach(s => {
          if (parseInt(s.dataset.value) <= selected) {
            s.classList.add("selected");
          } else {
            s.classList.remove("selected");
          }
        });

        try {
          const res = await fetch("/rate-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId, rating: selected })
          });

          const data = await res.json();

          if (data.success) {
            Swal.fire("Thanks!", "Your rating is saved!", "success");
          } else {
            Swal.fire("Error!", data.message || "Could not save rating", "error");
          }

        } catch (err) {
          console.error("Error saving rating:", err);
        }
      });
    });
  });


  // ---------------- CANCEL BUTTON ----------------
  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", async e => {
      e.preventDefault();

      const type = btn.dataset.type; // "order" or "item"
      const id = btn.dataset.id || btn.getAttribute("href").split("/").pop();

      Swal.fire({
        title: type === "order" ? "Cancel entire order?" : "Cancel this item?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes",
        cancelButtonText: "No"
      }).then(async result => {
        if (result.isConfirmed) {
          const url = type === "order"
            ? `/orders/cancel-order/${id}`
            : `/orders/cancel-item/${id}`;

          try {
            const res = await fetch(url, { method: "POST" });
            if (!res.ok) throw new Error(await res.text());

            const data = await res.json();
            if (data.success) {
              Swal.fire("Cancelled!", data.message, "success").then(() =>
                location.reload()
              );
            } else {
              Swal.fire("Error!", data.message || "Could not cancel", "error");
            }
          } catch (err) {
            console.error("Cancel error:", err);
            Swal.fire("Error!", "Something went wrong", "error");
          }
        }
      });
    });
  });

  // ---------------- RETURN BUTTON ----------------
  document.querySelectorAll(".return-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const isSingleItemOrder = btn.dataset.type === "order"; // true if returning entire order

      const { value: reason } = await Swal.fire({
        title: isSingleItemOrder ? "Return entire order?" : "Return item?",
        input: "textarea",
        inputLabel: "Reason for return",
        inputPlaceholder: "Type your reason here...",
        showCancelButton: true,
        confirmButtonText: "Submit",
        cancelButtonText: "Cancel"
      });

      if (!reason) return;

      const url = isSingleItemOrder
        ? `/orders/${id}/return-order`
        : `/orders/return-item/${id}`;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason })
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Return request failed:", text);
          return Swal.fire("Error!", "Return request failed", "error");
        }

        const data = await res.json();
        if (data.success) {
          Swal.fire("Success!", data.message, "success").then(() =>
            location.reload()
          );
        } else {
          Swal.fire("Error!", data.message, "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error!", "Something went wrong", "error");
      }
    });
  });
});
