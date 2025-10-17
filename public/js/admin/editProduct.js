document.addEventListener('DOMContentLoaded', () => {
  const productForm = document.getElementById('productForm');

  // --- Final price auto calculation ---
  function calculateFinalPrice() {
    const basePrice = parseFloat(document.querySelector('input[name="base_price"]').value) || 0;
    const discount = parseFloat(document.querySelector('input[name="discount_percentage"]').value) || 0;
    document.querySelector('input[name="finalPrice"]').value = (basePrice - (basePrice * discount / 100)).toFixed(2);
  }

  document.querySelector('input[name="base_price"]').addEventListener('input', calculateFinalPrice);
  document.querySelector('input[name="discount_percentage"]').addEventListener('input', calculateFinalPrice);
  calculateFinalPrice();


  // --- Variant logic ---
  let variantCount = document.querySelectorAll('.variant-item').length;
  const variantContainer = document.getElementById('variantContainer');
  const addVariantBtn = document.getElementById('addVariantBtn');

  addVariantBtn.addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'variant-item d-flex align-items-center gap-2 border p-2 rounded mb-2 bg-light';
    div.innerHTML = `
      <input type="text" name="variants[${variantCount}][color]" class="form-control form-control-sm" placeholder="Color">
      <input type="text" name="variants[${variantCount}][size]" class="form-control form-control-sm" placeholder="Size">
      <input type="text" name="variants[${variantCount}][sku]" class="form-control form-control-sm" placeholder="SKU">
      <input type="number" name="variants[${variantCount}][stock]" class="form-control form-control-sm" placeholder="Stock">
      <input type="file" name="variantImages" class="form-control form-control-sm" accept="image/*">
      <input type="hidden" name="variants[${variantCount}][existingImage]" value="">
      <button type="button" class="btn btn-outline-danger btn-sm removeVariantBtn">
        <i class="bi bi-trash"></i>
      </button>
    `;
    variantContainer.appendChild(div);
    variantCount++;
  });

  // --- Remove variant dynamically ---
  document.addEventListener('click', e => {
    if (e.target.classList.contains('removeVariantBtn') || e.target.closest('.removeVariantBtn')) {
      e.target.closest('.variant-item').remove();
    }
  });


  // --- Gallery images logic ---
  const galleryInput = document.getElementById('galleryFiles');
  const galleryContainer = document.getElementById('galleryContainer');
  let selectedFiles = [];
  let removedImages = [];
  const dataTransfer = new DataTransfer();

  if (galleryInput) {
    galleryInput.addEventListener('change', e => {
      Array.from(e.target.files).forEach(file => {
        selectedFiles.push(file);
        dataTransfer.items.add(file);

        const reader = new FileReader();
        reader.onload = ev => {
          const div = document.createElement('div');
          div.className = 'gallery-image-wrapper';
          div.dataset.temp = 'true';
          div.dataset.name = file.name;
          div.innerHTML = `
            <img src="${ev.target.result}" width="80" height="80" style="object-fit:cover;margin:5px;">
            <button type="button" class="remove-btn">×</button>
          `;
          galleryContainer.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
      galleryInput.files = dataTransfer.files;
    });

    // Remove gallery image
    galleryContainer.addEventListener('click', e => {
      if (!e.target.classList.contains('remove-btn')) return;
      const wrapper = e.target.closest('.gallery-image-wrapper');

      if (wrapper.dataset.temp) {
        const name = wrapper.dataset.name;
        for (let i = 0; i < dataTransfer.items.length; i++) {
          if (dataTransfer.items[i].getAsFile().name === name) dataTransfer.items.remove(i);
        }
        selectedFiles = selectedFiles.filter(f => f.name !== name);
        galleryInput.files = dataTransfer.files;
      } else if (wrapper.dataset.imageUrl) {
        removedImages.push(wrapper.dataset.imageUrl);
      }
      wrapper.remove();
    });
  }

  // --- Form submission validation ---
  productForm.addEventListener('submit', e => {
    const existingImages = Array.from(galleryContainer.querySelectorAll('.gallery-image-wrapper'))
      .filter(div => div.dataset.imageUrl)
      .map(div => div.dataset.imageUrl);

    if (existingImages.length + selectedFiles.length < 3) {
      e.preventDefault();
      alert('Please upload at least 3 images.');
      return;
    }

    const removedInput = document.createElement('input');
    removedInput.type = 'hidden';
    removedInput.name = 'removedImages';
    removedInput.value = JSON.stringify(removedImages);
    productForm.appendChild(removedInput);

    const finalDT = new DataTransfer();
    selectedFiles.forEach(f => finalDT.items.add(f));
    galleryInput.files = finalDT.files;
  });
});
