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

class ProxySandbox {
  $options: OPTIONS;
  $root: object;
  $proxy: object | null = null;

  constructor(options: OPTIONS) {
    // 获取 globalThis
    const global = <object>Function('return this')();
    if (!global) {
      throw new Error('Opening proxy sandbox needs the supporting of BROWSER or Node.js ！');
    }

    this.$root = global;
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
      get: (target, prop) => {
        // 避免 globalThis.globalThis 和 window.window 访问到原生对象的情况
        switch (prop) {
          case 'window':
          case 'global':
          case 'self':
          case 'globalThis':
            return this.$proxy;

          case 'Function':
            if (this.$options.interceptFunction) return (...args) => Function(...args).bind(this.$proxy);
            break;
          case 'eval':
            if (this.$options.interceptEval) return (code) => Function(`return ${code}`).bind(this.$proxy);
            break;
        }

        return target[prop];
      },

      set: (target, prop, value): boolean => {
        target[prop] = value;
        return true;
      },

      has: (target, prop) => {
        if (prop[0] === '_') {
          return false; // 如果属性名以下划线开头，则该属性不可枚举
        }
        return prop in target; // 否则，按照默认行为执行
      },

      ownKeys: (target) => {
        return Reflect.ownKeys(target).filter((key) => {
          if (typeof key === 'string') return !key.startsWith('_');
          return true;
        });
      },

      getOwnPropertyDescriptor: (target, prop) => {
        if (typeof prop === 'string' && prop[0] === '_') {
          return undefined;
        }
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },
    });
  }

  execScript(scriptText: string) {
    // 接受入参 global，是外部传入的 this.$proxy，并修改 this 指向 global
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
  }
}

export default ProxySandbox;
