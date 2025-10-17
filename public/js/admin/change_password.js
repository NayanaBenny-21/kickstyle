document.addEventListener("DOMContentLoaded", () => {
    if (window.resetSuccess) {
        Swal.fire({
            icon: "success",
            text: "Password reset successfully!",
            toast: true,
            position: "bottom",
            timer: 2500,
            showConfirmButton: false
        }).then(() => {
            window.location.href = "/adminAuth/login";
        });
    }
});
