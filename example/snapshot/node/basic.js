// 基础快照沙盒案例：变量污染还原
import { SnapshotSandbox } from './dist/index.esm.js';

const globalObj = { foo: '原始foo' };
const sb = new SnapshotSandbox({ rootElm: globalObj });

const scriptText = `
  foo = '沙盒foo';
  bar = 123;
  console.log('沙盒内 foo:', foo);
  console.log('沙盒内 bar:', bar);
`;
sb.execScript(scriptText);
console.log('父容器中的 foo:', globalObj.foo); // '沙盒foo'
console.log('父容器中的 bar:', globalObj.bar); // 123
sb.destroy();
console.log('销毁后 foo:', globalObj.foo); // '原始foo'
console.log('销毁后 bar:', globalObj.bar); // undefined 