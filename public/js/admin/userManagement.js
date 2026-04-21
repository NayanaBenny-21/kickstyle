document.querySelectorAll('.toggle-status').forEach(toggle => {

  // Add change event to each toggle switch
  toggle.addEventListener('change', async function (e) {

    // Ensure the event is coming from the correct toggle element
    if (e.target.classList.contains('toggle-status')) {

      const row = e.target.closest('tr'); // Get the row of the clicked toggle
      const userId = row.dataset.id;      // Get user ID from row data attribute

      const isChecked = e.target.checked; // Current toggle state (ON/OFF)
      const isBlocked = !isChecked;       // If toggle is OFF → user is blocked
      const action = isBlocked ? 'block' : 'unblock'; // Decide action text

      // Show confirmation popup before making any change
      const confirm = await Swal.fire({
        title: `Are you sure you want to ${action} this user?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: isBlocked ? '#d33' : '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: `Yes, ${action}`
      });

      // If user cancels → revert toggle back to previous state
      if (!confirm.isConfirmed) {
        e.target.checked = !isChecked;
        return;
      }

      try {
        // Send request to backend to update block/unblock status
        const res = await fetch(`/admin/users/${userId}/block`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isBlocked })
        });

        const data = await res.json();

        if (data.success) {

          // Update UI badge based on new status
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

          // Show success message
          Swal.fire('Success', data.message, 'success');

        } else {
          // If backend fails → revert toggle
          Swal.fire('Error', data.message, 'error');
          e.target.checked = !isChecked;
        }

      } catch (err) {
        // If network/server error → revert toggle
        Swal.fire('Error', 'Something went wrong', 'error');
        e.target.checked = !isChecked;
      }

    } else {
      // Safety fallback (should rarely happen)
      e.target.checked = !isChecked;
    }

  });

  // -------------------- SEARCH RESET --------------------

  const searchInput = document.querySelector("input[name='search']");

  // If search box is cleared → reload full user list
  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim() === "") {
      window.location.href = "/admin/user-management";
    }
  });

});