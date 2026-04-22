let selectedColor = null;
let selectedSize = null;
let selectedVariantId = null;
let stockForSelectedVariant = 0;
let quantityInput = null;
let curretCartQtyMap;

function updateSizesForColor(color) {
  const allButtons = document.querySelectorAll(".size-btn");

  allButtons.forEach((btn) => {
    if (btn.dataset.color === color) {
      btn.style.display = "inline-block";
    } else {
      btn.style.display = "none";
    }
  });

  // reset selection
  selectedSize = null;
  selectedVariantId = null;
  stockForSelectedVariant = 0;
  quantityInput.value = 1;
  quantityInput.disabled = true;

  // auto-select first available size
  const firstAvl = Array.from(allButtons).find(
    (btn) => btn.dataset.color === color && !btn.disabled
  );

  if (firstAvl) {
    firstAvl.click();
  }
}

function showStockForColor(color) {
  document.querySelectorAll(".stock-msg").forEach((msg) => {
    if (msg.dataset.color === color) {
      msg.style.display = "block";
    } else {
      msg.style.display = "none";
    }
  });
}

function changeMainImage(src) {
  document.getElementById("mainProductImage").src = src;
}

function selectColor(color, imgSrc) {
  selectedColor = color;
  changeMainImage(imgSrc);

  // highlight selected color
  document
    .querySelectorAll(".color-thumb")
    .forEach((img) => img.classList.remove("border-dark", "selected"));

  const clicked = document.querySelector(`[data-color="${color}"]`);
  if (clicked) clicked.classList.add("border-dark", "selected");

  updateSizesForColor(color);
  showStockForColor(color);
}

