// 本地预览服务管理：npm run local:start | local:stop | local:restart | local:status
// 默认地址 http://127.0.0.1:4323/mind/（base 由 astro.config.mjs 默认给出）
// 可用 --port 换端口，例如 node scripts/local-preview.mjs start --port 4321
import {spawn} from 'node:child_process';
import {existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const portArg = process.argv.findIndex(a => a === '--port');
const port = Number(
  portArg >= 0 ? process.argv[portArg + 1]
  : (process.argv.find(a => a.startsWith('--port='))?.slice(7) ?? 4323)
);
if (!Number.isInteger(port) || port < 1024 || port > 65535) { console.error(`端口不合法：${port}`); process.exit(2); }
const stateDir = new URL('../output/dev/', import.meta.url);
const stateFile = new URL(`local-preview-${port}.json`, stateDir);
const logFile = new URL(`dev-${port}.log`, stateDir);
const url = `http://127.0.0.1:${port}/mind/`;

const readState = () => {
  try { return JSON.parse(readFileSync(stateFile, 'utf8')); } catch { return null; }
};
const isAlive = (pid) => {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
};
const portOwner = () => {
  try {
    const out = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], {encoding: 'utf8'});
    return out.trim().split('\n').filter(Boolean).map(Number)[0] || null;
  } catch { return null; }
};
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const probe = async () => {
  try {
    const res = await fetch(url, {signal: AbortSignal.timeout(4000)});
    return res.status;
  } catch { return null; }
};

async function status() {
  const st = readState();
  const owner = portOwner();
  const code = await probe();
  if (owner) console.log(`运行中  pid=${owner}  ${url}  HTTP ${code ?? '无响应'}`);
  else console.log(`未运行  ${url}${st?.pid && !isAlive(st.pid) ? '（状态文件有残留 pid，可执行 local:start 覆盖）' : ''}`);
  return owner ? 0 : 1;
}

async function stop() {
  const owner = portOwner();
  if (!owner) { console.log('未运行，无需停止'); rmSync(stateFile, {force: true}); return; }
  try { process.kill(owner, 'SIGTERM'); } catch {}
  for (let i = 0; i < 40; i++) { await sleep(250); if (!portOwner()) break; }
  const still = portOwner();
  if (still) { try { process.kill(still, 'SIGKILL'); } catch {} await sleep(300); }
  rmSync(stateFile, {force: true});
  console.log(`已停止 原 pid=${owner}`);
}

async function start() {
  const owner = portOwner();
  if (owner) {
    const code = await probe();
    if (code === 200) { console.log(`已在运行 pid=${owner}  ${url}`); return; }
    console.log(`端口 ${port} 被 pid=${owner} 占用但未正常响应，先停止它`);
    await stop();
  }
  mkdirSync(stateDir, {recursive: true});
  const astroBin = new URL('../node_modules/astro/bin/astro.mjs', import.meta.url);
  if (!existsSync(astroBin)) { console.error('缺少 node_modules/astro/bin/astro.mjs，请先在 mind/ 下执行 npm ci'); process.exit(1); }
  const fd = openSync(logFile, 'w');
  const astroArgs = ['dev', '--host', '127.0.0.1', '--port', String(port)];
  if (process.argv.includes('--force')) astroArgs.push('--force');
  const child = spawn(process.execPath, [fileURLToPath(astroBin), ...astroArgs], {
    cwd: root, detached: true, stdio: ['ignore', fd, fd],
  });
  child.unref();
  writeFileSync(stateFile, JSON.stringify({pid: child.pid, port, url, log: fileURLToPath(logFile), startedAt: new Date().toISOString()}, null, 2));
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    const code = await probe();
    if (code === 200) { console.log(`已启动 pid=${child.pid}\n预览地址 ${url}\n日志 ${fileURLToPath(logFile)}`); return; }
    if (!isAlive(child.pid)) break;
  }
  console.error(`启动失败，请查看日志 ${fileURLToPath(logFile)}`);
  process.exit(1);
}

const action = process.argv[2] || 'status';
if (action === 'start') await start();
else if (action === 'stop') await stop();
else if (action === 'restart') { await stop(); await start(); }
else if (action === 'status') process.exit(await status());
else { console.error('用法：node scripts/local-preview.mjs start|stop|restart|status [--port 4323]'); process.exit(2); }
