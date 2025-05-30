// QuickJS + WASM 实现 JS 沙盒的思路
// =====================================
// 1. 引入 quickjs-emscripten 或 quickjs-wasm（npm 包）
// 2. 初始化 QuickJS 虚拟机（WASM 实例）
// 3. 提供 eval/run 方法让用户代码在沙盒内执行
// 4. 可选：桥接部分 API（如 console、postMessage）到沙盒
// 5. 支持多实例、资源限制、销毁
import { getQuickJS } from 'quickjs-emscripten';

/**
 * QuickJSSandbox: 基于 QuickJS + WASM 的高安全 JS 沙盒
 * 支持 run(code: string): Promise<any>
 * 适合高安全需求的插件、在线编辑器等场景
 * 
 * 局限：
    不能直接操作主环境对象和 DOM
    性能略低，体积较大
    需要手动桥接 API
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
    this.vm = this.QuickJS.newContext();
    // 桥接 console.log 到主环境
    const vm = this.vm;
    // const qjs = this.QuickJS;
    // 在 QuickJS 沙盒环境中桥接（注入）主环境的 console.log 方法，让沙盒内的 JS 代码可以安全地调用 console.log，并把日志输出到主环境的控制台。
    const consoleObj = vm.newObject();
    const logFn = vm.newFunction('log', (...args: any[]) => {
      // dump 可将 QuickJS 值转为主环境值
      console.log('[沙盒]', ...args.map((arg) => vm.dump(arg)));
    });
    vm.setProp(consoleObj, 'log', logFn);
    vm.setProp(vm.global, 'console', consoleObj);
    // 这里应该加上，不然会内存泄漏
    consoleObj.dispose();
    logFn.dispose();
  }

  /**
   * 在沙盒中运行 JS 代码
   * @param scriptText JS 代码字符串
   * @returns Promise<any> 运行结果
   */
  async execScript(scriptText: string): Promise<any> {
    await this.ready;
    const result = this.vm.evalCode(scriptText);
    if (result.error) {
      const err = this.vm.dump(result.error);
      result.error?.dispose?.(); // 释放 error handle

      // 优先用 err.message，否则用 JSON.stringify 或 String
      let msg = '';
      if (err && typeof err === 'object' && 'message' in err) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      } else {
        try {
          msg = JSON.stringify(err);
        } catch {
          msg = String(err);
        }
      }
      throw new Error('[QuickJSSandbox Error] ' + msg);
    }
    const value = this.vm.dump(result.value);
    result.value.dispose(); // 释放 value handle
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
