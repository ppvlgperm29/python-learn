// ── Constants ─────────────────────────────────────────────
const DIFF_LABEL = { easy: 'Лёгкая', medium: 'Средняя', hard: 'Сложная' };
const DIFF_CLASS = { easy: 'easy', medium: 'medium', hard: 'hard' };

let allChallenges = [];
let currentChallenge = null;
let cmEditor = null;
let activeFilter = 'all';

// ── LocalStorage helpers ──────────────────────────────────
function getSolvedIds() {
  try { return new Set(JSON.parse(localStorage.getItem('practice_solved') || '[]')); }
  catch { return new Set(); }
}

function markChallengesSolved(id) {
  const set = getSolvedIds();
  set.add(id);
  localStorage.setItem('practice_solved', JSON.stringify([...set]));
}

// ── Sidebar ───────────────────────────────────────────────
function renderSidebar(topics) {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = topics.map((t, i) => {
    try {
      const solved = JSON.parse(localStorage.getItem(`solved_${t.slug}`) || '[]').length;
      const total = t.task_count;
      const done = total > 0 && solved === total;
      const badge = total === 0 ? '' : done ? '✓' : solved > 0 ? `${solved}/${total}` : `${total}`;
      const badgeClass = done ? ' nav-item__badge--done' : solved > 0 ? ' nav-item__badge--progress' : '';
      return `
        <a class="nav-item" href="/topic.html?slug=${t.slug}">
          <span class="nav-item__num">${String(i + 1).padStart(2, '0')}</span>
          <span class="nav-item__title">${t.title}</span>
          ${badge ? `<span class="nav-item__badge${badgeClass}">${badge}</span>` : ''}
        </a>`;
    } catch { return ''; }
  }).join('');
}

function updatePracticeBadge() {
  const solved = getSolvedIds().size;
  const total = allChallenges.length;
  const badge = document.getElementById('practice-nav-badge');
  if (!badge) return;
  if (solved === 0) { badge.textContent = ''; return; }
  if (solved === total) {
    badge.textContent = '✓';
    badge.className = 'nav-item__badge nav-item__badge--done';
  } else {
    badge.textContent = `${solved}/${total}`;
    badge.className = 'nav-item__badge nav-item__badge--progress';
  }
}

// ── Stats ─────────────────────────────────────────────────
function updateStats(challenges) {
  const solved = getSolvedIds();
  const total = challenges.length;
  const done = [...solved].filter(id => challenges.find(c => c.id === id)).length;
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  document.getElementById('stats-fill').style.width = pct + '%';
  document.getElementById('stats-label').textContent = `Решено: ${done} из ${total}`;
}

// ── Description rendering ─────────────────────────────────
function renderDesc(text) {
  // Split on code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map(part => {
    if (part.startsWith('```')) {
      const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
      return `<pre><code>${escHtml(code)}</code></pre>`;
    }
    // inline code
    const inlined = part.replace(/`([^`]+)`/g, (_, c) => `<code>${escHtml(c)}</code>`);
    return inlined.split(/\n\n+/).map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }).join('');
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Challenge List ────────────────────────────────────────
function renderList(challenges) {
  const solved = getSolvedIds();
  const visible = activeFilter === 'all' ? challenges : challenges.filter(c => c.difficulty === activeFilter);

  if (visible.length === 0) {
    document.getElementById('challenge-list').innerHTML =
      `<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:0.9rem">Нет задач с таким фильтром</div>`;
    return;
  }

  document.getElementById('challenge-list').innerHTML = visible.map(c => {
    const isSolved = solved.has(c.id);
    return `
      <div class="challenge-row${isSolved ? ' solved' : ''}" onclick="openChallenge('${c.id}')">
        <span class="challenge-row__num">${String(c.order).padStart(2, '0')}</span>
        <span class="challenge-row__title">${escHtml(c.title)}</span>
        <span class="challenge-row__cat">${escHtml(c.category)}</span>
        <span class="challenge-row__badge challenge-row__badge--${c.difficulty}">${DIFF_LABEL[c.difficulty]}</span>
        <span class="challenge-row__status">${isSolved ? '✓' : ''}</span>
      </div>`;
  }).join('');
}

// ── Open / close detail ───────────────────────────────────
function openChallenge(id) {
  const challenge = allChallenges.find(c => c.id === id);
  if (!challenge) return;
  currentChallenge = challenge;

  // Switch views
  document.getElementById('view-list').style.display = 'none';
  document.getElementById('view-detail').style.display = 'flex';

  // Topbar
  document.getElementById('detail-title').textContent = challenge.title;
  const badge = document.getElementById('detail-badge');
  badge.textContent = DIFF_LABEL[challenge.difficulty];
  badge.className = `task-card__badge task-card__badge--${DIFF_CLASS[challenge.difficulty]}`;

  // Description
  const solved = getSolvedIds().has(id);
  document.getElementById('prob-desc-panel').innerHTML = `
    <div class="prob-title">${escHtml(challenge.title)}</div>
    <div class="prob-meta">
      <span class="task-card__badge task-card__badge--${DIFF_CLASS[challenge.difficulty]}">${DIFF_LABEL[challenge.difficulty]}</span>
      <span style="font-size:0.78rem;color:var(--text-muted)">${escHtml(challenge.category)}</span>
    </div>
    <div class="prob-desc">${renderDesc(challenge.description)}</div>
  `;

  // Editor
  document.getElementById('cm-container').innerHTML = '<textarea id="cm-editor"></textarea>';
  cmEditor = CodeMirror.fromTextArea(document.getElementById('cm-editor'), {
    mode: 'python',
    theme: 'eclipse',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: false,
    extraKeys: { Tab: cm => cm.replaceSelection('    ') }
  });
  cmEditor.setValue(challenge.starter_code);
  setTimeout(() => cmEditor.refresh(), 50);

  // Reset panels
  document.getElementById('hint-box').classList.remove('visible');
  document.getElementById('hint-box').textContent = '';
  document.getElementById('output-panel').style.display = 'none';
  document.getElementById('test-results').style.display = 'none';

  // Solved banner
  const banner = document.getElementById('solved-banner');
  banner.classList.toggle('visible', solved);

  // Hash for bookmarking
  location.hash = id;
}

