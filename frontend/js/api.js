const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('auth_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiGet(path) {
  const res = await fetch(API_BASE + path, { headers: authHeaders() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const API = {
  getTopics: () => apiGet('/topics'),
  getTopic: (slug) => apiGet(`/topics/${slug}`),
  getChallenges: () => apiGet('/challenges'),

  // Auth
  me: () => apiGet('/auth/me'),

  // Progress (server-side, requires auth)
  getProgress: () => apiGet('/progress'),
  markChallengeSolved: (slug) => apiPost('/progress/challenge', { challenge_slug: slug }),
  saveTopicProgress: (slug, tasks) => apiPost('/progress/topic', { topic_slug: slug, solved_tasks: tasks }),
};

// ── Auth widget (injected into sidebar footer) ────────────
function renderAuthWidget() {
  const footer = document.getElementById('sidebar-footer');
  if (!footer) return;

  const token = getToken();
  const username = localStorage.getItem('auth_username');

  if (token && username) {
    footer.innerHTML = `
      <div class="auth-widget">
        <span class="auth-widget__name">👤 ${escHtmlBasic(username)}</span>
        <button class="auth-widget__logout" onclick="logOut()">Выйти</button>
      </div>`;
  } else {
    footer.innerHTML = `
      <div class="auth-widget auth-widget--guest">
        <a class="auth-widget__login" href="/auth.html?next=${encodeURIComponent(location.pathname)}">
          Войти
        </a>
        <span class="auth-widget__hint">— чтобы сохранять прогресс</span>
      </div>`;
  }
}

function escHtmlBasic(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function logOut() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_username');
  localStorage.removeItem('auth_user_id');
  location.reload();
}

// Load server progress and merge with localStorage (if logged in)
async function loadServerProgress() {
  if (!getToken()) return;
  try {
    const progress = await API.getProgress();

    // Challenges
    const localSolved = new Set(JSON.parse(localStorage.getItem('practice_solved') || '[]'));
    progress.solved_challenges.forEach(s => localSolved.add(s));
    localStorage.setItem('practice_solved', JSON.stringify([...localSolved]));

    // Topics
    for (const [slug, tasks] of Object.entries(progress.topic_progress || {})) {
      const key = `solved_${slug}`;
      const local = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
      tasks.forEach(t => local.add(t));
      localStorage.setItem(key, JSON.stringify([...local]));
    }
  } catch { /* token expired or network error — ignore */ }
}
