# 根地址访问 mind

目标：访问 https://ma1203580780.github.io/ 时自动跳转到 https://ma1203580780.github.io/mind/。mind 继续是唯一内容仓库，不重复构建或维护两份内容。

1. 在 GitHub 创建公共仓库 `ma1203580780/ma1203580780.github.io`，保留默认分支 `main`。
2. 将本目录的 `index.html` 与 `.nojekyll` 放到新仓库根目录并提交。
3. 在新仓库 Settings → Pages 中选择 Deploy from a branch，分支选择 main，目录选择 / (root)，保存。

等待 Pages 构建成功，打开根地址验证。启用 JavaScript 时会保留查询参数和锚点；禁用 JavaScript 时由 HTML 自动跳转，并有可点击的备用链接。不会修改 `/mind/` 的现有部署、文章或 RSS 地址。

若以后需要地址栏始终保留根地址，应把完整站点部署到用户名仓库，并按根路径构建；不要把 `.github.io` 地址设为 mind 的自定义域名。

依据：https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
