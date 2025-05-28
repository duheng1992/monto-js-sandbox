// QuickJSSandbox 隔离性测试
import QuickJSSandbox from '../../src/wasm';

(globalThis as any).foo = '外部foo';

(async () => {
  const sandbox = new QuickJSSandbox();
  await sandbox.run('var foo = "沙盒foo"; console.log("沙盒内 foo:", foo);');
  sandbox.dispose();
  console.log('主环境 foo:', (globalThis as any).foo); // 仍为 '外部foo'
})(); 