function updateQtyBtn() {
  if (!selectedColor || !selectedSize) {
    quantityInput.disabled = true;
    quantityInput.value = 1;
  } else {
    quantityInput.disabled = false;
    quantityInput.max = Math.min(stockForSelectedVariant, 5);

    if (!quantityInput.value || quantityInput.value < 1) {
      quantityInput.value = 1;
    }

    if (quantityInput.value > quantityInput.max) {
      quantityInput.value = quantityInput.max;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const sizeBtns = document.querySelectorAll(".size-btn");
  const addToCartBtn = document.querySelector(".addToCartBtn");
  quantityInput = document.getElementById("quantity");
  const colorThumbs = document.querySelectorAll(".color-thumb");
  const buyNowBtn = document.getElementById("buyNowBtn");

  // -------------------- FETCH CART COUNT --------------------
  async function fetchCartCount() {
    const cartBadge = document.getElementById("cartCount");
    if (!cartBadge) return;

    try {
      const res = await fetch("/get-cart-count", {
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        cartBadge.innerText = data.count;

        if (data.count > 0) {
          cartBadge.classList.remove("d-none");
        } else {
          cartBadge.classList.add("d-none");
        }
      }
    } catch (err) {
      console.error("Failed to fetch cart count:", err);
    }
  }

  fetchCartCount();

  // -------------------- QUANTITY --------------------
  quantityInput.min = 1;

  quantityInput.addEventListener("input", () => {
    let val = parseInt(quantityInput.value) || 1;
    const maxQty = Math.min(stockForSelectedVariant, 5);

    if (val < 1) val = 1;
    if (val > maxQty) val = maxQty;

    quantityInput.value = val;
  });

  // hide all sizes initially
  document
    .querySelectorAll(".size-btn")
    .forEach((btn) => (btn.style.display = "none"));

  // auto-select first color
  if (colorThumbs.length > 0) {
    const first = colorThumbs[0];
    selectColor(first.dataset.color, first.getAttribute("src"));
  }

  // -------------------- COLOR CLICK --------------------
  colorThumbs.forEach((img) => {
    img.addEventListener("click", () => {
      selectColor(img.dataset.color, img.getAttribute("src"));
    });
  });

  // -------------------- SIZE SELECTION --------------------
  sizeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;

      const alreadySelected = btn.classList.contains("selected");

      sizeBtns.forEach((b) => b.classList.remove("btn-dark", "selected"));

      if (alreadySelected) {
        selectedSize = null;
        selectedVariantId = null;
        stockForSelectedVariant = 0;
      } else {
        btn.classList.add("btn-dark", "selected");
        selectedSize = btn.dataset.size;
        selectedVariantId = btn.dataset.variantId;
        stockForSelectedVariant = parseInt(btn.dataset.stock) || 0;
      }

      updateQtyBtn();

      document
        .querySelectorAll(".stock-msg")
        .forEach((msg) => (msg.style.display = "none"));

      const stockMsg = btn.nextElementSibling;
      if (stockMsg && stockMsg.classList.contains("stock-msg")) {
        stockMsg.style.display = "block";
      }
    });
  });

  // -------------------- ADD TO CART --------------------
  addToCartBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const productId = addToCartBtn.dataset.productId;
    const quantity = parseInt(quantityInput.value) || 1;

    if (!selectedColor || !selectedSize) {
      return Swal.fire({
        icon: "warning",
        text: "Please select color and size before adding to cart.",
        toast: true,
        position: "bottom",
        timer: 2500,
        showConfirmButton: false,
      });
    }

    try {
      const res = await fetch("/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          variantId: selectedVariantId,
          quantity,
        }),
        credentials: "include",
      });

      if (res.status === 401) {
        return Swal.fire({
          icon: "warning",
          title: "Login Required",
          text: "Please login to continue purchase.",
          showCancelButton: true,
          confirmButtonText: "Login",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#aaa",
        }).then((result) => {
          if (result.isConfirmed) {
            const currentUrl = window.location.pathname;
            window.location.href = `/auth/login?redirect=${encodeURIComponent(
              currentUrl
            )}`;
          }
        });
      }

      const data = await res.json();
      console.log("Server response:", data);

      if (data.unlisted) {
        return Swal.fire({
          icon: "error",
          title: "Product Unavailable",
          text: data.message || "This product is currently unavailable",
        }).then(() => location.reload());
      }

      if (!data.success) {
        return Swal.fire({
          icon: "warning",
          title: "Limit Reached",
          text: data.message || "Maximum quantity reached.",
        });
      }

      Swal.fire({
        icon: "success",
        text: "Added to cart!",
        toast: true,
        position: "bottom",
        timer: 1500,
        showConfirmButton: false,
      });

      const cartBadge = document.getElementById("cartCount");
      if (cartBadge) {
        cartBadge.innerText = data.cartCount;
        cartBadge.classList.remove("d-none");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        text: "Could not add to cart.",
        toast: true,
        position: "bottom",
        timer: 2500,
        showConfirmButton: false,
      });
    }
  });

  // -------------------- BUY NOW --------------------
  document.getElementById("buyNowBtn").addEventListener("click", async () => {
    const productId = document.getElementById("productId").value;
    const variantId = selectedVariantId;
    const quantity = parseInt(quantityInput.value) || 1;

    if (!selectedColor || !selectedSize || !variantId) {
      return Swal.fire({
        icon: "warning",
        text: "Please select a size & color before proceeding.",
        toast: true,
        position: "bottom",
        timer: 2500,
        showConfirmButton: false,
      });
    }

    if (stockForSelectedVariant <= 0) {
      return Swal.fire({
        icon: "warning",
        title: "Out of Stock",
        text: "This variant is out of stock.",
      }).then(() => {
        window.location.href = `/product/${productId}`;
      });
    }

    if (quantity > stockForSelectedVariant) {
      return Swal.fire({
        icon: "warning",
        title: "Insufficient Stock",
        text: `Only ${stockForSelectedVariant} item(s) available.`,
      });
    }

    try {
      const res = await fetch("/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, quantity }),
        credentials: "include",
      });

      if (res.status === 401) {
        return Swal.fire({
          icon: "warning",
          title: "Login Required",
          text: "Please login to continue purchase.",
          showCancelButton: true,
          confirmButtonText: "Login",
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            const currentUrl = window.location.pathname;
            window.location.href = `/auth/login?redirect=${encodeURIComponent(
              currentUrl
            )}`;
          }
        });
      }

      const data = await res.json();

      if (data.unlisted) {
        return Swal.fire({
          icon: "warning",
          title: "Product Unavailable",
          text: data.message,
        }).then(() => location.reload());
      }

      if (!data.success) {
        return Swal.fire({
          icon: "warning",
          text: data.message || "Failed to add to cart.",
        });
      }

      window.location.href = `/checkout/select-address?buyNow=1`;
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        text: "Server error. Please try again.",
      });
    }
  });
});