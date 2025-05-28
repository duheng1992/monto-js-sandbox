import { deepClone, isObjectNotFunction } from './utils';

interface OPTIONS {
  // 要代理的对象
  rootElm?: HTMLElement | Document;
  scriptText?: string;
}

interface AnyObject {
  [key: string]: any;
}

interface StringObject {
  [key: string]: any;
}

/**
 * 快照沙箱类
 * 
 * @param options
 * @param options.rootElm 挂载点 dom
 * @param options.scriptText 脚本
 * 
 * @description 快照沙箱类
 * 1. 创建快照沙箱
 * 2. 记录原始全局对象
 * 3. 恢复原始全局对象
 * 4. 执行脚本
 * 5. 销毁快照沙箱
 * 
 * @example
 * ```ts
 * const snapshotSandbox = new SnapshotSandbox({
 *   rootElm: document.body,
 * });
 * ```
 * 
 * 局限：
    只能还原自有属性：原型链上的属性不会被快照和恢复。
    window 对象不可深拷贝，会导致变量污染
    无法隔离原生对象副作用：如 DOM、原型链污染、定时器等副作用无法还原。
    性能问题：全量遍历和恢复全局对象，属性多时有性能开销。
    快照沙盒不是运行时隔离，而是“允许污染、事后还原”。
 */
class SnapshotSandbox {
  $options: OPTIONS;
  $root: AnyObject | null = null;
  // 记录原始全局对象
  $memory: StringObject = {};
  $diffPropsMap: StringObject = {};
  // window 不可深拷贝，这里要单独记录
  $domSnapshot = {};

  constructor(options: OPTIONS) {
    this.$options = options;
    this.createSandbox();
  }

  createSandbox() {
    if (!isObjectNotFunction(this.$options)) {
      throw new Error('The options should be object !');
    }
    const root = this.$options.rootElm || <AnyObject>Function('return this')();
    if (!root) {
      throw new Error('Opening snapshot sandbox needs the supporting of BROWSER or Node.js ！');
    }

    this.$root = root;
    // 初始化时不做快照，等 execScript 时再做
  }

  /**
   * 记录原始全局对象
   * @param root 原始全局对象
   */
  recordOriginGlobal(root: object) {
    for (const prop in root) {
      // 属性来自自身，而不是原型链，就记录下来
      if (Object.prototype.hasOwnProperty.call(root, prop)) {
        this.$memory[prop] = deepClone(root[prop]);
      }
    }
  }

  /**
   * 恢复原始全局对象
   * @param root 原始全局对象
   */
  recoverOriginGlobal(root: object) {
    Object.keys(Object.assign({}, root, this.$memory)).forEach((prop) => {
      if (Object.prototype.hasOwnProperty.call(this.$memory, prop)) {
        if (root[prop] !== this.$memory[prop]) {
          root[prop] = deepClone(this.$memory[prop]);
        }
      } else {
        delete root[prop];
      }
    });
  }

  // 提高性能，可以做 diff 优化
  recordDiffPropsMap() {
    this.$diffPropsMap = {};
    // 记录被修改的原有属性
    for (const prop in this.$root) {
      if (Object.prototype.hasOwnProperty.call(this.$root, prop)) {
        if (Object.prototype.hasOwnProperty.call(this.$memory, prop)) {
          if (this.$root[prop] !== this.$memory[prop]) {
            this.$diffPropsMap[prop] = { old: this.$memory[prop], new: this.$root[prop] };
          }
        } else {
          // 新增属性
          this.$diffPropsMap[prop] = { old: undefined, new: this.$root[prop] };
        }
      }
    }
    // 记录被删除的属性
    for (const prop in this.$memory) {
      if (
        Object.prototype.hasOwnProperty.call(this.$memory, prop) &&
        !Object.prototype.hasOwnProperty.call(this.$root, prop)
      ) {
        this.$diffPropsMap[prop] = { old: this.$memory[prop], new: undefined };
      }
    }
  }

  execScript(scriptText: string) {
    if (!this.$root) return;
    // 记录快照
    this.recordOriginGlobal(this.$root);

    // execScript 里用 with (global)，让 foo = ...、bar = ... 实际等价于 $root.foo = ...$root.bar = ...。
    // 所以沙盒内的所有赋值、删除、修改，都会直接作用在 $root 上。
    new Function(
      'global',
      `
with (global) {
  (function() {
      ${scriptText}
  }).bind(global)();
};
`
    )(this.$root);

    // 记录 diff
    this.recordDiffPropsMap();
  }

  destroy() {
    if (!this.$root) return;
    for (const prop in this.$diffPropsMap) {
      const { old } = this.$diffPropsMap[prop];
      if (old === undefined) {
        // 新增属性，删除
        delete this.$root[prop];
      } else {
        // 恢复原值
        this.$root[prop] = deepClone(old);
      }
    }
    this.$root = null;
    this.$options = {} as OPTIONS;
    this.$memory = {};
    this.$diffPropsMap = {};
  }
}

export default SnapshotSandbox;
