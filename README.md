# monto-js-sandbox 沙箱（JavaScript Sandbox）

[![Sandbox Type](https://img.shields.io/badge/Sandbox-多种实现-blueviolet)]()
[![安全级别](https://img.shields.io/badge/安全级别-高-green)]()
[![兼容性](https://img.shields.io/badge/兼容性-浏览器%2FNode.js-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()
[![交流](https://img.shields.io/badge/社区-讨论-blue)]()
[![npm](https://img.shields.io/badge/npm-v9.8.1-blue)]()
[![license](https://img.shields.io/badge/license-MIT-green)]()

> 本项目为 JS 沙箱解决方案，适用于多种前端隔离与安全场景。

## 项目简介

本仓库致力于实现多种 JavaScript 沙箱技术，涵盖 iframe、 Proxy、快照、WebComponent、QuickJS+WASM 等多种隔离与安全执行方案，适用于插件系统、在线编辑器、第三方代码加载、多租户应用等场景。  

## 使用场景

- 网页中安全加载第三方代码
- 插件与扩展开发，限制其访问范围
- 多租户应用中的代码隔离
- 测试与调试环境的安全执行
- 代码评审与沙箱运行

## 功能特性

- 多种沙箱实现（iframe、Proxy、快照、WebComponent、QuickJS+WASM）
- 支持全局变量隔离与恢复
- 支持 DOM/CSS 层级隔离
- 支持静态代码安全分析
- 高安全级别的 WASM 虚拟机隔离

## 快速开始（Get Started）

> 更多例子，参见 [example](https://github.com/duheng1992/monto-js-sandbox/tree/master/example)

安装

```
npm install monto-js-sandbox
```      

以下是一个基于 proxy 的简单沙箱实现示例，可用于安全地加载和执行第三方 JavaScript 代码：

```js
import { ProxySandbox } from 'monto-js-sandbox';

const sb = new ProxySandbox({
  rootElm: globalThis
});
const a = 333;
const scriptText = 'console.log("沙盒中的a: ", a);var a = 111;';
sb.execScript(scriptText);
console.log("父容器中的a: ", a)
sb.destroy();
```

## 架构图

![iframe](/images/iframe.jpg)
![proxy](/images/proxy.jpg)
![proxy](/images/snapshot.jpg)
![proxy](/images/webcomponent.jpg)

## 开发计划

- [x] 多种类型沙盒
- [ ] 单元测试补充
- [ ] 异常捕获与详细日志
- [ ] 多实例并发隔离支持
- [ ] 适配微服务
- [ ] 兼容 cjs

## BUG

## 赞助与支持

本项目为 MIT 开源项目，感谢所有 [支持者](#) 的持续支持。如果你愿意加入赞助行列，请 [联系我](https://juejin.cn/user/2911933190649815)。

> 如有建议或问题，欢迎提交 Issue 或 PR！
