document.addEventListener("DOMContentLoaded", async () => {

    const wishlistBtn = document.querySelectorAll(".wishlist-btn");
    let wishlist = [];

    // ==============================
    // LOAD WISHLIST ITEMS
    // ==============================
    try {
        const res = await fetch('/wishlist/all');
        const data = await res.json();
        if (data.success) wishlist = data.wishlist.map(id => String(id));
    } catch (error) {
        console.error("Wishlist load error:", error);
    }

    // ==============================
    // HIGHLIGHT ICONS ALREADY IN WISHLIST
    // ==============================
    wishlistBtn.forEach(btn => {
        const id = String(btn.getAttribute("data-product-id"));
        const icon = btn.querySelector("i");

        if (wishlist.includes(id)) {
            icon.classList.remove("fa-regular");
            icon.classList.add("fa-solid", "text-danger");
        }
    });

    // ==============================
    // TOGGLE WISHLIST
    // ==============================
    wishlistBtn.forEach(btn => {
        btn.addEventListener("click", async function (e) {
            e.preventDefault();
            e.stopPropagation();

            const productId = this.getAttribute("data-product-id");
            const icon = this.querySelector("i");

            try {
                const res = await fetch(`/wishlist/toggle/${productId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });

                const data = await res.json();

                if (data.loginRequired) {
                    return window.location.href = "/login";
                }

                if (data.success) {
                    if (data.action === "added") {
                        icon.classList.remove("fa-regular");
                        icon.classList.add("fa-solid", "text-danger");

                        wishlist.push(String(productId));
                    }

                    if (data.action === "removed") {
                        icon.classList.remove("fa-solid", "text-danger");
                        icon.classList.add("fa-regular");

                        wishlist = wishlist.filter(id => id !== String(productId));
                    }
                }

            } catch (err) {
                console.error("Wishlist toggle error:", err);
            }
        });
    });

    // ==============================
    // REMOVE FROM WISHLIST PAGE
    // ==============================
    document.querySelectorAll(".remove-wishlist-btn").forEach(btn => {
        btn.addEventListener("click", async function () {
            const productId = this.getAttribute("data-product-id");

            try {
                const res = await fetch(`/wishlist/remove/${productId}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" }
                });

                const data = await res.json();

                if (data.success) {
                    const row = this.closest(".wishlist-item");
                    if (row) row.remove();
                }

            } catch (err) {
                console.error("Wishlist Remove Error:", err);
            }
        });
    });

});
