/* docs/js/pages.js : docs/pages/*에서 사용되는 공통 페이지 로직을 정의합니다. */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href="#"]').forEach(anchor => {
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
    });
  });

  const searchInput = document.querySelector('[data-tech-search]');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();

    document.querySelectorAll('.tech-category').forEach(category => {
      let visibleCount = 0;
      category.querySelectorAll('.tech-item').forEach(item => {
        const isVisible = item.textContent.toLowerCase().includes(query);
        item.classList.toggle('hidden', !isVisible);
        if (isVisible) visibleCount += 1;
      });
      category.classList.toggle('hidden', visibleCount === 0);
    });
  });
});
