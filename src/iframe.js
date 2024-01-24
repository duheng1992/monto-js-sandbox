;
class IframeSandbox {
    $options;
    $iframe;
    $iframeWindow;
    constructor(options) {
        if (!window) {
            throw new Error('opening iframe sandbox needs the supporting of BROWSER ！');
        }
        this.$options = options;
        this.createSandbox();
    }
    createSandbox() {
        const { rootElm, id, url } = this.$options;
        const iframe = window.document.createElement("iframe");
        const attrs = {
            src: "about:blank",
            "app-id": id,
            "app-src": url,
            style: "border:none;width:100%;height:100%;",
        };
        Object.keys(attrs).forEach((name) => {
            iframe.setAttribute(name, attrs[name]);
        });
        rootElm?.appendChild(iframe);
        this.$iframe = iframe;
        this.$iframeWindow = iframe.contentWindow;
        return iframe;
    }
    execScript(scriptText) {
        this.$options.scriptText = scriptText;
        const scriptElement = this.$iframeWindow.document.createElement("script");
        scriptElement.textContent = `
(function(window) {
  ${scriptText}
})(window);
`;
        this.$iframeWindow.document.head.appendChild(scriptElement);
    }
    destroy() {
        if (this.$iframe) {
            this.$iframe.parentNode?.removeChild(this.$iframe);
        }
        this.$iframe = null;
    }
}
export default IframeSandbox;
