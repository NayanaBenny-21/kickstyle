// Function to fetch and update cart count
async function updateCartCount() {
  const cartBadge = document.getElementById('cartCount');
  if (!cartBadge) return;

  try {
    const res = await fetch('/get-cart-count', { credentials: 'include' });
    const data = await res.json();

    if (data.success) {
      cartBadge.innerText = data.count;
      if (data.count > 0) cartBadge.classList.remove('d-none');
      else cartBadge.classList.add('d-none');
    }
  } catch (err) {
    console.error('Failed to fetch cart count:', err);
  }
}

// Call it immediately on page load
document.addEventListener('DOMContentLoaded', updateCartCount);
