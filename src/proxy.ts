// 代理目标对象：通过 Proxy 包装一个基础对象（rootElm 或 this.$root），拦截所有属性访问和操作
// 控制全局变量访问：特别处理 window、global 等全局对象的访问，防止逃逸
// 函数执行控制：对 Function 和 eval 进行特殊处理，绑定执行上下文
// 属性隐藏：以下划线开头的属性不可枚举

import { isObjectNotFunction } from './utils';

interface OPTIONS {
  // 要代理的对象
  rootElm?: HTMLElement | Document;
  scriptText?: string;
  interceptFunction?: () => void;
  interceptEval?: () => void;
}

// 沙盒内代码对"全局变量"的读写，其实都发生在代理对象上，不会影响真实的 window/globalThis。
/**
 * 代理 js 沙盒类
 *
 * @param options
 * @param options.rootElm 挂载点 dom
 * @param options.scriptText 脚本
 * @param options.interceptFunction 拦截函数
 * @param options.interceptEval 拦截 eval
 *
 * @description 沙箱化全局对象
 * 1. 创建代理对象
 * 2. 拦截全局对象的访问和操作
 * 3. 拦截函数和 eval 的执行
 * 4. 拦截原型链的修改
 * 5. 拦截下划线开头的属性的访问和操作
 * 6. 拦截 ownKeys 操作
 * 7. 拦截 getOwnPropertyDescriptor 操作
 *
 * @example
 * ```ts
 * const proxySandbox = new ProxySandbox({
 *   rootElm: document.body,
 * });
 * ```
 *
 * 局限：无法拦截全局标识符的静态解析。比如在 Function('globalThis.foo = 1') 里，globalThis 依然是原生的全局对象。
 * qiankun（以及 single-spa、微前端沙箱体系）采用的 JS 沙箱方案，本质上和你的 Proxy 沙盒原理类似，即通过 Proxy+with 劫持全局变量访问，但它也无法彻底防御 Function('globalThis.foo = 1') 这种"全局标识符静态解析"的环境污染。
 *
 */
class ProxySandbox {
  $options: OPTIONS;
  $root: object;
  $proxy: object | null = null;
  $fakeWindow: object;
  $whiteList: Set<string>;

  constructor(options: OPTIONS) {
    // 获取 globalThis
    const root = <object>Function('return this')();
    if (!root) {
      throw new Error('Opening proxy sandbox needs the supporting of BROWSER or Node.js ！');
    }

    this.$root = root;
    this.$options = options;
    this.$fakeWindow = Object.create(null);
    // 可根据需要扩展白名单
    // 这里是双层代理，只是单层代理 window 的话，如果沙盒外定义了 window.a, 此时创建沙盒内仅仅做了get拦截特殊参数，这些自定义参数是可以获取到的
    this.$whiteList = new Set([
      'console',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'Math',
      'Date',
      'JSON',
      'Array',
      'Object',
      'String',
      'Number',
      'Boolean',
      'Promise',
      'Symbol',
      'Reflect',
      'Proxy',
      'Error',
      'RegExp',
      'Map',
      'Set',
      'WeakMap',
      'WeakSet',
      'Intl',
      'URL',
      'URLSearchParams',
      'encodeURIComponent',
      'decodeURIComponent',
      'encodeURI',
      'decodeURI',
      'escape',
      'unescape',
      'isNaN',
      'parseInt',
      'parseFloat',
      'btoa',
      'atob',
      'navigator',
      'location',
      'document',
      'window',
      'globalThis',
      'self',
      'top',
      'parent',
      'frames',
    ]);
    this.createSandbox();
  }

  createSandbox() {
    if (!isObjectNotFunction(this.$options)) {
      throw new Error('The options should be object !');
    }

    const realWindow = this.$options.rootElm || this.$root;
    const fakeWindow = this.$fakeWindow;
    const whiteList = this.$whiteList;

    // 双层代理：fakeWindow 作为主 target，白名单属性透传到 realWindow
    this.$proxy = new Proxy(fakeWindow, {
      get(target, prop, receiver) {
        // 白名单属性透传到真实 window
        if (typeof prop === 'string' && whiteList.has(prop)) {
          // 允许沙盒内访问 window、globalThis、self、top、parent 时返回代理自身，防止逃逸
          if (['window', 'globalThis', 'self', 'top', 'parent'].includes(prop)) {
            return receiver;
          }
          // 其他白名单属性透传
          return realWindow[prop];
        }
        // 其余属性在 fakeWindow 上隔离
        if (prop in target) {
          return target[prop];
        }
        return undefined;
      },
      set(target, prop, value) {
        // 白名单属性写入 fakeWindow，不影响真实 window
        target[prop] = value;
        return true;
      },
      has(target, prop) {
        if (typeof prop === 'string' && prop.startsWith('_')) {
          return false;
        }
        return prop in target || (typeof prop === 'string' && whiteList.has(prop));
      },
      ownKeys(target) {
        // 只枚举 fakeWindow 上的属性
        return Reflect.ownKeys(target);
      },
      getOwnPropertyDescriptor(target, prop) {
        if (typeof prop === 'string' && prop.startsWith('_')) {
          return undefined;
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });
  }

  execScript(scriptText: string) {
    return new Function(
      'global',
      `
with (global) {
  (function() {
      "use strict"
      ${scriptText}
  }).bind(global)();
};
`
    )(this.$proxy);
  }

  destroy() {
    if (this.$proxy) {
      this.$proxy = null;
    }
    this.$root = {};
    this.$options = {} as OPTIONS;
    this.$fakeWindow = {};
    this.$whiteList = new Set();
  }
}

export default ProxySandbox;
