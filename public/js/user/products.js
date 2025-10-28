  document.getElementById('applyFilter').addEventListener('click', function () {
    const params = new URLSearchParams();

    // Sort
    const sortSelect = document.getElementById('sortProducts');
    if (sortSelect.value) params.set('sort', sortSelect.value);

    // Filters
    ['category', 'brand', 'color', 'size'].forEach(name => {
      document.querySelectorAll(`input[name="${name}"]:checked`).forEach(el => {
        params.append(name, el.value);
      });
    });
params.set('page', 1);
    window.location.href = '/products?' + params.toString();
  });

  // Auto refresh on sort change
  document.getElementById('sortProducts').addEventListener('change', function () {
    const params = new URLSearchParams(window.location.search);
    params.set('sort', this.value);
    params.set('page', 1);
    window.location.href = '/products?' + params.toString();
  });




