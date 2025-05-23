import { isObjectNotFunction } from './utils';

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
  $isReady = false;

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

    const { rootElm, id, url } = this.$options;

    const iframe = window.document.createElement('iframe');

    const attrs: StringObject = {
      // 与码上掘金设置一致
      sandbox:
        'allow-modals allow-downloads allow-forms allow-pointer-lock allow-popups allow-presentation allow-same-origin allow-scripts allow-top-navigation-by-user-activation',
      allow:
        'accelerometer; camera; encrypted-media; display-capture; geolocation; gyroscope; magnetometer; microphone; midi; clipboard-read; clipboard-write; web-share',
      src: url || 'about:blank',
      'app-id': <string>id,
      style: 'border:none;width:100%;height:100%;',
    };
    Object.keys(attrs).forEach((name: string) => {
      iframe.setAttribute(name, attrs[name]);
    });

    // 插入文档流中
    rootElm?.appendChild(iframe);

    // 安全处理 (同源情况下生效)
    if (iframe.contentWindow) {
      // 在 iframe 的脚本中执行（沙箱化代码）
      const safeParent = new Proxy(iframe.contentWindow.parent, {
        get(target, prop) {
          // 只允许访问 postMessage
          if (prop === 'postMessage') {
            return target.postMessage.bind(target); // 确保 this 正确
          }
          // 其他属性访问报错
          throw new Error(`Access to window.parent.${prop as string} is blocked.`);
        },
        set() {
          throw new Error('Modifying window.parent is forbidden.');
        },
      });

      // 锁定 window.parent，防止被覆盖
      Reflect.defineProperty(iframe.contentWindow, 'parent', {
        value: safeParent,
        writable: false,
        configurable: false,
      });
    }

    // 挂载上后才会有 contentWindow
    this.$iframe = iframe;
    this.$iframeWindow = iframe.contentWindow;

    iframe.onload = () => {
      this.$isReady = true;
      this.active();
    };

    return iframe;
  }

  active() {
    const { origin } = this.$options;

    if (!this.$iframeWindow) {
      throw new Error('The current sandbox has been destroyed');
    }
    if (!origin) {
      throw new Error('The iframe origin must be explicitly stated');
    }

    if (this.$iframeWindow) {
      this.$iframeWindow.postMessage(
        {
          type: 'MONTO_IFRAME_READY',
        },
        origin
      );
    }

    //   if (!origin) {
    //     // 同源下
    //     this.$options.scriptText = scriptText;
    //     const scriptElement = this.$iframeWindow?.document.createElement('script');
    //     if (scriptElement) {
    //       scriptElement.textContent = `
    // (function() {
    //   ${scriptText}
    // })();
    // `;
    //       this.$iframeWindow?.document.head.appendChild(scriptElement);
    //     }
    //     return;
    //   }
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
