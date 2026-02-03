let selectedColor = null;
let selectedSize = null;
let selectedVariantId = null;
let stockForSelectedVariant = 0;
let quantityInput = null;
let curretCartQtyMap



function updateSizesForColor(color) {
  const allButtons = document.querySelectorAll('.size-btn');
  allButtons.forEach(btn => {
    if (btn.dataset.color === color) {
      btn.style.display = 'inline-block';
    } else {
      btn.style.display = 'none';
    }
  });

  // reset selection
  selectedSize = null;
  selectedVariantId = null;
  stockForSelectedVariant = 0;
  quantityInput.value = 1;
  quantityInput.disabled = true;

  //auto-selct first available size

  const firstAvl = Array.from(allButtons).find(btn => btn.dataset.color === color && !btn.disabled);
  if (firstAvl) {
    firstAvl.click();
  }
}

function showStockForColor(color) {
  document.querySelectorAll('.stock-msg').forEach(msg => {
    if (msg.dataset.color === color) {
      msg.style.display = 'block';
    } else {
      msg.style.display = 'none';
    }
  });
}

function changeMainImage(src) {
  document.getElementById('mainProductImage').src = src;
}


function selectColor(color, imgSrc) {
  selectedColor = color;
  changeMainImage(imgSrc);

  // highlight selected color
  document.querySelectorAll('.color-thumb').forEach(img =>
    img.classList.remove('border-dark', 'selected')
  );
  const clicked = document.querySelector(`[data-color="${color}"]`);
  if (clicked) clicked.classList.add('border-dark', 'selected');

  // show only sizes for that color & limited stock msg
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

    if (quantityInput.value > quantityInput.max) quantityInput.value = quantityInput.max;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const sizeBtns = document.querySelectorAll('.size-btn');
  const addToCartBtn = document.querySelector('.addToCartBtn');
  quantityInput = document.getElementById('quantity');
  const colorThumbs = document.querySelectorAll('.color-thumb');
  const buyNowBtn = document.getElementById("buyNowBtn");

  //--------------------------------------
  async function fetchCartCount() {
  const cartBadge = document.getElementById('cartCount');
  if (!cartBadge) return;

  try {
    const res = await fetch('/get-cart-count', { credentials: 'include' });
    const data = await res.json();

    if (data.success) {
      cartBadge.innerText = data.count;
      if (data.count > 0) {
        cartBadge.classList.remove('d-none');
      } else {
        cartBadge.classList.add('d-none');
      }
    }
  } catch (err) {
    console.error('Failed to fetch cart count:', err);
  }
}

// Call it on page load
fetchCartCount();

  //-------------------------------------

  quantityInput.min = 1;
  quantityInput.addEventListener('input', () => {
    let val = parseInt(quantityInput.value) || 1;
    const maxQty = Math.min(stockForSelectedVariant, 5);
    if (val < 1) val = 1;
    if (val > maxQty) val = maxQty;
    quantityInput.value = val;
  })


  // hide all sizes at first
  document.querySelectorAll('.size-btn').forEach(btn => btn.style.display = 'none');

  // Auto-select first color
  if (colorThumbs.length > 0) {
    const first = colorThumbs[0];
    selectColor(first.dataset.color, first.getAttribute('src'));
  }

  // Handle color click
  colorThumbs.forEach(img => {
    img.addEventListener('click', () => {
      selectColor(img.dataset.color, img.getAttribute('src'));
    });
  });

  // Handle size selection

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;

      const alreadySelected = btn.classList.contains('selected');

      // Deselect all first
      sizeBtns.forEach(b => b.classList.remove('btn-dark', 'selected'));

      if (alreadySelected) {
        selectedSize = null;
        selectedVariantId = null;
        stockForSelectedVariant = 0;;
      } else {
        //New size selected
        btn.classList.add('btn-dark', 'selected');
        selectedSize = btn.dataset.size;
        selectedVariantId = btn.dataset.variantId;
        stockForSelectedVariant = parseInt(btn.dataset.stock) || 0;

      }

      updateQtyBtn();
      document.querySelectorAll('.stock-msg').forEach(msg => msg.style.display = 'none');
      const stockMsg = btn.nextElementSibling;
      if (stockMsg && stockMsg.classList.contains('stock-msg')) {
        stockMsg.style.display = 'block';
      }
    });
  });



  // Add to Cart
 addToCartBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const productId = addToCartBtn.dataset.productId;
  const quantity = parseInt(quantityInput.value) || 1;

  if (!selectedColor || !selectedSize) {
    return Swal.fire({
      icon: 'warning',
      text: 'Please select color and size before adding to cart.',
      toast: true,
      position: "bottom",
      timer: 2500,
      showConfirmButton: false
    });
  }

  try {
    const res = await fetch('/add-to-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, variantId: selectedVariantId, quantity }),
      credentials: 'include'
    });

    const data = await res.json();
    console.log("Server response:", data);

    // PRODUCT UNLISTED
    if (data.unlisted) {
      return Swal.fire({
        icon: 'error',
        title: 'Product Unavailable',
        text: data.message || "This product is currently unavailable",
        confirmButtonText: 'OK',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {
        location.reload();
      });
    }

    // SUCCESS
    if (data.success) {
      Swal.fire({
        icon: 'success',
        text: 'Added to cart!',
        toast: true,
        position: "bottom",
        timer: 1500,
        showConfirmButton: false
      });

      const cartBadge = document.getElementById('cartCount');
      if (cartBadge) {
        cartBadge.innerText = data.cartCount;
        cartBadge.classList.remove('d-none');
      }
    }

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      text: 'Could not add to cart.',
      toast: true,
      position: "bottom",
      timer: 2500,
      showConfirmButton: false
    });
  }
});


 document.getElementById("buyNowBtn").addEventListener("click", async () => {
  const productId = document.getElementById("productId").value;
  const variantId = selectedVariantId;
  const quantity = parseInt(quantityInput.value) || 1;

  // Check if size & color are selected
  if (!selectedColor || !selectedSize || !variantId) {
    return Swal.fire({
      icon: 'warning',
      text: "Please select a size & color before proceeding.",
      toast: true,
      position: "bottom",
      timer: 2500,
      showConfirmButton: false,
    });
  }

  // If stock is zero
  if (stockForSelectedVariant <= 0) {
    return Swal.fire({
      icon: 'error',
      title: 'Out of Stock',
      text: 'This variant is out of stock.',
      confirmButtonText: 'Go Back',
    }).then(() => {
      // Redirect back to the product details page
      window.location.href = `/product/${productId}`;
    });
  }

  // If requested quantity exceeds stock
  if (quantity > stockForSelectedVariant) {
    return Swal.fire({
      icon: 'error',
      title: 'Insufficient Stock',
      text: `Only ${stockForSelectedVariant} item(s) available.`,
    });
  }

  try {
    // Add to cart
    const res = await fetch('/add-to-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, variantId, quantity }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.unlisted) {
      return Swal.fire({
        icon: 'error',
        title: 'Product Unavailable',
        text: data.message || "This product is currently unavailable",
        confirmButtonText: 'OK',
        allowOutsideClick: false,
        allowEscapeKey: false
      }).then(() => {
        location.reload();
      });
    }
        if (!data.success) {
      return Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message || "Failed to add to cart. Please try again."
      });
    }
    if (data.success) {
      // Update cart badge
      const cartBadge = document.getElementById('cartCount');
      if (cartBadge) {
        cartBadge.innerText = data.cartCount;
        cartBadge.classList.remove('d-none');
      }

      // Redirect to Select Address page
      window.location.href = `/checkout/select-address?buyNow=1`;
    } else {
      Swal.fire({
        icon: 'error',
        text: "Failed to add to cart. Please try again.",
      });
    }

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      text: "Server error. Please try again."
    });
  }
});


});

