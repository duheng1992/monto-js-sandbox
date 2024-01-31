import { isObjectNotFunction } from './utils';

interface OPTIONS {
  // 要代理的对象
  rootElm?: HTMLElement | Document;
  scriptText?: string;
  interceptFunction?: Function;
  interceptEval?: Function;
}

class ProxySandbox {
  $options: OPTIONS;
  $root: object;
  $proxy: object | null = null;

  constructor(options: OPTIONS) {
    // 获取 globalThis
    const global = <unknown>Function('return this')();
    if (!global) {
      throw new Error('opening proxy sandbox needs the supporting of BROWSER or Node.js ！');
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
      get: (target, prop) => {
        // 避免 globalThis.globalThis 和 window.window 访问的情况
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
            if (this.$options.interceptEval) return code => Function(`return ${code}`).bind(this.$proxy);
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