document.querySelectorAll('.toggle-status').forEach(toggle => {
  toggle.addEventListener('change', async function (e) {
    if (e.target.classList.contains('toggle-status')) {
      const row = e.target.closest('tr');
      const userId = row.dataset.id;
      const isChecked = e.target.checked;
      const isBlocked = !isChecked;
      const action = isBlocked ? 'block' : 'unblock';

      const confirm = await Swal.fire({
        title: `Are you sure you want to ${action} this user?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: isBlocked ? '#d33' : '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: `Yes, ${action}`
      });

      if (!confirm.isConfirmed) {
        e.target.checked = !isChecked;
        return;
      }
      try {
        const res = await fetch(`/admin/users/${userId}/block`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isBlocked }) });
        const data = await res.json();

        if (data.success) {

          const statusBadge = row.querySelector('.status-badge');
          if (data.isBlocked) {
            statusBadge.textContent = 'Blocked';
            statusBadge.classList.remove('active');
            statusBadge.classList.add('blocked');
          } else {
            statusBadge.textContent = 'Active';
            statusBadge.classList.remove('blocked');
            statusBadge.classList.add('active');
          }
          Swal.fire('Success', data.message, 'success');
        } else {
          Swal.fire('Error', data.message, 'error');
          e.target.checked = !isChecked;
        }


      } catch (err) {
        Swal.fire('Error', 'Something went wrong', 'error');
        e.target.checked = !isChecked;
      }
    } else {
      // Cancelled 
      e.target.checked = !isChecked;
    }

  })
})



