// 快照沙盒案例：属性删除还原
import { SnapshotSandbox } from './dist/index.esm.js';

const globalObj = { foo: '原始foo', bar: 42 };
const sb = new SnapshotSandbox({ rootElm: globalObj });

const scriptText = `
  delete foo;
  console.log('沙盒内 foo:', typeof foo);
`;
sb.execScript(scriptText);
console.log('父容器中的 foo:', globalObj.foo); // undefined
sb.destroy();
console.log('销毁后 foo:', globalObj.foo); // '原始foo' 