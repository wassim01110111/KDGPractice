const assert = require('assert'), C = require('../js/core.js');
const R = (types, rows, names) => ({ fields: types.map((t, i) => ({ name: (names || [])[i] || 'c' + i, dataTypeID: t })), rows });
const O = (x = {}) => ({ orderMatters: false, compareColumnNames: false, columnOrderMatters: true, ...x });
const T = [], t = (n, f) => T.push([n, f]);
t('NULL vs empty vs 0', () => { assert(!C.compare(R([25], [[null]]), R([25], [['']]), O()).ok); assert(!C.compare(R([23], [[null]]), R([23], [[0]]), O()).ok); assert(C.compare(R([25], [[null]]), R([25], [[null]]), O()).ok); });
t('duplicate rows are counted', () => { assert(!C.compare(R([23], [[1], [1]]), R([23], [[1]]), O()).ok); assert(!C.compare(R([23], [[1], [1], [2]]), R([23], [[1], [2], [2]]), O()).ok); });
t('25 vs 25.00 numeric', () => assert(C.compare(R([1700], [['25']]), R([1700], [['25.00']]), O()).ok));
t('non-numeric strings not equated', () => assert(!C.compare(R([25], [['25']]), R([25], [['25.0']]), O()).ok));
t('string vs number not equal', () => assert(!C.compare(R([25], [['25']]), R([23], [[25]]), O()).ok));
t('ordered vs unordered', () => { const a = R([23], [[1], [2]]), b = R([23], [[2], [1]]); assert(C.compare(a, b, O()).ok); assert(!C.compare(a, b, O({ orderMatters: true })).ok); });
t('column names only when required', () => { const a = R([23], [[1]], ['x']), b = R([23], [[1]], ['y']); assert(C.compare(a, b, O()).ok); assert(!C.compare(a, b, O({ compareColumnNames: true })).ok); });
t('column count', () => assert(!C.compare(R([23, 23], [[1, 2]]), R([23], [[1]]), O()).ok));
t('dates compared as values', () => assert(C.compare(R([1082], [[new Date('2020-01-01T00:00:00Z')]]), R([1082], [[new Date('2020-01-01T00:00:00Z')]]), O()).ok));
t('float tolerance', () => assert(C.compare(R([701], [[0.1 + 0.2]]), R([701], [[0.3]]), O({ numericTolerance: 1e-6 })).ok));
const mk = (id, d, ex = true) => ({ id, difficulty: d, examEligible: ex, course: 'sql' });
const pool = []; for (let i = 0; i < 6; i++) pool.push(mk('e' + i, 'Easy'), mk('m' + i, 'Medium')); pool.push(mk('h1', 'Hard'), mk('h2', 'Hard'), mk('x1', 'Extreme'), mk('x2', 'Extreme'));
t('default 5/5/2, no duplicates', () => { const r = C.generateExam(pool, {}); assert(r.ok && r.exercises.length === 12); assert.strictEqual(new Set(r.exercises.map(e => e.id)).size, 12);
  assert.deepStrictEqual(['Easy', 'Medium', 'Hard', 'Extreme'].map(d => r.exercises.filter(e => e.difficulty === d).length), [5, 5, 2, 0]); });
t('Extreme exam questions are optional and selectable', () => {
  const r = C.generateExam(pool, { dist: { Easy: 0, Medium: 0, Hard: 0, Extreme: 1 } });
  assert(r.ok && r.exercises.length === 1 && r.exercises[0].difficulty === 'Extreme');
});
t('Extreme exam shortages are reported without substitution', () => {
  const r = C.generateExam(pool.filter(e => e.difficulty !== 'Extreme'), { dist: { Easy: 0, Medium: 0, Hard: 0, Extreme: 1 } });
  assert(!r.ok);
  assert.deepStrictEqual(r.shortage, { Extreme: { need: 1, have: 0 } });
});
t('shortage, no substitution', () => { const r = C.generateExam(pool.filter(e => e.id !== 'h2'), {}); assert(!r.ok); assert.deepStrictEqual(r.shortage, { Hard: { need: 2, have: 1 } }); });
t('not-exam exercise excluded (GREP)', () => { const p = [...pool, mk('g1', 'Easy', false)];
  const r = C.generateExam(p, {}); assert(r.ok && !r.exercises.some(e => e.id === 'g1')); });
