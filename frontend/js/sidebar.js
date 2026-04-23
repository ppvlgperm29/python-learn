// Shared sidebar renderer — used by all pages
function renderSidebar(topics, activeSlug) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = topics.map((t, i) => {
    try {
      const solved = JSON.parse(localStorage.getItem(`solved_${t.slug}`) || '[]').length;
      const total = t.task_count;
      const done = total > 0 && solved === total;
      const badge = total === 0 ? '' : done ? '✓' : solved > 0 ? `${solved}/${total}` : `${total}`;
      const badgeClass = done ? ' nav-item__badge--done' : solved > 0 ? ' nav-item__badge--progress' : '';
      return `
        <a class="nav-item${t.slug === activeSlug ? ' active' : ''}" href="/topic.html?slug=${t.slug}">
          <span class="nav-item__num">${String(i + 1).padStart(2, '0')}</span>
          <span class="nav-item__title">${t.title}</span>
          ${badge ? `<span class="nav-item__badge${badgeClass}">${badge}</span>` : ''}
        </a>`;
    } catch { return ''; }
  }).join('');
}
