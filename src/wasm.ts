// QuickJS + WASM 实现 JS 沙盒的思路
// =====================================
// 1. 引入 quickjs-emscripten 或 quickjs-wasm（npm 包）
// 2. 初始化 QuickJS 虚拟机（WASM 实例）
// 3. 提供 eval/run 方法让用户代码在沙盒内执行
// 4. 可选：桥接部分 API（如 console、postMessage）到沙盒
// 5. 支持多实例、资源限制、销毁
//
// 典型用法（伪代码）：
//
// import { getQuickJS } from 'quickjs-emscripten';
//
// async function runSandboxedJS(code: string) {
//   const QuickJS = await getQuickJS();
//   const vm = QuickJS.createVm();
//
//   // 可选：桥接 console.log
//   vm.setProp(vm.global, 'console', vm.newObject());
//   vm.setProp(vm.getProp(vm.global, 'console'), 'log', vm.newFunction('log', (...args) => {
//     console.log('[沙盒]', ...args.map(arg => vm.dump(arg)));
//   }));
//
//   const result = vm.evalCode(code);
//   if (result.error) {
//     throw new Error(vm.dump(result.error));
//   }
//   const value = vm.dump(result.value);
//   vm.dispose();
//   return value;
// }
//
// // 示例：
// runSandboxedJS('console.log("hello"); 1+2').then(console.log); // 输出 3
//
// 注意事项：
// - 沙盒内无法直接访问 window、document、globalThis、DOM、BOM、网络等
// - 只能通过桥接暴露的 API 与主环境通信
// - 性能略低于原生 JS，但安全性极高
// - 适合高安全需求的插件、在线编辑器、低代码等场景
//
// 如需完整实现，可参考 quickjs-emscripten 官方文档和 StackBlitz WebContainer 的设计。

// QuickJS + WASM JS 沙盒完整实现（需安装 quickjs-emscripten）
// npm install quickjs-emscripten

import { getQuickJS } from 'quickjs-emscripten';

/**
 * QuickJSSandbox: 基于 QuickJS + WASM 的高安全 JS 沙盒
 * 支持 run(code: string): Promise<any>
 * 自动桥接 console.log
 * 适合高安全需求的插件、在线编辑器等场景
 */
class QuickJSSandbox {
  private QuickJS: any;
  private vm: any;
  private ready: Promise<void>;

  constructor() {
    this.ready = this.active();
  }

  private async active() {
    this.QuickJS = await getQuickJS();
    this.vm = this.QuickJS.createVm();
    // 桥接 console.log 到主环境
    const vm = this.vm;
    const qjs = this.QuickJS;
    const consoleObj = qjs.newObject();
    const logFn = qjs.newFunction('log', (...args: any[]) => {
      // dump 可将 QuickJS 值转为主环境值
      console.log('[沙盒]', ...args.map((arg) => qjs.dump(arg)));
    });
    qjs.setProp(consoleObj, 'log', logFn);
    qjs.setProp(vm.global, 'console', consoleObj);
  }

  /**
   * 在沙盒中运行 JS 代码
   * @param code JS 代码字符串
   * @returns Promise<any> 运行结果
   */
  async execScript(code: string): Promise<any> {
    await this.ready;
    const result = this.vm.evalCode(code);
    if (result.error) {
      const err = this.QuickJS.dump(result.error);
      throw new Error('[QuickJSSandbox Error] ' + err);
    }
    const value = this.QuickJS.dump(result.value);
    return value;
  }

  /**
   * 释放沙盒资源
   */
  destory() {
    if (this.vm) {
      this.vm.dispose();
      this.vm = null;
    }
    this.QuickJS = null;
  }
}

export default QuickJSSandbox;
