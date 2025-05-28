// 快照沙盒案例：数组属性变更还原
import { SnapshotSandbox } from './dist/index.esm.js';

const globalObj = { arr: [1, 2, 3] };
const sb = new SnapshotSandbox({ rootElm: globalObj });

const scriptText = `
  arr.push(4);
  arr[0] = 99;
  console.log('沙盒内 arr:', arr);
`;
sb.execScript(scriptText);
console.log('父容器中的 arr:', globalObj.arr); // [99,2,3,4]
sb.destroy();
console.log('销毁后 arr:', globalObj.arr); // [1,2,3] 