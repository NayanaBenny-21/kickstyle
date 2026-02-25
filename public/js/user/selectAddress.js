document.addEventListener('DOMContentLoaded', () => {

  document.addEventListener('click', async(e) => {
    if (e.target.classList.contains("delete-address")) {
      const addressId = e.target.dataset.id;

      Swal.fire({
        title: "Delete",
        text: "This address will be permanently deleted.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Delete ",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const res = await fetch(`/cart/select-address/delete/${addressId}`, {
              method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
              Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: data.message || "Address deleted successfully.",
                timer: 1500,
                showConfirmButton: false,
              }).then(() => location.reload());
            } else {
              Swal.fire("Error", data.message || "Failed to delete address.", "error");
            }
          } catch (err) {
            Swal.fire("Error", "Something went wrong.", "error");
          }
        }
      });
    }
});

document.querySelectorAll('.address-list .card').forEach(card => {
  const radio = card.querySelector('input[type="radio"]');
  if(radio.checked) card.classList.add('selected-card');

  card.addEventListener('click', (e) => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
 document.querySelectorAll(".address-list .card").forEach( c => c.classList.remove('selected-card'));
 radio.checked = true;
 card.classList.add('selected-card');
  });

  radio.addEventListener('change', ()=> {
    document.querySelectorAll('.address-list .card').forEach(c => c.classList.remove('selected-card'));
    radio.checked = true;
    card.classList.add('selected-card');
  })
})

document.getElementById('nextBtn').addEventListener('click', async () => {
  const selected = document.querySelector('input[name="selectedAddress"]:checked');
  if (!selected) {
    return Swal.fire({
      icon: 'warning',
      title: 'Oops...',
      text: 'Please select a delivery address'
    });
  }

  try {
    const res = await fetch('/cart/select-address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressId: selected.value })
    });

    const data = await res.json();
    console.log('Response from /cart/select-address:', data);

 

    // ----- UNLISTED PRODUCTS -----
    if (data.unlisted && data.items?.length > 0) {
      const msg = data.items
        .map(i => `${i.productName} is no longer available`)
        .join('<br>');
      return Swal.fire({
        icon: 'error',
        title: 'Product Unavailable',
        html: msg,
        allowOutsideClick: false
      }).then(() => {
        window.location.href = '/cart';
      });
    }

    // ----- STOCK ISSUES -----
    if (data.stockIssue && data.items?.length > 0) {
      const msg = data.items
        .map(i => i.available === 0 
          ? `${i.productName} is Out of Stock` 
          : `${i.productName}: only ${i.available} left (Reserved: ${i.reserved || 0})`)
        .join("<br>");
      return Swal.fire({
        icon: 'warning',
        title: 'Stock Alert',
        html: msg
      }).then(() => {
      
        window.location.href = '/cart';
      });
    }

      // ----- SUCCESS -----
      if (data.success) {
        window.location.href = "/checkout";
      } else {
        Swal.fire("Error", data.message || "Failed to select address.", "error");
      }

  } catch (err) {
    console.error('Error selecting address:', err);
    Swal.fire('Error', 'Something went wrong. Try again.', 'error');
  }
});
});

