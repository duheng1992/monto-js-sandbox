'use strict';

import vm from 'node:vm';

import { isObjectNotFunction } from './utils';

interface OPTIONS {
  // 要代理的对象
  rootElm?: HTMLElement | Document;
  scriptText?: string;
}

class VMSandbox {
  $options: OPTIONS;
  $root: vm.Context;

  constructor(options: OPTIONS) {
    this.$options = options;
    this.createSandbox();
  }

  createSandbox() {
    if (!isObjectNotFunction(this.$options)) {
      throw new Error('The options should be object !');
    }
    const root = this.$options.rootElm || <object>Function('return this')();
    if (!root) {
      throw new Error('Opening node vm sandbox needs the supporting of BROWSER or Node.js ！');
    }

    this.$root = root;
  }

  execScript(scriptText: string) {
    const script = new vm.Script(scriptText);
    vm.createContext(this.$root);

    const result = script.runInContext(this.$root);
    console.log(result);
  }

  destroy() {}
}

export default VMSandbox;
