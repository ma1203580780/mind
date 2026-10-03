# 在 Windows 上写博客

日常流程：**打开工作区 → 新建文章 → 写作和预览 → 关闭草稿 → 提交并同步**。GitHub Actions 会自动构建并发布到现有博客，无需另配 webhook、服务器或付费 CMS。

## 首次准备（只做一次）

1. 安装 [VS Code](https://code.visualstudio.com/)、[Git for Windows](https://git-scm.com/downloads/win) 和 [Node.js 24 LTS](https://nodejs.org/en/download)。Git 安装时保留 Git Credential Manager，用浏览器登录 GitHub，无需把令牌写进项目。
2. 重启 VS Code。按 `Ctrl+Shift+P`，执行 `Git: Clone`，输入 `https://github.com/ma1203580780/mind.git`，选择本地目录并打开。若已有这个仓库，直接打开它，不必重复克隆。
3. 用 VS Code 打开仓库中的 `mind-writing.code-workspace`，安装工作区推荐的 **Front Matter CMS**（扩展 ID：`eliostruyf.vscode-front-matter`）和 Astro 扩展。Front Matter 建议使用支持图片粘贴的 10.12.0 或更新版本。
4. 打开 VS Code 终端，运行 `npm.cmd ci`。这里写 `.cmd` 是为了避免 Windows PowerShell 对 `npm.ps1` 的执行策略限制，不需要修改系统安全策略。
5. 如果首次提交提示身份未设置，在这个仓库的终端运行以下两行，把值改成自己的名字和 GitHub 已验证邮箱或 GitHub 提供的 noreply 邮箱：

   ```powershell
   git config user.name "你的名字"
   git config user.email "你的 GitHub 提交邮箱"
   ```

配置已随仓库提供，**无需再次初始化 Front Matter 或重新生成字段**。命令面板搜索 `Front Matter`，打开 Dashboard 即可；安装扩展后若没有出现，执行 `Developer: Reload Window`。

## 每次写作

### 1. 先同步

在修改文件前，用 VS Code“源代码管理”菜单中的 Pull 拉取更新。资讯采集任务也会更新仓库，因此每天开始写作前先同步一次。

### 2. 创建或编辑博客

在 Front Matter 内容面板选择“博客”，用 Create content 创建文章。类型名称如显示 `default`，它就是本站的博客类型。

- 标题和摘要用中文填写；栏目、创作方式、草稿状态等在表单中选择。
- 新文章默认是草稿，正文会带简短的写作提纲，可自由删除。
- 正文写在 `src/content/posts/*.md`。正文从段落或 `##` 二级标题开始，页面会自动显示文章标题，不必再写一个 `#` 标题。
- 文件名决定文章地址。建议创建时输入简短英文名（如 `my-first-post`），再把表单标题改为中文；发布后尽量不要改文件名，以免旧链接失效。不要自行增加 `slug` 字段。
- 日期用于显示和排序，**不是预约发布开关**。是否上线由草稿状态和推送决定。

### 3. 按真实页面预览

在终端运行：

```powershell
npm.cmd run write
```

保持终端运行。在 Front Matter 打开当前文章，点击预览；也可直接访问 `http://127.0.0.1:4321/mind/posts/文件名/`。保存后页面会更新。工作区也提供“写作：启动本地预览”任务（命令面板 → Tasks: Run Task）。

草稿页有明确提示，仅本地开发模式可以访问；草稿不会进入博客列表、搜索、标签页或 RSS。停止预览按终端 `Ctrl+C`。如果 4321 端口被占用，先停止旧预览进程再启动，避免扩展访问错误端口。

Front Matter 的启动按钮使用 `npm run write`。若它在 PowerShell 中提示脚本执行受限，直接使用上面的 `npm.cmd run write` 即可。

### 4. 插入图片

复制图片后在 Markdown 正文里粘贴，Front Matter 会将图片保存到 `public/uploads` 并插入图片引用。也可以在 Media 面板中进入 `uploads` 上传图片，再插入正文。建议使用 JPG、PNG、WebP 等常见格式，压缩后上传，并补写有意义的图片说明。

如果图片剪贴板没有被扩展接管，可手动把图片放进 `public/uploads`，这样引用：

```markdown
![产品原型首页](/uploads/product-home.png)
```

路径使用 `/uploads/`，站点会自动补上部署所需的 `/mind`。图片文件名建议用英文、数字和短横线。图片和文章必须一起提交。请以真实站点预览为准，VS Code 自带 Markdown 预览不一定能解析 `public` 中的图片。

## 发布

1. 写完后关闭“草稿”开关（`draft: false`），保存文章。
2. 运行 `npm.cmd run build`，确认检查和构建通过。
3. 在 VS Code“源代码管理”中检查改动，确认文章和图片齐全，填写提交说明，例如“发布：我的第一篇博客”，点击 Commit，然后 Sync Changes。首次推送按提示在浏览器登录有仓库写权限的 GitHub 账号。
4. 打开 [Actions](https://github.com/ma1203580780/mind/actions)，等待 **Publish blog** 成功，再查看 [博客](https://ma1203580780.github.io/mind/archive/)。RSS 和站内搜索随同一次构建更新。

Front Matter 也已启用 Git Sync，可在熟悉后使用；同步前同样先检查源代码管理里的所有改动。**保存只保存本地；提交记录版本；推送才触发线上更新。**

若同步提示冲突，在源代码管理里查看冲突内容，处理后重新检查、提交、同步，不要强制推送。若 Actions 失败，查看失败步骤；构建未通过不会发布新版本。

## 草稿与回退

- `draft: true` 只控制网站是否发布。这个仓库是公开的，推送过的草稿在 GitHub 源码中仍然可见；`public/uploads` 内的图片也会作为静态资源发布。私密文字、图片请留在仓库之外，等准备公开时再放入。
- 想把已发布文章撤下：改回草稿，提交并推送；这不会抹掉 Git 历史或读者已有副本。
- 需要恢复旧版本：通过 Git 历史恢复对应文件，再提交一个新版本即可。

## 文件位置

| 内容 | 位置 |
| --- | --- |
| 双击打开的写作工作区 | `mind-writing.code-workspace` |
| CMS 中文字段、媒体、预览与同步配置 | `frontmatter.json` |
| 新文章正文模板 | `.frontmatter/templates/article.md` |
| 博客 Markdown | `src/content/posts/` |
| 上传图片 | `public/uploads/` |
| 自动发布工作流 | `.github/workflows/deploy.yml` |

后续换编辑器也能继续使用这些 Markdown 文件，不依赖在线 CMS。参考：[Front Matter 内容类型](https://frontmatter.codes/docs/content-creation/content-types/)、[真实站点预览](https://frontmatter.codes/docs/site-preview/)、[Git 集成](https://frontmatter.codes/docs/git-integration/)。
