// QuickJSSandbox 基础用法
import QuickJSSandbox from '../../src/wasm';

(async () => {
  const sandbox = new QuickJSSandbox();
  const result = await sandbox.execScript('console.log("hello from sandbox"); 1 + 2 + 3;');
  console.log('沙盒返回值:', result); // 6
  sandbox.destory();
})(); 