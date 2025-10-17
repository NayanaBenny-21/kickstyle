
  let variantCount = 1;

document.getElementById('addVariantBtn').addEventListener('click', () => {
  const container = document.getElementById('variantContainer');
  const variantDiv = document.createElement('div');
  variantDiv.classList.add('variant-item', 'd-flex', 'align-items-center', 'gap-2', 'border', 'p-2', 'rounded', 'mb-2', 'bg-light');

  variantDiv.innerHTML = `
    <input type="text" name="variants[${variantCount}][color]" class="form-control form-control-sm" placeholder="Color">
    <input type="text" name="variants[${variantCount}][size]" class="form-control form-control-sm" placeholder="Size">
    <input type="text" name="variants[${variantCount}][sku]" class="form-control form-control-sm" placeholder="SKU">
    <input type="number" name="variants[${variantCount}][stock]" class="form-control form-control-sm" placeholder="Stock">
    <input type="file" name="variants[${variantCount}][image]" class="form-control form-control-sm" accept="image/*">
    <button type="button" class="btn btn-outline-danger btn-sm removeVariantBtn">
      <i class="bi bi-trash"></i>
    </button>
  `;

  container.appendChild(variantDiv);
  variantCount++;
});

// Remove variant row
document.addEventListener('click', function(e) {
  if (e.target.closest('.removeVariantBtn')) {
    e.target.closest('.variant-item').remove();
  }
});

//calculate final price

function calculateFinalPrice() {
    const basePriceInput = document.querySelector('input[name="base_price"]');
    const discountInput = document.querySelector('input[name="discount_percentage"]');
    const finalPriceInput = document.querySelector('input[name="finalPrice"]');

    if (!basePriceInput || !discountInput || !finalPriceInput) return;

    let basePrice = parseFloat(basePriceInput.value) || 0;
    let discount = parseFloat(discountInput.value) || 0;

    basePrice = Math.max(0, basePrice);
    discount = Math.max(0, discount);

    const finalPrice = basePrice - (basePrice * discount / 100);
    finalPriceInput.value = finalPrice.toFixed(2);
}


document.querySelector('input[name="base_price"]').addEventListener('input', calculateFinalPrice);
document.querySelector('input[name="discount_percentage"]').addEventListener('input', calculateFinalPrice);

calculateFinalPrice();

// Validate minimum 3 images

const imageInput = document.getElementById('galleryFiles');
const productForm = document.getElementById('productForm');
const preview = document.getElementById('preview');

// Store selected files
let selectedFiles = [];

imageInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  selectedFiles = selectedFiles.concat(files);

  // Show previews
  preview.innerHTML = '';
  selectedFiles.forEach(file => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.height = '80px';
    img.style.margin = '5px';
    img.style.objectFit = 'cover';
    preview.appendChild(img);
  });

  // Clear input so the same file can be added again if needed
  imageInput.value = '';
});

productForm.addEventListener('submit', (e) => {
  if (selectedFiles.length < 3) {
    e.preventDefault();
    alert('Please select at least 3 product images.');
  }

  

    const variantItems = document.querySelectorAll('.variant-item');
  for (let i = 0; i < variantItems.length; i++) {
    const variantImageInput = variantItems[i].querySelector('input[type="file"]');
    if (!variantImageInput || variantImageInput.files.length === 0) {
      e.preventDefault();
      alert(`Please upload an image for variant #${i + 1}`);
      return;
    }
  }
//"DataTransfer" to include selected files in actual form submit
  const dataTransfer =  new DataTransfer();
  selectedFiles.forEach(files => dataTransfer.items.add(files));
  imageInput.files = dataTransfer.files;
});

