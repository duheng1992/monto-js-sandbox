import { isObjectNotFunction } from './utils';

interface OPTIONS {
  // iframe 挂载点 dom
  rootElm: HTMLElement | Document;
  // iframe 的 id
  id: string;
  // iframe 的 url
  url?: string;
  scriptText?: string;
}

interface StringObject {
  [key: string]: string;
};

class IframeSandbox {
  $options: OPTIONS;
  $iframe: HTMLIFrameElement | null = null;
  $iframeWindow: Window | null = null;

  constructor(options: OPTIONS) {
    if (!window) {
      throw new Error('Opening iframe sandbox needs the supporting of BROWSER ！');
    }

    this.$options = options;
    this.createSandbox();
  }

  createSandbox() {
    if (!isObjectNotFunction(this.$options)) {
      throw new Error('The options should be object !');
    }

    const { rootElm, id, url } = this.$options;
    const iframe = window.document.createElement("iframe");
    const attrs: StringObject = {
      sandbox: "allow-scripts",
      src: "about:blank",
      "app-id": <string>id,
      "app-src": <string>url,
      style: "border:none;width:100%;height:100%;",
    };
    Object.keys(attrs).forEach((name: string) => {
      iframe.setAttribute(name, attrs[name]);
    });
    rootElm?.appendChild(iframe);

    // 挂载上后才会有 contentWindow
    this.$iframe = iframe;
    this.$iframeWindow = iframe.contentWindow;

    return iframe;
  }

  execScript(scriptText: string) {
    if (!this.$iframeWindow) {
      throw new Error('The current sandbox has been destroyed');
    }

    this.$options.scriptText = scriptText;
    const scriptElement =
      this.$iframeWindow?.document.createElement("script");
    if (scriptElement) {
      scriptElement.textContent = `
(function(window) {
  ${scriptText}
})(window);
`;
      this.$iframeWindow?.document.head.appendChild(scriptElement);
    }
  }

  destroy() {
    if (this.$iframe) {
      this.$iframe.parentNode?.removeChild(this.$iframe);
    }
    this.$iframe = null;
    this.$iframeWindow = null;
  }
}

export default IframeSandbox;