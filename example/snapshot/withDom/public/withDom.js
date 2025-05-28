// 快照沙盒案例：DOM 属性还原（需在浏览器环境下运行）
import { SnapshotSandbox } from '/dist/index.esm.js';

const globalObj = window;
const sb = new SnapshotSandbox({ rootElm: globalObj });

document.title = '原始标题';
const scriptText = `
  document.title = '沙盒标题';
  window.customProp = 'sandbox';
  console.log('沙盒内 document.title:', document.title);
  console.log('沙盒内 window.customProp:', window.customProp);
`;
sb.execScript(scriptText);
console.log('父容器中的 document.title:', document.title);
console.log('父容器中的 window.customProp:', window.customProp);
sb.destroy();
console.log('（局限）销毁后 document.title 被污染了:', document.title);
console.log('销毁后 window.customProp:', window.customProp); 