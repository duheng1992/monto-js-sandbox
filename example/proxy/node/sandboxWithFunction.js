// ProxySandbox 中 Function 构造器的隔离效果示例
import { ProxySandbox } from './dist/index.esm.js';

const sb = new ProxySandbox({
  rootElm: {},
  interceptFunction: true
});

const scriptText = `
  const fn = Function('globalThis.sandboxFnVar = 888;');
  fn();
  console.log('沙盒内 sandboxFnVar:', globalThis.sandboxFnVar);
`;
sb.execScript(scriptText);
console.log('局限性：沙盒内 Function 内 globalThis、window 是主子共享的');
console.log('父容器中的 globalThis.sandboxFnVar:', globalThis.sandboxFnVar); // undefined
sb.destroy(); 