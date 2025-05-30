// QuickJSSandbox 基础用法
import { QuickJSSandbox } from './dist/index.esm.js';

globalThis.a = 222;

(async () => {
  const sandbox = new QuickJSSandbox();
  const result = await sandbox.execScript('globalThis.a = 111; console.log("a: ", globalThis.a); 1 + 2 + 3;');
  console.log('沙盒返回值:', result); // 6
  console.log('外部容器变量a: ', globalThis.a);
  sandbox.destory();
})();