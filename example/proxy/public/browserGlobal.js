// 浏览器环境下 ProxySandbox 使用示例
// 在 HTML 文件中通过 <script type="module" src="browserGlobal.js"></script> 引入

import { ProxySandbox } from '/dist/index.esm.js';

const sb = new ProxySandbox({
  rootElm: window
});

window.foo = '外部foo';
const scriptText = `
  console.log('沙盒中的window.foo:', window.foo); // undefined
  window.foo = '沙盒foo';
  var bar = 123;
  console.log('沙盒中的bar:', bar); // 123
`;
sb.execScript(scriptText);
console.log('父容器中的window.foo:', window.foo); // 外部foo
// bar 在外部不可见
console.log('父容器中的bar:', typeof bar); // undefined
sb.destroy(); 