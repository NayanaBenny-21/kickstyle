let selectedColor = null;
let selectedSize = null;
let selectedVariantId = null;

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

  // show only sizes for that color
  updateSizesForColor(color);
}

document.addEventListener('DOMContentLoaded', () => {
  const sizeBtns = document.querySelectorAll('.size-btn');
  const addToCartBtn = document.querySelector('.addToCartBtn');
  const quantityInput = document.getElementById('quantity');
  const colorThumbs = document.querySelectorAll('.color-thumb');

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
      // deselect
      selectedSize = null;
      selectedVariantId = null;
    } else {
      //New size selected
      btn.classList.add('btn-dark', 'selected');
      selectedSize = btn.dataset.size;
      selectedVariantId = btn.dataset.variantId;
    }
  });
});


  // Add to Cart
  addToCartBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const productId = addToCartBtn.dataset.productId;
    const quantity = quantityInput?.value || 1;

    if (!selectedColor || !selectedSize) {
      Swal.fire({
        icon: 'warning',
        text: 'Please select color and size before adding to cart.',
        toast: true,
        position: "bottom",
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const res = await fetch('/add-to-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, variantId: selectedVariantId, quantity }),
      });
      const data = await res.json();
      console.log('Server response:', data);

      if (data.success) {
        Swal.fire({
          icon: 'success',
          text: 'Added to cart!',
          toast: true,
          position: "bottom",
          timer: 1500,
          showConfirmButton: false,
          width: 350,
          padding: '0.5em 1em',
          customClass: { popup: 'small-toast' }
        });
        setTimeout(() => (window.location.href = '/cart'), 1500);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: 'Could not add to cart. Please try again.',
        toast: true,
        position: "bottom",
        timer: 2500,
        showConfirmButton: false,
      });
    }
  });
});
