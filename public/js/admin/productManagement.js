//TOGGLE STATUS
document.querySelectorAll('.toggle-status').forEach(toggle => {
    toggle.addEventListener('change', async function (e) {
        if (e.target.classList.contains('toggle-status')) {
            const row = e.target.closest('tr');
            const productId = row.dataset.id;
            const isChecked = e.target.checked;
            const isActive = isChecked;
            const action = isActive ? 'list' : 'unlist';

            const confirm = await Swal.fire({
                title: `Are you sure you want to ${action} this product?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: isActive ? '#28a745' : '#d33',
                cancelButtonColor: '#6c757d',
                confirmButtonText: `Yes, ${action}`
            });

            if (!confirm.isConfirmed) {
                e.target.checked = !isChecked;
                return;
            }
            try {
                const res = await fetch(`/admin/products/${productId}/toggle-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) });
                const data = await res.json();

                if (data.success) {

                    const statusBadge = row.querySelector('.status-badge');
                    if (data.isActive) {
                        statusBadge.textContent = 'Listed';
                        statusBadge.classList.remove('unlist');
                        statusBadge.classList.add('list');
                    } else {
                        statusBadge.textContent = 'Unlisted';
                        statusBadge.classList.remove('list');
                        statusBadge.classList.add('unlist');
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
        }
    })
});

//FILTER MODAL
document.getElementById('filterBtn').addEventListener('click', () => {
    const filterModal = new bootstrap.Modal(document.getElementById('filterModal'));
    filterModal.show();
});

//DELETE

document.querySelectorAll('.delete-btn').forEach( button => {
    button.addEventListener('click', async function (e) {
        const productId = this.dataset.id;

        const confirmDelete = await Swal.fire({
            title: 'Are you sure you want to delete this product?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes'
        });
        
        if(!confirmDelete.isConfirmed) return;

        try {
            const res =await fetch(`/admin/products/${productId}/delete`, { 
                method : 'PATCH',
            headers: {'Content-Type' : 'application/json'}});
            const data = await res.json();

            if(data.success) {
                Swal.fire('Deleted', data.message, 'success');
                 this.closest('tr').remove();
            }else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Something went wrong', 'error');
        }

    })
});

document.querySelectorAll('.edit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const productId = btn.dataset.id;
    if (!productId) {
      alert("Invalid product ID");
      return;
    }
    window.location.href = `/admin/products/edit/${productId}`;
  });
});

