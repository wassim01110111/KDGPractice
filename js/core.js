// Pure logic: comparator, exam generator, validator, OS grading. Works in browser (window.Core) and Node.
(function (root) {
const NUM = new Set([20, 21, 23, 26, 700, 701, 1700]), FLT = new Set([700, 701]);
const DIFF = ['Easy', 'Medium', 'Hard', 'Extreme'];
const SQL_TYPES = ['sql-query'], MCQ_TYPES = ['mcq-single', 'mcq-multi', 'mcq-multiple'], OS_TYPES = [...MCQ_TYPES, 'command-text', 'fill-blank', 'short-answer-self-check'];
const NON_SQL_TYPES = OS_TYPES;
function compatibleSchemaVersion(version, supported) {
  const match = String(version).match(/^(\d+)(?:\.0+)*$/);
  return Boolean(match && Number(match[1]) === supported);
}

function normNum(v) { let s = String(v).trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) { if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, ''); if (s === '-0') s = '0'; }
  return s; }
function cellKey(v, oid, tol) {
  if (v === null || v === undefined) return 'N';
  if (v instanceof Date) return 'd:' + v.getTime();
  if (NUM.has(oid)) { if (tol && FLT.has(oid)) return 'f:' + (Math.round(Number(v) / tol) * tol).toPrecision(10); return 'n:' + normNum(v); }
  if (typeof v === 'object') return 'j:' + JSON.stringify(v);
  return 's:' + String(v);
}
const show = v => v === null || v === undefined ? 'NULL' : v instanceof Date ? v.toISOString() : typeof v === 'object' ? JSON.stringify(v) : String(v);

// result = { fields:[{name,dataTypeID}], rows:[[...]] }
function compare(stu, ref, o = {}) {
  const nS = stu.fields.length, nR = ref.fields.length;
  if (nS !== nR) return { ok: false, reason: `Column count differs: yours ${nS}, expected ${nR}.`, missing: [], extra: [] };
  if (o.compareColumnNames) { const a = stu.fields.map(f => f.name.toLowerCase()), b = ref.fields.map(f => f.name.toLowerCase());
    const same = o.columnOrderMatters ? a.join() === b.join() : [...a].sort().join() === [...b].sort().join();
    if (!same) return { ok: false, reason: `Column names differ: yours (${a.join(', ')}), expected (${b.join(', ')}).`, missing: [], extra: [] }; }
  const keyRows = r => r.rows.map(row => { let cells = row.map((v, i) => cellKey(v, r.fields[i].dataTypeID, o.numericTolerance));
    if (!o.columnOrderMatters) cells = cells.slice().sort(); return cells.join('\u0001'); });
  const kS = keyRows(stu), kR = keyRows(ref), disp = (r, i) => r.rows[i].map(show).join(' | ');
  if (o.orderMatters) { const n = Math.max(kS.length, kR.length);
    for (let i = 0; i < n; i++) if (kS[i] !== kR[i]) return { ok: false, reason: kS.length !== kR.length ? `Row count differs: yours ${kS.length}, expected ${kR.length}.` : `Rows differ in order or value at position ${i + 1}.`,
      missing: kR.map((k, j) => k !== kS[j] ? disp(ref, j) : null).filter(Boolean).slice(0, 20), extra: kS.map((k, j) => k !== kR[j] ? disp(stu, j) : null).filter(Boolean).slice(0, 20) };
    return { ok: true }; }
  const cnt = new Map(); kR.forEach(k => cnt.set(k, (cnt.get(k) || 0) + 1));
  const extra = []; kS.forEach((k, i) => { const c = cnt.get(k) || 0; if (c > 0) cnt.set(k, c - 1); else extra.push(disp(stu, i)); });
  const missing = []; kR.forEach((k, i) => { const c = cnt.get(k) || 0; if (c > 0) { cnt.set(k, c - 1); missing.push(disp(ref, i)); } });
  if (!missing.length && !extra.length) return { ok: true };
  return { ok: false, reason: 'Result rows differ.', missing: missing.slice(0, 20), extra: extra.slice(0, 20) };
}

