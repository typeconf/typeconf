import { parentPort, workerData } from 'worker_threads';
import { compile } from "./compile/compile.js";

if (parentPort == null) {
  throw new Error("Must be running as Node Worker");
}

(async () => {
  try {
    await compile(workerData);
    parentPort.postMessage("done");
  } catch (err) {
    parentPort.postMessage(`${err}`);
  }
})();
