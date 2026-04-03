const PyodideRunner = (() => {
  let pyodide = null;
  let loading = false;
  let loadCallbacks = [];

  async function load() {
    if (pyodide) return pyodide;
    if (loading) {
      return new Promise(resolve => loadCallbacks.push(resolve));
    }
    loading = true;
    pyodide = await loadPyodide();
    loadCallbacks.forEach(cb => cb(pyodide));
    loadCallbacks = [];
    return pyodide;
  }

  async function run(code) {
    const py = await load();
    const wrappedCode = `
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
_exit_code = 0
try:
${code.split('\n').map(l => '    ' + l).join('\n')}
except Exception as _e:
    sys.stderr.write(str(_e))
    _exit_code = 1
_stdout = sys.stdout.getvalue()
_stderr = sys.stderr.getvalue()
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`;
    try {
      await py.runPythonAsync(wrappedCode);
      const stdout = py.globals.get('_stdout') || '';
      const stderr = py.globals.get('_stderr') || '';
      const exitCode = py.globals.get('_exit_code') || 0;
      return { stdout, stderr, exitCode };
    } catch (e) {
      return { stdout: '', stderr: String(e), exitCode: 1 };
    }
  }

  // Pre-load in background
  load().catch(() => {});

  return { run, load };
})();
