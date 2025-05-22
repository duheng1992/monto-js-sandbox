import { ProxySandbox } from '../../dist/index.esm.js';

const a = 333;
    
const scriptText = 'console.log(a);var a = 111;let b = 222';

const sb = new ProxySandbox({
  rootElm: globalThis
});

sb.execScript(scriptText);

console.log(a)

sb.destroy();