function shuffle(a, rnd = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function exerciseKey(ex, packageId = ex.packageId) { return packageId ? JSON.stringify([packageId, ex.id]) : ex.id; }
// lastAttempt: { exerciseKey: ms }
function eligible(ex) { return ex.examEligible === true; }
function generateExam(pool, cfg, lastAttempt = {}, rnd = Math.random) {
  const dist = cfg.dist || { Easy: 5, Medium: 5, Hard: 2, Extreme: 0 };
  const base = pool.filter(e => eligible(e) && (!cfg.course || e.course === cfg.course));
  const shortage = {}, picked = [];
  for (const d of DIFF) { const need = dist[d] || 0; if (!need) continue;
    const have = base.filter(e => e.difficulty === d);
    if (have.length < need) shortage[d] = { need, have: have.length };
    else picked.push(...shuffle(have, rnd).sort((a, b) => (lastAttempt[exerciseKey(a)] || 0) - (lastAttempt[exerciseKey(b)] || 0)).slice(0, need)); }
  if (Object.keys(shortage).length) return { ok: false, shortage };
  return { ok: true, exercises: picked };
}

function validatePackage(pkg, file, ctx) { // ctx: { seenIds:Set, datasetIds:Set, schemaVersion }
  const errs = [], E = (id, field, msg) => errs.push({ file, id: id || '(package)', field, msg });
  if (!pkg || typeof pkg !== 'object') { E(null, '$', 'Not a JSON object'); return errs; }
  if (!compatibleSchemaVersion(pkg.schemaVersion, ctx.schemaVersion)) E(null, 'schemaVersion', `Incompatible schema version ${pkg.schemaVersion}; supported: ${ctx.schemaVersion}`);
  for (const f of ['packageId', 'version']) if (!pkg[f]) E(null, f, 'Missing required field');
  const dsIds = new Set(ctx.datasetIds);
  (pkg.datasets || []).forEach(d => { if (!d.id || !d.version || !d.sql) E(d.id, 'datasets[]', 'Dataset needs id, version, sql'); else if (dsIds.has(d.id)) E(d.id, 'id', 'Duplicate dataset ID'); else dsIds.add(d.id); });
  const req = ['id', 'course', 'category', 'title', 'instructions', 'difficulty', 'type', 'examEligible', 'provenance', 'contentVersion'];
  for (const ex of pkg.exercises || []) { const id = ex.id;
    req.forEach(f => { if (ex[f] === undefined || ex[f] === '') E(id, f, 'Missing required field'); });
    if (id) { const key = exerciseKey(ex, pkg.packageId); if (ctx.seenIds.has(key)) E(id, 'id', 'Duplicate exercise ID within this package'); ctx.seenIds.add(key); }
    if (ex.difficulty && !DIFF.includes(ex.difficulty)) E(id, 'difficulty', `Must be one of ${DIFF.join(', ')}`);
    if (typeof ex.course !== 'string' || !ex.course.trim()) E(id, 'course', 'Must be a non-empty course name');
    if (ex.type === 'sql-query') {
      if (ex.course !== 'sql') E(id, 'type', 'sql-query exercises must use course sql');
      if (!ex.datasetId) E(id, 'datasetId', 'Missing datasetId'); else if (!dsIds.has(ex.datasetId)) E(id, 'datasetId', `Unknown dataset "${ex.datasetId}"`);
      if (!ex.referenceSolution) E(id, 'referenceSolution', 'Missing reference solution');
      ['orderMatters', 'compareColumnNames', 'columnOrderMatters'].forEach(f => { if (typeof ex[f] !== 'boolean') E(id, f, 'Must be true or false'); });
    } else {
      if (!NON_SQL_TYPES.includes(ex.type)) E(id, 'type', `${String(ex.course || 'Course')} type must be one of ${NON_SQL_TYPES.join(', ')}`);
      ['datasetId', 'referenceSolution', 'orderMatters', 'compareColumnNames', 'columnOrderMatters', 'numericTolerance', 'allowedStatementKinds'].forEach(f => { if (ex[f] !== undefined) E(id, f, 'SQL-query-only field on a non-query exercise'); });
      const x = ex.expected;
      if (x === undefined) E(id, 'expected', 'Missing expected');
      else if (MCQ_TYPES.includes(ex.type)) { if (!Array.isArray(ex.options) || ex.options.length < 2) E(id, 'options', 'Need at least 2 options');
        else if (!Array.isArray(x) || !x.length || x.some(i => !Number.isInteger(i) || i < 0 || i >= ex.options.length)) E(id, 'expected', 'Must be array of valid option indexes');
        else if (ex.type === 'mcq-single' && x.length !== 1) E(id, 'expected', 'mcq-single needs exactly one index'); }
      else if (ex.type === 'command-text' && !((x.accepted && x.accepted.length) || (x.patterns && x.patterns.length))) E(id, 'expected', 'Need accepted[] and/or patterns[]');
      else if (ex.type === 'fill-blank' && !(Array.isArray(x.blanks) && x.blanks.length)) E(id, 'expected', 'Need blanks: [[accepted,...],...]');
      else if (ex.type === 'short-answer-self-check' && typeof x !== 'string') E(id, 'expected', 'Must be a model-answer string');
    }
  }
  return errs;
}

const norm = s => String(s).trim().replace(/\s+/g, ' ');
function similarAnswer(a, b) {
  const left = norm(a).toLowerCase(), right = norm(b).toLowerCase();
  if (Math.max(left.length, right.length) < 4) return false;
  let prev = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i++) {
    const curr = [i];
    for (let j = 1; j <= right.length; j++)
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    prev = curr;
  }
  return 1 - prev[right.length] / Math.max(left.length, right.length) >= 0.8;
}
function hasSimilarOSAnswer(ex, answer) {
  if (ex.type === 'command-text')
    return typeof answer === 'string' && (ex.expected.accepted || []).some(expected => similarAnswer(answer, expected));
  if (ex.type === 'fill-blank' && Array.isArray(answer))
    return ex.expected.blanks.some((accepted, i) =>
      typeof answer[i] === 'string' && !accepted.some(expected => norm(answer[i]) === norm(expected)) &&
      accepted.some(expected => similarAnswer(answer[i], expected)));
  return false;
}
// returns true / false / null (null = not auto-gradable)
function gradeOS(ex, a) {
  const x = ex.expected;
  switch (ex.type) {
    case 'mcq-single': case 'mcq-multi': case 'mcq-multiple': { const g = (a || []).slice().sort().join(), e = x.slice().sort().join(); return g === e; }
    case 'command-text': { if (!a || !norm(a)) return false; const n = norm(a);
      return (x.accepted || []).some(c => norm(c) === n) || (x.patterns || []).some(p => new RegExp(p).test(n)); }
    case 'fill-blank': return x.blanks.every((acc, i) => a && a[i] !== undefined && acc.some(c => norm(c) === norm(a[i])));
    default: return null;
  }
}
const api = { compare, generateExam, validatePackage, gradeOS, hasSimilarOSAnswer, eligible, exerciseKey, cellKey, normNum, shuffle, DIFF, SQL_TYPES, MCQ_TYPES, OS_TYPES };
if (typeof module !== 'undefined') module.exports = api; else root.Core = api;
})(typeof window !== 'undefined' ? window : globalThis);
