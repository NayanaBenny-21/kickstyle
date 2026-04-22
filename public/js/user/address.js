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
            const res = await fetch(`/address/delete/${addressId}`, {
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
})