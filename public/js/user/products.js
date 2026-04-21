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


const clearBtn = document.getElementById("clearFilterTop");
  const checkboxes = document.querySelectorAll('.form-check-input');

  // ✅ SHOW / HIDE CLEAR BUTTON
  function checkFiltersActive() {
    let isActive = false;

    checkboxes.forEach(input => {
      if (input.checked) isActive = true;
    });

    if (isActive) {
      clearBtn.classList.remove("d-none");
    } else {
      clearBtn.classList.add("d-none");
    }
  }

  // Run on load
  checkFiltersActive();

  // Run when checkbox changes
  checkboxes.forEach(input => {
    input.addEventListener("change", checkFiltersActive);
  });

  // ✅ CLEAR BUTTON CLICK (NO RELOAD)
  clearBtn.addEventListener("click", () => {

    // 1. Uncheck all filters
    checkboxes.forEach(input => input.checked = false);

    // 2. Remove filter params from URL
    const url = new URL(window.location.href);

    url.searchParams.delete("category");
    url.searchParams.delete("brand");
    url.searchParams.delete("color");
    url.searchParams.delete("size");

    // 3. Update URL without reload
    window.history.replaceState({}, "", url);

    // 4. Hide button
    clearBtn.classList.add("d-none");

    // 5. Refresh products (IMPORTANT)
    fetchProducts();
  });

function fetchProducts() {
  const url = new URL(window.location.href);

  fetch(url)
    .then(res => res.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const newProducts = doc.querySelector(".col-md-9");
      document.querySelector(".col-md-9").innerHTML = newProducts.innerHTML;
    })
    .catch(err => console.error(err));
}
