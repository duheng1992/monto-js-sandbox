import { isObjectNotFunction } from './utils';

declare global {
  interface Window {
    $postMessage: (message: string, targetOrigin: string) => void | undefined;
  }
}

interface OPTIONS {
  // iframe 挂载点 dom
  rootElm: HTMLElement | Document;
  // iframe 的 id
  id: string;
  // iframe 的 url
  url?: string;
  origin?: string;
  scriptText?: string;
}

interface StringObject {
  [key: string]: string;
}

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
      throw new Error('The options should be an object !');
    }

    const { rootElm, id } = this.$options;
    const iframe = window.document.createElement('iframe');

    // if (iframe.contentWindow?.postMessage) {
    //   iframe.onload = () => {
    //     window.$postMessage = (iframe.contentWindow as Window).postMessage;
    //   };
    // }

    const attrs: StringObject = {
      // sandbox: "allow-same-origin allow-scripts",
      src: 'about:blank',
      'app-id': <string>id,
      style: 'border:none;width:100%;height:100%;',
    };
    Object.keys(attrs).forEach((name: string) => {
      iframe.setAttribute(name, attrs[name]);
    });

    // 插入文档流中
    rootElm?.appendChild(iframe);

    // 挂载上后才会有 contentWindow
    this.$iframe = iframe;
    this.$iframeWindow = iframe.contentWindow;

    return iframe.contentWindow;
  }

  active(scriptText: string) {
    if (!this.$iframeWindow) {
      throw new Error('The current sandbox has been destroyed');
    }
    this.$options.scriptText = scriptText;
    const scriptElement = this.$iframeWindow?.document.createElement('script');
    if (scriptElement) {
      scriptElement.textContent = `
(function() {
  ${scriptText}
})();
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
