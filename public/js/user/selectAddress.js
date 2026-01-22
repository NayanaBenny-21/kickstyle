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

document.getElementById('nextBtn').addEventListener('click', () => {
  const selected = document.querySelector('input[name="selectedAddress"]:checked');
  if (!selected) return alert('Please select an address');
console.log('Next button clicked, selected address:', selected?.value);

  fetch('/cart/select-address', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addressId: selected.value })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) { 
      console.log('Response from /cart/select-address:', data);

      window.location.href = '/checkout';
    } else {
      alert('Failed to select address.');
    }
  });
});

});

