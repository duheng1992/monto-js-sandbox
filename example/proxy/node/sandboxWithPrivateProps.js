// ProxySandbox 下划线开头属性不可见示例
import { ProxySandbox } from './dist/index.esm.js';

const globalObj = { _secret: 'hidden', visible: 'shown' };
const sb = new ProxySandbox({
  rootElm: globalObj
});

const scriptText = `
  console.log('沙盒内Object.keys:', Object.keys(this));
  console.log('沙盒内_secret in window:', '_secret' in this);
  console.log('沙盒内visible in window:', 'visible' in this);
`;
sb.execScript(scriptText);
console.log('父容器中的_secret:', globalObj._secret); // hidden
sb.destroy(); 