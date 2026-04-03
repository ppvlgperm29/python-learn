const DIFFICULTY_LABEL = { easy: 'Лёгкая', medium: 'Средняя', hard: 'Сложная' };
const DIFFICULTY_CLASS = { easy: 'easy', medium: 'medium', hard: 'hard' };

// ─── Progress ────────────────────────────────────────────
function getSolvedSet(slug) {
  try { return new Set(JSON.parse(localStorage.getItem(`solved_${slug}`) || '[]')); }
  catch { return new Set(); }
}

function markSolved(slug, taskId) {
  const set = getSolvedSet(slug);
  set.add(taskId);
  localStorage.setItem(`solved_${slug}`, JSON.stringify([...set]));
}

// ─── Sidebar ─────────────────────────────────────────────
function renderSidebar(topics, activeSlug) {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = topics.map((t, i) => `
    <a class="nav-item${t.slug === activeSlug ? ' active' : ''}" href="/topic.html?slug=${t.slug}">
      <span class="nav-item__num">${String(i + 1).padStart(2, '0')}</span>
      <span class="nav-item__title">${t.title}</span>
      <span class="nav-item__badge">${t.task_count}</span>
    </a>
  `).join('');
}

// ─── Theory sections ─────────────────────────────────────
function renderSection(section) {
  if (section.type === 'text') {
    const paras = section.content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${escHtml(p)}</p>`)
      .join('');
    return `<div class="theory-block theory-block--text">${paras}</div>`;
  }
  if (section.type === 'heading') {
    return `<div class="theory-block theory-block--heading">${escHtml(section.content)}</div>`;
  }
  if (section.type === 'note') {
    return `
      <div class="theory-block theory-block--note">
        <span class="note__prefix">NOTE</span>
        <span class="note__text">${escHtml(section.content)}</span>
      </div>`;
  }
  if (section.type === 'hood') {
    return `
      <div class="theory-block theory-block--hood">
        <div class="hood__header">
          <span class="hood__prefix">// под капотом</span>
          ${section.title ? `<span class="hood__title">${escHtml(section.title)}</span>` : ''}
        </div>
        <p class="hood__text">${escHtml(section.content)}</p>
      </div>`;
  }
  if (section.type === 'code_example') {
    const lang = section.language || 'python';
    const langLabel = lang === 'bash' ? 'Terminal' : 'Python';
    const isTerminal = lang === 'bash';
    const id = 'cb_' + Math.random().toString(36).slice(2);
    return `
      <div class="theory-block code-block${isTerminal ? ' code-block--terminal' : ''}">
        <div class="code-block__header">
          <span class="code-block__title">${escHtml(section.title || '')}</span>
          <div class="code-block__actions">
            <span class="code-block__lang">${langLabel}</span>
            <button class="code-block__copy" data-target="${id}" onclick="copyCode(this)">Копировать</button>
          </div>
        </div>
        <pre class="code-block__pre"><code id="${id}" class="language-${lang}">${escHtml(section.code)}</code></pre>
        ${section.explanation ? `<div class="code-block__explanation">${escHtml(section.explanation)}</div>` : ''}
      </div>`;
  }
  return '';
}

// ─── Task card ───────────────────────────────────────────
function renderTask(task, slug, solved) {
  const isSolved = solved.has(task.id);
  const diffClass = DIFFICULTY_CLASS[task.difficulty] || 'easy';
  const diffLabel = DIFFICULTY_LABEL[task.difficulty] || task.difficulty;
  const cardId = `task-card-${task.id}`;

  return `
    <div class="task-card${isSolved ? ' solved' : ''}" id="${cardId}" data-task-id="${task.id}" data-slug="${slug}">
      <div class="task-card__header" onclick="toggleTask('${cardId}')">
        <span class="task-card__num">${task.order}</span>
        <span class="task-card__badge task-card__badge--${diffClass}">${diffLabel}</span>
        <span class="task-card__title">${escHtml(task.title)}</span>
        ${isSolved ? '<span class="task-card__check">Решено</span>' : ''}
        <span class="task-card__toggle">
          <span class="task-card__toggle-arrow">&#8250;</span>
        </span>
      </div>
      <div class="task-card__body">
        <div class="task-card__desc">${escHtml(task.description)}</div>
        <div class="task-card__editor-wrap">
          <textarea class="cm-target" id="editor-${task.id}">${escHtml(task.starter_code || '')}</textarea>
          <div class="editor-toolbar">
            <button class="btn btn-run" onclick="runTask('${task.id}')">Запустить</button>
            ${task.expected_output ? `<button class="btn btn-check" onclick="checkTask('${task.id}')">Проверить</button>` : ''}
            <button class="btn btn-hint" onclick="toggleHint('${task.id}')">Подсказка</button>
            <button class="btn btn-reset" onclick="resetTask('${task.id}', \`${escJs(task.starter_code || '')}\`)">Сбросить</button>
          </div>
          ${task.hint ? `<div class="hint-box" id="hint-${task.id}">${escHtml(task.hint)}</div>` : ''}
          <div class="output-panel" id="output-${task.id}" style="display:none">
            <div class="output-panel__header">
              <span class="output-panel__label">Вывод</span>
              <span class="output-panel__status" id="status-${task.id}"></span>
            </div>
            <div class="output-panel__body" id="out-body-${task.id}"></div>
          </div>
        </div>
      </div>
    </div>`;
}

// ─── Progress bar ────────────────────────────────────────
function renderProgress(solved, total) {
  const n = solved.size;
  return `
    <div class="progress-wrap">
      <div class="progress-bar"><div class="progress-bar__fill" id="progress-fill" style="width:${total ? (n/total*100) : 0}%"></div></div>
      <span class="progress-label" id="progress-label">${n} / ${total}</span>
    </div>`;
}

// ─── Main render ─────────────────────────────────────────
function renderTopic(topic) {
  const slug = topic.slug;
  const solved = getSolvedSet(slug);

  document.title = `${topic.title} — Python Learn`;

  const sectionsHtml = topic.sections.map(renderSection).join('');
  const tasksHtml = topic.tasks.map(t => renderTask(t, slug, solved)).join('');

  document.getElementById('topic-container').innerHTML = `
    <div class="topic-header">
      <a href="/" class="topic-header__back">Все темы</a>
      <h1 class="topic-header__title">${escHtml(topic.title)}</h1>
      <p class="topic-header__desc">${escHtml(topic.description)}</p>
    </div>

    <div class="theory-section">
      <div class="theory-section__heading">Теория</div>
      ${sectionsHtml}
    </div>

    ${topic.tasks.length > 0 ? `
    <div class="tasks-section">
      <div class="tasks-section__heading">Практика</div>
      <p class="tasks-section__sub">2 лёгких &nbsp;·&nbsp; 2 средних &nbsp;·&nbsp; 1 сложное</p>
      ${renderProgress(solved, topic.tasks.length)}
      ${tasksHtml}
    </div>` : ''}
  `;

  // Init CodeMirror
  document.querySelectorAll('.cm-target').forEach(textarea => {
    const cm = CodeMirror.fromTextArea(textarea, {
      mode: 'python',
      theme: 'eclipse',
      lineNumbers: true,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      lineWrapping: false,
      extraKeys: { Tab: cm => cm.execCommand('insertSoftTab') },
    });
    cm.setSize('100%', null);
    const taskId = textarea.id.replace('editor-', '');
    window._editors = window._editors || {};
    window._editors[taskId] = cm;
  });

  Prism.highlightAll();
}

// ─── Task interactions ───────────────────────────────────
function toggleTask(cardId) {
  document.getElementById(cardId).classList.toggle('open');
}

function toggleHint(taskId) {
  document.getElementById(`hint-${taskId}`)?.classList.toggle('visible');
}

function getEditorCode(taskId) {
  return window._editors?.[taskId]?.getValue() || '';
}

function resetTask(taskId, starterCode) {
  window._editors?.[taskId]?.setValue(starterCode);
  document.getElementById(`output-${taskId}`).style.display = 'none';
}

function showOutput(taskId, stdout, stderr, status) {
  const panel = document.getElementById(`output-${taskId}`);
  const body = document.getElementById(`out-body-${taskId}`);
  const statusEl = document.getElementById(`status-${taskId}`);

  panel.style.display = 'block';
  const output = stdout + (stderr ? (stdout ? '\n' : '') + stderr : '');
  body.textContent = output || '(нет вывода)';
  body.className = 'output-panel__body' + (stderr ? ' has-error' : '');

  if (status === 'success') {
    statusEl.className = 'output-panel__status output-panel__status--success';
    statusEl.textContent = 'Верно!';
  } else if (status === 'error') {
    statusEl.className = 'output-panel__status output-panel__status--error';
    statusEl.textContent = 'Ошибка выполнения';
  } else if (status === 'wrong') {
    statusEl.className = 'output-panel__status output-panel__status--error';
    statusEl.textContent = 'Неверный результат';
  } else {
    statusEl.textContent = '';
    statusEl.className = 'output-panel__status';
  }
}

async function runTask(taskId) {
  const code = getEditorCode(taskId);
  const btn = document.querySelector(`#task-card-${taskId} .btn-run`);
  btn.disabled = true;
  btn.textContent = 'Выполняется...';
  try {
    const { stdout, stderr } = await PyodideRunner.run(code);
    showOutput(taskId, stdout, stderr, stderr ? 'error' : 'run');
  } catch (e) {
    showOutput(taskId, '', String(e), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Запустить';
  }
}

async function checkTask(taskId) {
  const code = getEditorCode(taskId);
  const card = document.getElementById(`task-card-${taskId}`);
  const slug = card.dataset.slug;
  const btn = card.querySelector('.btn-check');
  btn.disabled = true;
  btn.textContent = 'Проверка...';

  try {
    const { stdout, stderr } = await PyodideRunner.run(code);
    if (stderr) {
      showOutput(taskId, stdout, stderr, 'error');
      return;
    }
    const expected = card.dataset.expected;
    if (expected !== undefined) {
      if (stdout.trimEnd() === expected.trimEnd()) {
        showOutput(taskId, stdout, '', 'success');
        card.classList.add('solved');
        markSolved(slug, taskId);
        updateProgress(slug);
      } else {
        showOutput(taskId, stdout, '', 'wrong');
      }
    } else {
      showOutput(taskId, stdout, '', 'run');
    }
  } catch (e) {
    showOutput(taskId, '', String(e), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Проверить';
  }
}

function updateProgress(slug) {
  const solved = getSolvedSet(slug);
  const total = document.querySelectorAll('.task-card').length;
  const n = solved.size;
  const fill = document.getElementById('progress-fill');
  const label = document.getElementById('progress-label');
  if (fill) fill.style.width = `${total ? (n / total * 100) : 0}%`;
  if (label) label.textContent = `${n} / ${total}`;
}

// ─── Copy code ───────────────────────────────────────────
function copyCode(btn) {
  const code = document.getElementById(btn.dataset.target)?.textContent || '';
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = 'Скопировано';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Копировать'; btn.classList.remove('copied'); }, 1500);
  });
}

// ─── Escape helpers ──────────────────────────────────────
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escJs(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

// ─── Init ─────────────────────────────────────────────────
async function init() {
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (!slug) { location.href = '/'; return; }

  try {
    const [topics, topic] = await Promise.all([API.getTopics(), API.getTopic(slug)]);
    renderSidebar(topics, slug);
    renderTopic(topic);

    topic.tasks.forEach(t => {
      const card = document.getElementById(`task-card-${t.id}`);
      if (card && t.expected_output != null) {
        card.dataset.expected = t.expected_output;
      }
    });
  } catch (e) {
    document.getElementById('topic-container').innerHTML =
      `<div class="loading">Ошибка загрузки. Убедитесь, что сервер запущен.</div>`;
  }
}

init();
