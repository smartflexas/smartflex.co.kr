/* docs/js/pages.js : docs/pages/*에서 사용되는 공통 페이지 로직을 정의합니다. */

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href="#"]').forEach(anchor => {
    anchor.addEventListener('click', (event) => {
      event.preventDefault();
    });
  });
});