t('least recently attempted preferred', () => { const last = {}; for (let i = 0; i < 5; i++) last['e' + i] = 1000 + i; const r = C.generateExam(pool, {}, last); assert(r.exercises.some(e => e.id === 'e5')); });
t('attempt tracking distinguishes identical exercise IDs by package', () => {
  const p = [{ ...mk('shared', 'Easy'), packageId: 'old-package' }, { ...mk('shared', 'Easy'), packageId: 'new-package' }];
  const last = { [C.exerciseKey(p[0])]: 1000 };
  const r = C.generateExam(p, { dist: { Easy: 1 } }, last, () => 0);
  assert(r.ok && r.exercises[0].packageId === 'new-package');
});
t('same exercise ID is valid in separate packages, duplicate within one is rejected', () => {
  const ex = { id: 'shared', course: 'os', category: 'c', title: 'x', instructions: 'y', difficulty: 'Easy', type: 'mcq-single', examEligible: true, provenance: 'p', contentVersion: 1, options: ['a', 'b'], expected: [0] };
  const ctx = { seenIds: new Set(), datasetIds: new Set(), schemaVersion: 1 };
  const pkg = id => ({ schemaVersion: 1, packageId: id, version: '1', datasets: [], exercises: [ex] });
  assert.strictEqual(C.validatePackage(pkg('first'), 'first.json', ctx).length, 0);
  assert.strictEqual(C.validatePackage(pkg('second'), 'second.json', ctx).length, 0);
  const duplicate = C.validatePackage({ ...pkg('first'), exercises: [ex, ex] }, 'duplicate.json', ctx);
  assert(duplicate.some(e => e.field === 'id' && e.msg.includes('within this package')));
});
t('Extreme is a supported exercise difficulty', () => {
  const ex = { id: 'extreme-1', course: 'os', category: 'c', title: 'x', instructions: 'y', difficulty: 'Extreme', type: 'mcq-single', examEligible: true, provenance: 'p', contentVersion: 1, options: ['a', 'b'], expected: [0] };
  const pkg = { schemaVersion: 1, packageId: 'extreme-package', version: '1', datasets: [], exercises: [ex] };
  assert.deepStrictEqual(C.validatePackage(pkg, 'extreme.json', { seenIds: new Set(), datasetIds: new Set(), schemaVersion: 1 }), []);
});
t('SQL-course multiple-choice exercises validate without query fields', () => {
  const ex = { id: 'sql-mcq-1', course: 'sql', category: 'select', title: 'What does DISTINCT do?', instructions: 'Choose the answer.', difficulty: 'Easy', type: 'mcq-single', examEligible: true, provenance: 'fixture', contentVersion: 1, options: ['Sorts rows', 'Removes duplicates'], expected: [1] };
  const pkg = { schemaVersion: 1, packageId: 'sql-fixture', version: '1', datasets: [], exercises: [ex] };
  assert.deepStrictEqual(C.validatePackage(pkg, 'sql-fixture.json', { seenIds: new Set(), datasetIds: new Set(), schemaVersion: 1 }), []);
  assert.strictEqual(C.gradeOS(ex, [1]), true);
});
t('validator: dup id, bad difficulty, broken dataset, missing ref', () => {
  const base = { id: 'a', course: 'sql', category: 'c', title: 'x', instructions: 'y', difficulty: 'Easy', type: 'sql-query', examEligible: true, provenance: 'p', contentVersion: 1, datasetId: 'nope', orderMatters: false, compareColumnNames: false, columnOrderMatters: true };
  const pkg = { schemaVersion: 1, packageId: 'p', version: '1', datasets: [], exercises: [base, { ...base, difficulty: 'Hard2' }] };
  const e = C.validatePackage(pkg, 'f.json', { seenIds: new Set(), datasetIds: new Set(), schemaVersion: 1 }), f = x => e.some(v => v.field === x);
  assert(f('id') && f('difficulty') && f('datasetId') && f('referenceSolution') && e.every(v => v.file === 'f.json')); });
t('OS grading', () => { assert(C.gradeOS({ type: 'command-text', expected: { accepted: ['ls  -l'], patterns: ['^cd\\s+~$'] } }, ' ls -l ')); assert(C.gradeOS({ type: 'command-text', expected: { patterns: ['^cd\\s+~$'] } }, 'cd   ~'));
  assert(!C.gradeOS({ type: 'mcq-multi', expected: [0, 2] }, [0])); assert(C.gradeOS({ type: 'mcq-multi', expected: [0, 2] }, [2, 0])); });
let bad = 0; for (const [n, f] of T) { try { f(); console.log('PASS', n); } catch (e) { bad++; console.log('FAIL', n, e.message); } }
console.log(`${T.length - bad}/${T.length} passed`); process.exit(bad ? 1 : 0);
