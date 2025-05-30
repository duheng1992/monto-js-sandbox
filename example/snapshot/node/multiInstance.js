// 快照沙盒案例：多实例并发
import { SnapshotSandbox } from './dist/index.esm.js';

const globalObj = { foo: '原始foo', bar: 1 };
const sb1 = new SnapshotSandbox({ rootElm: globalObj });
const sb2 = new SnapshotSandbox({ rootElm: globalObj });

sb1.execScript('foo = "sb1"; bar = 11;');
console.log('sb1 执行后:', globalObj);
sb2.execScript('foo = "sb2"; bar = 22;');
console.log('sb2 执行后:', globalObj);
sb2.destroy();
console.log('销毁 sb2 后:', globalObj);
sb1.destroy();
console.log('销毁 sb1 后:', globalObj); 