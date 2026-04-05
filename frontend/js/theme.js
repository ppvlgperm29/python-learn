// ── Theme (dark/light) ────────────────────────────────────
(function() {
  const saved = localStorage.getItem('theme') || 'light';
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
})();

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeBtn();
}

function updateThemeBtn() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const label = isDark ? '☀' : '☾';
  const labelFull = isDark ? '☀ Светлая' : '☾ Тёмная';
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = labelFull;
  const btnMobile = document.getElementById('theme-toggle-mobile');
  if (btnMobile) btnMobile.textContent = label;
}

document.addEventListener('DOMContentLoaded', updateThemeBtn);
