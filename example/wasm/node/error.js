// QuickJSSandbox 异常捕获测试
import { QuickJSSandbox } from './dist/index.esm.js';

(async () => {
  const sandbox = new QuickJSSandbox();
  try {
    await sandbox.execScript('throw new Error("沙盒内异常");');
  } catch (e) {
    console.log('捕获到沙盒异常:', e.message);
  }
  sandbox.destory();
  console.log('主环境未受影响');
})(); 