// ProxySandbox 中 eval 的隔离效果示例
import { ProxySandbox } from './dist/index.esm.js';

const sb = new ProxySandbox({
  rootElm: globalThis,
  interceptEval: true
});

const scriptText = `
  eval('var evalVar = 999; console.log("沙盒内evalVar: ", evalVar)');
  console.log('沙盒内evalVar，严格模式下evalVar不泄露:', typeof evalVar);
`;
sb.execScript(scriptText);
console.log('父容器中的evalVar:', typeof evalVar); // undefined
sb.destroy(); 