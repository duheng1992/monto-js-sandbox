// 在 node 环境下，使用 ProxySandbox 沙箱化全局对象
// 执行 node proxy/nodePlatform.js 即可调试

import { ProxySandbox } from './dist/index.esm.js';

const sb = new ProxySandbox({
  rootElm: globalThis
});
const a = 333;
const scriptText = 'console.log("沙盒中的a: ", a);var a = 111;';
sb.execScript(scriptText);
console.log("父容器中的a: ", a)
sb.destroy();