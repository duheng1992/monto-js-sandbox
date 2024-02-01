import { VMSandbox } from '../../dist/index.esm.js';

const obj = {
  a: 123,
  b: function() { console.log(123) },
  c: { d: 456 },
  d: "hello VMSandbox !"
};

console.log('沙盒修改全局变量前：')
console.log(obj)

const scriptText = 'console.log(this);console.log(globalThis); var x = 7;';

const sb = new VMSandbox({
  rootElm: obj
});

sb.execScript(scriptText);

console.log('沙盒修改全局变量后：')
console.log(obj)

sb.destroy();

console.log('沙盒销毁后：')
console.log(obj)
