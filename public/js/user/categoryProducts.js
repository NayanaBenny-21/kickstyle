document.addEventListener("DOMContentLoaded", () => {
  const applyFilterBtn = document.getElementById("applyFilter");
  const sortSelect = document.getElementById("sortProducts");
  const category = document.getElementById("category").value;

  // Apply filters
  applyFilterBtn.addEventListener("click", () => {
    const params = new URLSearchParams();

    document.querySelectorAll("input[name='brand']:checked").forEach(cb => params.append("brand", cb.value));
    document.querySelectorAll("input[name='color']:checked").forEach(cb => params.append("color", cb.value));
    document.querySelectorAll("input[name='size']:checked").forEach(cb => params.append("size", cb.value));

    if (sortSelect.value) params.set("sort", sortSelect.value);
    params.set("page", 1);

    window.location.href = `/products/${category}?${params.toString()}`;
  });

  // Sorting change
  sortSelect.addEventListener("change", (e) => {
    const params = new URLSearchParams(window.location.search);
    params.set("sort", e.target.value);
    params.set("page", 1);
    window.location.href = `/products/${category}?${params.toString()}`;
  });
});
