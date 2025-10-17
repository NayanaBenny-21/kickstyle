//FILTER MODAL
document.getElementById('filterBtn').addEventListener('click', () => {
    const filterModal = new bootstrap.Modal(document.getElementById('filterModal'));
    filterModal.show();
});

// TOGGLE STATUS
document.querySelectorAll('.toggle-status').forEach(toggle => {
    toggle.addEventListener('change', async function (e) {
        const row = e.target.closest('tr');
        const categoryId = row.dataset.id;
        const isChecked = e.target.checked;
        const isActive = isChecked;

        const action = isActive ? 'activate' : 'block';
        const confirmResult = await Swal.fire({
            title: `Are you sure you want to ${action} this category?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isActive ? '#28a745' : '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${action}`
        });

        if (!confirmResult.isConfirmed) {
            e.target.checked = !isChecked;
            return;
        }

        try {
            const res = await fetch(`/admin/categories/${categoryId}/toggle-status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            });
            const data = await res.json();

            if (data.success) {
                const statusBadge = row.querySelector('.status-badge');
                if (data.isActive) {
                    statusBadge.textContent = 'Active';
                    statusBadge.classList.remove('blocked');
                    statusBadge.classList.add('active');
                } else {
                    statusBadge.textContent = 'Blocked';
                    statusBadge.classList.remove('active');
                    statusBadge.classList.add('blocked');
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
    });
});

// SOFT DELETE
document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async function () {
        const categoryId = this.dataset.id;

        const confirmDelete = await Swal.fire({
            title: 'Are you sure you want to delete this category?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes'
        });

        if (!confirmDelete.isConfirmed) return;

        try {
            const res = await fetch(`/admin/categories/${categoryId}/delete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            if (data.success) {
                Swal.fire('Deleted', data.message, 'success');
                this.closest('tr').remove();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Something went wrong', 'error');
        }
    });
});

document.querySelectorAll('.edit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const categoryId = btn.dataset.id;
    if (!categoryId) {
      alert("Invalid category ID");
      return;
    }
    window.location.href = `/admin/categories/edit/${categoryId}`;
  });
});