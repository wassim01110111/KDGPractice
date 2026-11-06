import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runnerJar = path.join(root, 'content/java/ExerciseRunner.jar');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'acs-java-smoke-'));
const results = [];
const require = createRequire(import.meta.url);
const Core = require(path.join(root, 'core.js'));

function writeJson(file, value) { fs.writeFileSync(file, JSON.stringify(value), 'utf8'); }
function invoke(operation, sources, config, classesDir, tag) {
  const base = path.join(temp, tag);
  fs.mkdirSync(base, { recursive: true });
  const sourcesFile = path.join(base, 'sources.json');
  const configFile = path.join(base, 'config.json');
  const resultFile = path.join(base, 'result.json');
  writeJson(sourcesFile, { sources: sources || [] });
  writeJson(configFile, config || {});
  execFileSync('java', [
    '-cp', runnerJar,
    'learning.java.ExerciseRunner',
    operation,
    operation === 'compile' ? sourcesFile : '-',
    configFile,
    resultFile,
    classesDir,
  ], { stdio: 'pipe' });
  return JSON.parse(fs.readFileSync(resultFile, 'utf8'));
}
function test(name, fn) {
  try { fn(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); }
}

try {
  assert.ok(fs.existsSync(runnerJar), 'Runner JAR has not been built');
  const classes = path.join(temp, 'classes');

  // Basic Java compilation, Scanner input, isolated stdout/stderr and two distinct inputs.
  const scannerSource = `import java.util.Scanner;
public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    int age = scanner.nextInt();
    System.out.println("Age: " + age);
    System.err.println("TRACE");
  }
}`;
  const scannerChecks = [
    { id: 'age-25', type: 'stdout', input: '25\n', expected: 'Age: 25\n', matcher: 'exact', points: 1 },
    { id: 'age-41', type: 'stdout', input: '41\n', expected: 'Age:\\s*41', matcher: 'regex', points: 1 },
    { id: 'stderr-trace', type: 'stderr', input: '18\n', expected: 'TRACE', matcher: 'contains', points: 1 },
  ];
  const compileScanner = invoke('compile', [{ name: 'Main.java', code: scannerSource }], { mainClass: 'Main' }, classes, 'scanner-compile');
  test('basic compilation', () => assert.equal(compileScanner.compiled, true));
  test('Scanner/System.in with different inputs and stdout/stderr capture', () => {
    const result = invoke('check', null, { mainClass: 'Main', checks: scannerChecks }, classes, 'scanner-check');
    assert.equal(result.success, true);
    assert.deepEqual(result.checks.map((check) => check.passed), [true, true, true]);
    assert.equal(result.checks[0].actual, 'Age: 25\n');
    assert.equal(result.stderr, 'TRACE\n');
    assert.equal(result.score.earned, 3);
  });
  test('manual run result captures stdout and stderr', () => {
    const result = invoke('run', null, { mainClass: 'Main', stdin: '33\n' }, classes, 'scanner-run');
    assert.equal(result.status, 'completed');
    assert.equal(result.stdout, 'Age: 33\n');
    assert.equal(result.stderr, 'TRACE\n');
  });

  // Compiler diagnostics include useful source coordinates.
  const invalid = invoke('compile', [{ name: 'Broken.java', code: 'public class Broken {\n  public void run() { int x = 1 }\n}' }], {}, path.join(temp, 'broken-classes'), 'invalid-compile');
  test('compilation errors provide file, line and column diagnostics', () => {
    assert.equal(invalid.compiled, false);
    assert.ok(invalid.diagnostics.length > 0);
    assert.equal(invalid.diagnostics[0].file, 'Broken.java');
    assert.ok(invalid.diagnostics[0].line >= 2);
    assert.ok(invalid.diagnostics[0].column >= 1);
  });

  // Multi-source reflection testing: class, fields, access, constructor, inheritance, instance and method return.
  const reflectionSources = [
    { name: 'Creature.java', code: 'public class Creature { }' },
    { name: 'Named.java', code: 'public interface Named { String getName(); }' },
    { name: 'Animal.java', code: `public class Animal extends Creature implements Named {
  private String name;
  public Animal(String name) { this.name = name; }
  public String getName() { return name; }
  public String eat() { return name + " is eating with joy"; }
  public int add(int left, int right) { return left + right; }
}` },
  ];
  const compileReflection = invoke('compile', reflectionSources, {}, classes, 'reflection-compile');
  test('multiple source files compile together', () => assert.equal(compileReflection.compiled, true));
  const reflectionChecks = [
    { id: 'class', type: 'classExists', className: 'Animal', points: 1 },
    { id: 'public-class', type: 'classModifier', className: 'Animal', expected: 'public', points: 1 },
    { id: 'field', type: 'fieldExists', className: 'Animal', fieldName: 'name', expectedType: 'java.lang.String', points: 1 },
    { id: 'private-field', type: 'fieldModifier', className: 'Animal', fieldName: 'name', expected: 'private', points: 1 },
    { id: 'field-value', type: 'fieldValue', className: 'Animal', fieldName: 'name', constructor: { parameterTypes: ['java.lang.String'], args: ['Cat'] }, expected: 'Cat', points: 1 },
    { id: 'constructor', type: 'constructorExists', className: 'Animal', parameterTypes: ['java.lang.String'], points: 1 },
    { id: 'method', type: 'methodExists', className: 'Animal', method: 'eat', parameterTypes: [], points: 1 },
    { id: 'public-method', type: 'methodModifier', className: 'Animal', method: 'eat', parameterTypes: [], expected: 'public', points: 1 },
    { id: 'inheritance', type: 'inheritance', className: 'Animal', superclass: 'Creature', interfaces: ['Named'], points: 1 },
    { id: 'instance-of', type: 'instanceOf', className: 'Animal', constructor: { parameterTypes: ['java.lang.String'], args: ['Dog'] }, expectedType: 'Named', points: 1 },
    { id: 'method-return-regex', type: 'methodReturn', className: 'Animal', constructor: { parameterTypes: ['java.lang.String'], args: ['Cat'] }, method: 'eat', parameterTypes: [], args: [], expected: 'Cat\\s+is\\s+eating', matcher: 'regex', points: 1 },
    { id: 'typed-return', type: 'methodReturn', className: 'Animal', constructor: { parameterTypes: ['java.lang.String'], args: ['Dog'] }, method: 'add', parameterTypes: ['int', 'int'], args: [2, 3], expected: 5, points: 1 },
  ];
  test('reflection checks instantiate objects and verify structure, modifiers, inheritance, types and method returns', () => {
    const result = invoke('check', null, { checks: reflectionChecks }, classes, 'reflection-check');
    assert.equal(result.success, true, JSON.stringify(result.checks.filter((check) => !check.passed)));
    assert.equal(result.score.earned, 12);
  });

  test('modifier checks fail when compiled visibility is wrong', () => {
    const result = invoke('check', null, { checks: [
      { id: 'wrong-modifier', type: 'fieldModifier', className: 'Animal', fieldName: 'name', expected: 'public' },
    ] }, classes, 'wrong-modifier');
    assert.equal(result.success, false);
    assert.equal(result.checks[0].passed, false);
  });
  test('invalid regular expressions fail gracefully', () => {
    const result = invoke('check', null, { checks: [
      { id: 'bad-regex', type: 'methodReturn', className: 'Animal', constructor: { parameterTypes: ['java.lang.String'], args: ['Cat'] }, method: 'eat', parameterTypes: [], args: [], expected: '[', matcher: 'regex' },
    ] }, classes, 'invalid-regex');
    assert.equal(result.checks[0].passed, false);
    assert.match(result.checks[0].feedback, /Invalid regular expression/);
  });

  // Recompile into the same output directory to prove old class files are cleared.
  const first = invoke('compile', [{ name: 'Main.java', code: 'public class Main { public static void main(String[] args) { System.out.println("old"); } }' }], {}, classes, 'repeat-first');
  const second = invoke('compile', [{ name: 'Main.java', code: 'public class Main { public static void main(String[] args) { System.out.println("new"); } }' }], {}, classes, 'repeat-second');
  test('repeated compilations do not reuse stale class files', () => {
    assert.equal(first.compiled, true); assert.equal(second.compiled, true);
    const result = invoke('run', null, { mainClass: 'Main' }, classes, 'repeat-run');
    assert.equal(result.stdout, 'new\n');
  });

  test('cleanup command removes a completed request workspace', () => {
    const requestDir = path.join(temp, 'cleanup-request');
    const cleanupClasses = path.join(requestDir, 'classes');
    const configFile = path.join(requestDir, 'config.json');
    const resultFile = path.join(requestDir, 'result.json');
    fs.mkdirSync(cleanupClasses, { recursive: true });
    fs.writeFileSync(path.join(cleanupClasses, 'Main.class'), 'test');
    fs.writeFileSync(resultFile, '{}');
    writeJson(configFile, {});
    execFileSync('java', [
      '-cp', runnerJar,
      'learning.java.ExerciseRunner',
      'cleanup', '-', configFile, path.join(requestDir, 'cleanup-result.json'), cleanupClasses,
    ], { stdio: 'pipe' });
    assert.equal(fs.existsSync(requestDir), false);
  });

  // The package must be actually registered through the common manifest and valid in Core.
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/manifest.json'), 'utf8'));
  const registryEntry = manifest.packages?.javaPlayground;
  const packageFile = path.join(root, 'content/java-playground-smoke-test.json');
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  test('smoke-test package is registered and accepted by the existing validator', () => {
    assert.ok(registryEntry?.files?.includes('java-playground-smoke-test.json'));
    const errors = Core.validatePackage(pkg, 'content/java-playground-smoke-test.json', {
      seenIds: new Set(), datasetIds: new Set(), schemaVersion: 1,
    });
    assert.deepEqual(errors, []);
    assert.equal(pkg.packageId, 'java-playground-smoke-test');
  });

  const failed = results.filter((item) => !item.passed);
  console.log(JSON.stringify({ passed: results.length - failed.length, total: results.length, tests: results }, null, 2));
  if (failed.length) process.exitCode = 1;
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
