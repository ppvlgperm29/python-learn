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

  async function runChallenge(userCode, tests) {
    const py = await load();
    py.globals.set('_ch_code', userCode);
    py.globals.set('_ch_tests', py.toPy(tests));
    const runner = `
import sys, io, json as _json
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
_results = []
try:
    _ns = {}
    exec(_ch_code, _ns)
    _fn = _ns.get('solution')
    if _fn is None:
        raise NameError("Функция solution не найдена")
except Exception as _e:
    for _t in _ch_tests:
        _results.append({"passed": False, "error": str(_e), "expected": repr(_t["expected"])})
else:
    for _t in _ch_tests:
        try:
            _actual = _fn(*_t["args"])
            _passed = _actual == _t["expected"]
            _results.append({"passed": _passed, "actual": repr(_actual), "expected": repr(_t["expected"])})
        except Exception as _e:
            _results.append({"passed": False, "error": str(_e), "expected": repr(_t["expected"])})
print(_json.dumps(_results))
_ch_out = sys.stdout.getvalue()
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`;
    try {
      await py.runPythonAsync(runner);
      const raw = py.globals.get('_ch_out') || '[]';
      return { results: JSON.parse(raw.trim()) };
    } catch (e) {
      return { error: String(e) };
    }
  }

  // Pre-load in background
  load().catch(() => {});

  return { run, load, runChallenge };
})();