function showList() {
  document.getElementById('view-list').style.display = 'block';
  document.getElementById('view-detail').style.display = 'none';
  currentChallenge = null;
  location.hash = '';
  updateStats(allChallenges);
  renderList(allChallenges);
}

// ── Buttons ───────────────────────────────────────────────
function setupButtons() {
  // Run
  document.getElementById('btn-run').addEventListener('click', async () => {
    const btn = document.getElementById('btn-run');
    btn.disabled = true;
    btn.textContent = '⏳ Запуск...';
    document.getElementById('test-results').style.display = 'none';

    const code = cmEditor.getValue();
    const { stdout, stderr } = await PyodideRunner.run(code);

    const panel = document.getElementById('output-panel');
    const body = document.getElementById('output-body');
    const status = document.getElementById('output-status');
    panel.style.display = 'block';

    if (stderr) {
      body.textContent = stderr;
      body.className = 'output-panel__body has-error';
      status.textContent = 'Ошибка';
      status.className = 'output-panel__status output-panel__status--error';
    } else {
      body.textContent = stdout || '(нет вывода)';
      body.className = 'output-panel__body';
      status.textContent = '';
      status.className = 'output-panel__status';
    }

    btn.disabled = false;
    btn.textContent = '▶ Запустить';
  });

  // Check
  document.getElementById('btn-check').addEventListener('click', async () => {
    if (!currentChallenge) return;
    const btn = document.getElementById('btn-check');
    btn.disabled = true;
    btn.textContent = '⏳ Проверка...';
    document.getElementById('output-panel').style.display = 'none';

    const code = cmEditor.getValue();
    const { results, error } = await PyodideRunner.runChallenge(code, currentChallenge.tests);

    const panel = document.getElementById('test-results');
    const list = document.getElementById('test-list');
    const summary = document.getElementById('test-summary');
    panel.style.display = 'block';

    if (error) {
      list.innerHTML = `<div class="test-case test-case--fail">
        <span class="test-case__icon">✗</span>
        <span class="test-case__err">${escHtml(error)}</span>
      </div>`;
      summary.textContent = 'Ошибка';
      summary.className = 'test-results__summary test-results__summary--fail';
    } else {
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      const allPass = passed === total;

      summary.textContent = `${passed} / ${total}`;
      summary.className = `test-results__summary test-results__summary--${allPass ? 'pass' : 'fail'}`;

      list.innerHTML = results.map((r, i) => {
        const label = currentChallenge.tests[i]?.label || `Тест ${i + 1}`;
        if (r.passed) {
          return `<div class="test-case test-case--pass">
            <span class="test-case__icon">✓</span>
            <span class="test-case__label">${escHtml(label)}</span>
          </div>`;
        }
        if (r.error) {
          return `<div class="test-case test-case--fail">
            <span class="test-case__icon">✗</span>
            <span class="test-case__label">${escHtml(label)}</span>
            <span style="margin-left:8px" class="test-case__err">${escHtml(r.error)}</span>
          </div>`;
        }
        return `<div class="test-case test-case--fail">
          <span class="test-case__icon">✗</span>
          <span class="test-case__label">${escHtml(label)}</span>
          <span style="margin-left:8px;color:var(--text-muted)">→ получили</span>
          <span style="margin-left:4px" class="test-case__got">${escHtml(r.actual)}</span>
          <span style="margin-left:8px;color:var(--text-muted)">ожидали</span>
          <span style="margin-left:4px" class="test-case__exp">${escHtml(r.expected)}</span>
        </div>`;
      }).join('');

      if (allPass) {
        markChallengesSolved(currentChallenge.id);
        document.getElementById('solved-banner').classList.add('visible');
        updatePracticeBadge();
        // Update row in list (for when user goes back)
      }
    }

    btn.disabled = false;
    btn.textContent = '✓ Проверить';
  });

  // Hint
  document.getElementById('btn-hint').addEventListener('click', () => {
    if (!currentChallenge) return;
    const box = document.getElementById('hint-box');
    box.textContent = currentChallenge.hint;
    box.classList.toggle('visible');
  });

  // Reset
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!currentChallenge || !cmEditor) return;
    cmEditor.setValue(currentChallenge.starter_code);
    document.getElementById('output-panel').style.display = 'none';
    document.getElementById('test-results').style.display = 'none';
    document.getElementById('hint-box').classList.remove('visible');
  });
}

// ── Filters ───────────────────────────────────────────────
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderList(allChallenges);
    });
  });
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  setupFilters();
  setupButtons();

  try {
    const [challenges, topics] = await Promise.all([
      API.getChallenges(),
      API.getTopics()
    ]);
    allChallenges = challenges.sort((a, b) => a.order - b.order);
    renderSidebar(topics);
    updateStats(allChallenges);
    updatePracticeBadge();
    renderList(allChallenges);

    // Handle direct link via hash
    const hash = location.hash.slice(1);
    if (hash && allChallenges.find(c => c.id === hash)) {
      openChallenge(hash);
    }
  } catch (e) {
    document.getElementById('challenge-list').innerHTML =
      `<div style="padding:32px;text-align:center;color:var(--text-muted)">Не удалось загрузить задачи. Убедитесь, что сервер запущен.</div>`;
  }
}

init();
