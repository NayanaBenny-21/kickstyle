document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll(".toggle-offer");

  toggles.forEach(toggle => {
    toggle.addEventListener("change", async () => {
      const offerId = toggle.dataset.id;
      const isActive = toggle.checked;

      try {
        const res = await fetch(`/admin/offers/toggle-status/${offerId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ isActive })
        });

        const data = await res.json();

        if (!data.success) {
          alert("Failed to update status");
          toggle.checked = !isActive; // rollback
        } else {
          // reload to update badge (Active / Blocked / Expired)
          location.reload();
        }

      } catch (err) {
        console.error(err);
        alert("Something went wrong");
        toggle.checked = !isActive;
      }
    });
  });
document.querySelectorAll('.delete-offer').forEach(btn => {
  btn.addEventListener('click', async () => {
    const offerId = btn.dataset.id;

    // SweetAlert confirmation
    const result = await Swal.fire({
                title: 'Are you sure you want to delete this offer?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/admin/offers/delete/${offerId}`, {
          method: 'DELETE',
        });
        const data = await res.json();

        if (data.success) {
          btn.closest('tr').remove(); // remove row from table
          Swal.fire(
            'Deleted!',
            'The offer has been deleted.',
            'success'
          );
        } else {
          Swal.fire(
            'Error!',
            data.message || 'Something went wrong.',
            'error'
          );
        }
      } catch (err) {
        console.error(err);
        Swal.fire(
          'Error!',
          'Something went wrong.',
          'error'
        );
      }
    }
  });
});
});
