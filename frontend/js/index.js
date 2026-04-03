function renderSidebarNav(topics, activeSlug) {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = topics.map((t, i) => `
    <a class="nav-item${t.slug === activeSlug ? ' active' : ''}" href="/topic.html?slug=${t.slug}">
      <span class="nav-item__num">${String(i + 1).padStart(2, '0')}</span>
      <span class="nav-item__title">${t.title}</span>
      <span class="nav-item__badge">${t.task_count}</span>
    </a>
  `).join('');
}

function renderTopicsGrid(topics) {
  const container = document.getElementById('topics-container');
  container.innerHTML = `<div class="topics-grid">${topics.map((t, i) => `
    <a class="topic-card" href="/topic.html?slug=${t.slug}">
      <div class="topic-card__number">${String(i + 1).padStart(2, '0')}</div>
      <div class="topic-card__body">
        <div class="topic-card__title">${t.title}</div>
        <div class="topic-card__desc">${t.description}</div>
        <div class="topic-card__footer">
          <span class="topic-card__tasks">${t.task_count > 0 ? t.task_count + ' задач' : 'без задач'}</span>
        </div>
      </div>
    </a>
  `).join('')}</div>`;
}

async function init() {
  try {
    const topics = await API.getTopics();
    renderSidebarNav(topics, null);
    renderTopicsGrid(topics);
  } catch (e) {
    document.getElementById('topics-container').innerHTML =
      `<div class="loading">Не удалось загрузить темы.<br>Убедитесь, что сервер запущен:<br><code>uvicorn backend.app:app --port 8000</code></div>`;
  }
}

init();
