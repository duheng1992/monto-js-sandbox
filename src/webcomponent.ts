// src/webcomponents.ts

interface WebComponentSandboxOptions {
  tagName: string; // 自定义元素名
  template?: string; // HTML 模板
  style?: string; // CSS 样式
  scriptText?: string; // 要执行的 JS 脚本
  container?: HTMLElement; // 挂载点
  exposeGlobals?: string[]; // 允许暴露到沙盒内的全局对象名
}

/**
 * WebComponent 沙盒
 *
 * @param options 配置
 * @param options.tagName 自定义元素名
 * @param options.template HTML 模板
 * @param options.style CSS 样式
 * @param options.scriptText 要执行的 JS 脚本
 * @param options.container 挂载点
 * @param options.exposeGlobals 允许暴露到沙盒内的全局对象名
 *
 * @example
 * const sb = new WebComponentSandbox({
 *   tagName: 'my-sandbox-demo',
 *   template: `<button id="btn">点我</button><div id="msg"></div>`,
 *   style: `#msg { font-weight: bold; color: green; }`,
 *   scriptText: `
 *     "use strict";
 *     foo = '沙盒foo';
 *     console.log('沙盒内 foo：', foo);
 *   `,
 *   container: document.body,
 *   exposeGlobals: [] // 不暴露 window/document，保证隔离
 * });
 *
 * sb.execScript();
 */
class WebComponentSandbox {
  private element: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private options: WebComponentSandboxOptions;
  private sandboxGlobal: Record<string, any> = {};

  constructor(options: WebComponentSandboxOptions) {
    this.options = options;
    this.avtive();
  }

  private avtive() {
    const { tagName, template = '', style = '', container = document.body, exposeGlobals = [] } = this.options;

    // 注册自定义元素（只注册一次）
    if (!customElements.get(tagName)) {
      customElements.define(tagName, class extends HTMLElement {});
    }

    // 创建元素并挂载
    this.element = document.createElement(tagName);
    container.appendChild(this.element);

    // 创建 Shadow DOM
    this.shadowRoot = this.element.attachShadow({ mode: 'open' });

    // 注入样式和模板
    if (style) {
      const styleEl = document.createElement('style');
      styleEl.textContent = style;
      this.shadowRoot.appendChild(styleEl);
    }
    if (template) {
      const templateEl = document.createElement('div');
      templateEl.innerHTML = template;
      this.shadowRoot.appendChild(templateEl);
    }

    // 构建沙盒可用的全局对象
    this.sandboxGlobal = {
      shadowRoot: this.shadowRoot,
      root: this.shadowRoot,
      element: this.element,
    };
    // 只暴露白名单中的全局对象
    exposeGlobals.forEach((key) => {
      if (key in window) {
        this.sandboxGlobal[key] = (window as any)[key];
      }
    });
    // 自动暴露 shadowRoot 下的所有 id 元素为变量
    if (this.shadowRoot) {
      const nodes = this.shadowRoot.querySelectorAll('[id]');
      nodes.forEach((node) => {
        const id = (node as HTMLElement).id;
        if (id) {
          this.sandboxGlobal[id] = node;
        }
      });
    }
  }

  execScript(scriptText?: string) {
    if (!this.shadowRoot) return;
    const script = scriptText || this.options.scriptText;
    if (!script) return;

    // 构造参数名和参数值
    const paramNames = Object.keys(this.sandboxGlobal);
    const paramValues = paramNames.map((k) => this.sandboxGlobal[k]);

    // 用 new Function 动态执行，参数注入沙盒变量
    const fn = new Function(
      ...paramNames,
      `
      "use strict";
      (function() {
        ${script}
      }).apply(null, arguments);
    `
    );
    fn(...paramValues);
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.shadowRoot = null;
    this.sandboxGlobal = {};
  }
}

export default WebComponentSandbox;
