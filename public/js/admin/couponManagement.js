document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
        TOGGLE STATUS
    ====================================== */
    document.querySelectorAll(".toggle-status").forEach(toggle => {
        toggle.addEventListener("change", async () => {

            const couponId = toggle.dataset.id;
            const newStatus = toggle.checked;

            try {
                const res = await fetch(`/admin/coupon/${couponId}/toggle`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isActive: newStatus })
                });

                const data = await res.json();

                if (data.success) {
                    const row = toggle.closest("tr");
                    const statusChip = row.querySelector(".status-chip");

                    statusChip.textContent = newStatus ? "Active" : "Blocked";
                    statusChip.classList.toggle("active", newStatus);
                    statusChip.classList.toggle("blocked", !newStatus);

                } else {
                    alert(data.message || "Failed to update status");
                    toggle.checked = !newStatus;
                }

            } catch (error) {
                console.error("Toggle status error:", error);
                toggle.checked = !newStatus;
            }

        });
    });



    /* =====================================
        DELETE COUPON
    ====================================== */
    document.querySelectorAll(".delete-btn").forEach(button => {

        button.addEventListener("click", async function () {

            const couponId = this.dataset.id;

            const confirmDelete = await Swal.fire({
                title: 'Are you sure you want to delete this coupon?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes'
            });

            if (!confirmDelete.isConfirmed) return;

            try {
                const res = await fetch(`/admin/coupon/${couponId}/delete`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" }
                });

                const data = await res.json();

                if (data.success) {
                    Swal.fire('Deleted', data.message, 'success');
                const row = this.closest("tr");
                if (row) row.remove();
            } 
            else {
                Swal.fire('Error', data.message, 'error');
            }

            } catch (error) {
                Swal.fire('Error', 'Something went wrong', 'error');
                console.error("Delete error:", error);
            }

        });

    });

    //EDIT BUTTON
    
document.querySelectorAll('.edit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    
    const couponId = btn.dataset.id;
    if (!couponId) {
      alert("Invalid coupon ID");
      return;
    }
    window.location.href = `/admin/coupon/edit/${couponId}`;
  });
});



});
