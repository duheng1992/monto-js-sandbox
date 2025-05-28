// WebComponentSandbox 基础使用示例
import { WebComponentSandbox } from '/dist/index.esm.js';

// 在 "use strict" 下，未声明变量赋值会抛 ReferenceError，但如果全局已经有 foo（如 window.foo），则 foo = ... 实际就是 window.foo = ...，会污染全局。
window.foo = '外部foo';

const sb = new WebComponentSandbox({
  tagName: 'my-sandbox-demo',
  template: `<button id="btn">点我</button><div id="msg"></div>`,
  style: `#msg { font-weight: bold; color: green; }`,
  scriptText: `
    "use strict";
    foo = '沙盒foo';
    console.log('沙盒内 foo：', foo);
    btn.onclick = () => {
      msg.textContent = 'Hello from sandbox!';
    };
  `,
  container: document.body,
  exposeGlobals: [] // 不暴露 window/document，保证隔离
});

sb.execScript();
// sb.destroy() //销毁沙盒

console.log('（局限）沙盒与父容器中的 foo 变量污染:', window.foo); // 仍为 '外部foo'