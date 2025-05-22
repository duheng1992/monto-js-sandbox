import { SnapshotSandbox } from '../../dist/index.esm.js';

const obj = {
  a: 123,
  b: function() { console.log(123) },
  c: { d: 456 },
  d: "hello SnapshotSandbox !"
};
    
console.log('沙盒修改全局变量前：')
const scriptText = 'console.log(this); this.a = "hello"; this.e = function() { console.log(789) }; delete this.b;';

const sb = new SnapshotSandbox({
  rootElm: obj
});

sb.execScript(scriptText);

console.log('沙盒修改全局变量后：')
console.log(obj)

sb.destroy();

console.log('沙盒销毁后：')
console.log(obj)