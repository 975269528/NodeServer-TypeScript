process.env.NODE_ENV = "development";

import { fileURLToPath } from 'url';
import path, {join} from "path";
import { watch } from "rollup";
import { spawn } from "child_process";
import type { ChildProcess } from "child_process";
import rollupOptions from "./rollup.config";

const mainOpt = rollupOptions(process.env.NODE_ENV);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

let serverProcess: ChildProcess | null = null;
let manualRestart = false;

function startMain(): Promise<void> {
  return new Promise((resolve, reject) => {
    const MainWatcher = watch(mainOpt);
    MainWatcher.on("change", (filename) => {
      // 主进程日志部分
      console.log('文件变更：', filename);
    });
    MainWatcher.on("event", (event) => {
      if (event.code === "END") {
        if (serverProcess) {
          manualRestart = true;
          if (serverProcess.pid) process.kill(serverProcess.pid);
          serverProcess = null;
          startServer();

          setTimeout(() => {
            manualRestart = false;
          }, 5000);
        }

        resolve();
      } else if (event.code === "ERROR") {
        reject(event.error);
      }
    });
  });
}

function startServer() {
  var args = [
    join(__dirname, "../dist/app.js"),
  ];

  serverProcess = spawn('node', args);

  serverProcess.on("close", () => {
    if (!manualRestart) process.exit();
  });

  // 监听标准输出
  serverProcess.stdout?.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  
  // 监听错误输出
  serverProcess.stderr?.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
}

async function init() {
  try {
    await startMain();
    startServer();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

init();
