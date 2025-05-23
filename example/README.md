# 本地调试

1. 在 项目更目录下运行 `pnpm build:dev` 生成 dist 目录 
2. 将 dist 目录放置到 example 各个文件夹的 public 中
3. 在 example 各项目中，执行 `pnpm i`, 然后运行服务：`pnpm dev`
4. 在 `localhost:4444` 下打开各个 public 下的 html 来调试 (例如：http://localhost:4444/runScript.html)
