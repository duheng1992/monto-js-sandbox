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

// 沙盒内代码对“全局变量”的读写，其实都发生在代理对象上，不会影响真实的 window/globalThis。
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
 * qiankun（以及 single-spa、微前端沙箱体系）采用的 JS 沙箱方案，本质上和你的 Proxy 沙盒原理类似，即通过 Proxy+with 劫持全局变量访问，但它也无法彻底防御 Function('globalThis.foo = 1') 这种“全局标识符静态解析”的环境污染。
 *
 */
class ProxySandbox {
  $options: OPTIONS;
  $root: object;
  $proxy: object | null = null;

  constructor(options: OPTIONS) {
    // 获取 globalThis
    const root = <object>Function('return this')();
    if (!root) {
      throw new Error('Opening proxy sandbox needs the supporting of BROWSER or Node.js ！');
    }

    this.$root = root;
    this.$options = options;
    this.createSandbox();
  }

  createSandbox() {
    if (!isObjectNotFunction(this.$options)) {
      throw new Error('The options should be object !');
    }

    const { rootElm } = this.$options;
    this.$proxy = new Proxy(rootElm || this.$root, {
      // target: 表示被代理的原对象
      // prop：要获取的对象上的属性，理论上 target[prop] 就是当前对象值
      get: (target, prop, receiver) => {
        // 避免 globalThis.globalThis 和 window.window 访问到原生对象的情况
        if (
          prop === 'window' ||
          prop === 'global' ||
          prop === 'self' ||
          prop === 'globalThis' ||
          prop === 'top' ||
          prop === 'parent'
        ) {
          return receiver;
        }

        if (prop === 'frames') {
          return undefined;
        }

        // 防止沙盒内代码访问/修改原型链
        if (prop === '__proto__' || prop === 'constructor' || prop === 'prototype') {
          return undefined;
        }

        // Function/eval 拦截
        // 它们都能动态执行字符串代码，并且默认是在全局作用域下执行，极易突破沙盒的作用域隔离，造成沙盒逃逸和安全隐患。
        // 如果沙盒内代码用 Function 或 eval，它们默认不会被 with 作用域影响，依然能访问到真实的全局对象。
        if (prop === 'Function' && this.$options.interceptFunction) {
          return (...args: any[]) => Function(...args).bind(receiver);
        }
        if (prop === 'eval' && this.$options.interceptEval) {
          return (code: string) => Function(`"use strict"; return (function(){ ${code} })()`).bind(receiver)();
        }

        // 其余属性正常代理
        return Reflect.get(target, prop, receiver);
      },

      // 原型链是 JavaScript 对象属性查找和继承的基础，一旦被恶意或无意修改，可能导致全局污染、沙盒逃逸、甚至安全漏洞。
      // 比如： this.__proto__.danger = window.realWindow;
      set: (target, prop, value, receiver): boolean => {
        // 防止沙盒内代码修改原型链
        if (prop === '__proto__' || prop === 'constructor' || prop === 'prototype') {
          return false;
        }
        return Reflect.set(target, prop, value, receiver);
      },

      // 用来拦截 in 操作符（比如 prop in obj）和某些反射操作。
      has: (target, prop) => {
        if (typeof prop === 'string' && prop.startsWith('_')) {
          return false;
        }
        return prop in target;
      },

      //  隐藏下划线开头的属性
      // Object.keys(obj)、for...in、Object.getOwnPropertyNames(obj)、Object.getOwnPropertyDescriptors 都拿不到下划线开头的属性。
      ownKeys: (target) => {
        return Reflect.ownKeys(target).filter((key) => {
          if (typeof key === 'string') return !key.startsWith('_');
          return true;
        });
      },

      // 配合 has/ownKeys 实现“伪私有”属性
      getOwnPropertyDescriptor: (target, prop) => {
        if (typeof prop === 'string' && prop.startsWith('_')) {
          return undefined;
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });
  }

  execScript(scriptText: string) {
    // 接受入参 global，是外部传入的 this.$proxy，并修改 this 指向 global
    // 在 execScript 方法中，利用 with (global) 把所有变量访问都“劫持”到代理对象上。
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
  }
}

export default ProxySandbox;
