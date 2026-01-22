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

  // Cancel item confirmation
// Cancel item confirmation
const cancelButtons = document.querySelectorAll(".cancel-item-btn");
console.log("Cancel buttons found:", cancelButtons.length);

cancelButtons.forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    const url = btn.href;

    Swal.fire({
      title: "Cancel Item?",
      text: "Do you really want to cancel this item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#9ea3a6ff",
      confirmButtonText: "Yes",
      cancelButtonText: "No"
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(url, { method: "POST" })
          .then(response => response.json())
          .then(data => {
            if (!data.success && data.blocked) {
              Swal.fire("Cannot Cancel", data.message, "error");
            } else if (data.success) {
              Swal.fire("Cancelled!", data.message, "success")
                .then(() => location.reload());
            } else {
              Swal.fire("Error!", data.message || "Could not cancel", "error");
            }
          })
          .catch(() => Swal.fire("Error!", "Something went wrong", "error"));
      }
    });
  });
});

  document.querySelectorAll('.return-item-btn').forEach(button => {
  button.addEventListener('click', async () => {
    const itemId = button.getAttribute('data-id');

    // Ask for reason
    const { value: reason } = await Swal.fire({
      title: 'Return Item',
      input: 'textarea',
      inputLabel: 'Reason for return',
      inputPlaceholder: 'Type your reason here...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel'
    });

    if (reason) {
      try {
        const res = await fetch(`/return-order/${itemId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        });

        const data = await res.json();
        if (data.success) {
          Swal.fire('Success!', data.message, 'success').then(() => location.reload());
        } else {
          Swal.fire('Error!', data.message, 'error');
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error!', 'Something went wrong', 'error');
      }
    }
  });
});
});
