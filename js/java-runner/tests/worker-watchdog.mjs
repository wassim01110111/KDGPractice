import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { runJavaExercise, stopJavaExecution } = await import(pathToFileURL(path.join(root, 'java.js')));
function pathToFileURL(file) { return new URL(`file://${file}`); }

class FakeWorker {
  static instances = [];
  static hangNext = true;
  constructor() {
    this.terminated = false;
    FakeWorker.instances.push(this);
  }
  postMessage(message) {
    if (this.terminated) return;
    if (message.type === 'INIT') {
      queueMicrotask(() => this.emit({ type: 'READY', requestId: message.requestId, javaVersion: 21 }));
      return;
    }
    if (message.type === 'EXECUTE') {
      queueMicrotask(() => this.emit({ type: 'STATUS', status: 'COMPILING', requestId: message.requestId }));
      setTimeout(() => {
        if (this.terminated) return;
        this.emit({ type: 'STATUS', status: 'RUNNING', requestId: message.requestId });
        if (FakeWorker.hangNext) {
          FakeWorker.hangNext = false;
          return;
        }
        this.emit({ type: 'RESULT', requestId: message.requestId, result: { success: true, compiled: true, status: 'completed', stdout: 'ok\n', stderr: '', exitCode: 0 } });
      }, 15);
    }
  }
  emit(data) { this.onmessage?.({ data }); }
  terminate() { this.terminated = true; }
}

globalThis.Worker = FakeWorker;

const exercise = { java: { sourceFile: 'Main.java', mainClass: 'Main', timeoutMs: 1000 } };
const firstWorkerTask = runJavaExercise({ exercise, source: 'public class Main {}' });
await assert.rejects(firstWorkerTask, (error) => error.code === 'JAVA_TIMEOUT');
assert.equal(FakeWorker.instances[0].terminated, true, 'watchdog did not terminate the timed-out worker');

const second = await runJavaExercise({ exercise, source: 'public class Main {}' });
assert.equal(second.success, true, 'a new worker did not run after timeout');
assert.equal(FakeWorker.instances.length, 2, 'worker was not recreated after timeout');

// Verify Stop uses terminate(), rather than relying on a cancellation message.
FakeWorker.hangNext = true;
const thirdTask = runJavaExercise({ exercise, source: 'public class Main {}' });
await new Promise((resolve) => setTimeout(resolve, 50));
const thirdWorker = FakeWorker.instances.at(-1);
stopJavaExecution('Stopped in watchdog test.');
await assert.rejects(thirdTask, (error) => error.code === 'JAVA_STOPPED');
assert.equal(thirdWorker.terminated, true, 'Stop did not terminate the worker');

console.log(JSON.stringify({ passed: 3, total: 3, tests: [
  'execution watchdog rejects an overlong run',
  'timed-out workers are terminated and recreated on the next run',
  'Stop immediately terminates the worker',
] }, null, 2));
