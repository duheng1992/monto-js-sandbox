import { isObjectNotFunction } from './utils';

interface OPTIONS {
  // 要代理的对象
  rootElm?: HTMLElement | Document;
  scriptText?: string;
}

interface StringObject {
  [key: string]: string;
}

class SnapshotSandbox {
  $options: OPTIONS;
  $proxy: object | null = null;
  $root: object | null = null;
  $memory: StringObject = {};
  $diffPropsMap: StringObject = {};

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
      throw new Error('Opening snapshot sandbox needs the supporting of BROWSER or Node.js ！');
    }

    this.$root = root;
    this.recordOriginGlobal(root);
  }

  recordOriginGlobal(root: object) {
    for (const prop in root) {
      if (Object.prototype.hasOwnProperty.call(root, prop)) {
        this.$memory[prop] = root[prop];
      }
    }
  }

  recoverOriginGlobal(root) {
    Object.keys(Object.assign({}, root, this.$memory)).forEach((prop) => {
      if (Object.prototype.hasOwnProperty.call(this.$memory.hasOwnProperty, prop)) {
        if (root[prop] !== this.$memory[prop]) {
          root[prop] = this.$memory[prop];
        }
      } else {
        delete root[prop];
      }
    });
  }

  // recordDiffPropsMap() {
  //   for (const prop in this.$root) {
  //     if (
  //       this.$memory.hasOwnProperty(prop) &&
  //       this.$root[prop] !== this.$memory[prop]
  //     ) {
  //       this.$diffPropsMap[prop] = this.$root[prop];
  //     }
  //   }
  // }

  execScript(scriptText: string) {
    return new Function(
      'global',
      `
with (global) {
  (function() {
      ${scriptText}
  }).bind(global)();
};
`
    )(this.$root);
  }

  destroy() {
    this.recoverOriginGlobal(this.$root);
  }
}

export default SnapshotSandbox;
