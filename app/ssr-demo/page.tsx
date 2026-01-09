import Link from "next/link";

// 模拟从数据库或 API 获取数据
async function fetchServerData() {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return {
    serverTime: new Date().toISOString(),
    randomNumber: Math.floor(Math.random() * 1000),
    requestCount: Math.floor(Math.random() * 10000),
    posts: [
      { id: 1, title: "Next.js 15 新特性", author: "张三", views: 1234 },
      { id: 2, title: "React 19 性能优化", author: "李四", views: 2345 },
      { id: 3, title: "TypeScript 最佳实践", author: "王五", views: 3456 },
    ],
  };
}

// 服务端组件 - 默认就是 SSR
export default async function SSRDemo() {
  // 这段代码在服务端执行
  const data = await fetchServerData();
  
  // 可以在服务端安全地使用环境变量
  const nodeVersion = process.version;
  const platform = process.platform;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
          >
            <span className="mr-2">←</span> 返回首页
          </Link>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* 页面标题 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🚀 SSR 服务端渲染示例
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              此页面在服务端渲染，数据在服务器上获取并返回完整的 HTML
            </p>
          </div>

          {/* 服务端信息 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🖥️</span> 服务端信息
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  服务器时间
                </span>
                <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                  {data.serverTime}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  随机数（服务端生成）
                </span>
                <span className="text-sm font-mono text-green-600 dark:text-green-400">
                  {data.randomNumber}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  模拟请求计数
                </span>
                <span className="text-sm font-mono text-purple-600 dark:text-purple-400">
                  {data.requestCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Node.js 版本
                </span>
                <span className="text-sm font-mono text-orange-600 dark:text-orange-400">
                  {nodeVersion}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  运行平台
                </span>
                <span className="text-sm font-mono text-pink-600 dark:text-pink-400">
                  {platform}
                </span>
              </div>
            </div>
          </div>

          {/* 文章列表 - 服务端获取的数据 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">📝</span> 热门文章（服务端数据）
            </h2>
            <div className="space-y-3">
              {data.posts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {post.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {post.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      作者: {post.author}
                    </span>
                    <span className="text-sm text-blue-600 dark:text-blue-400">
                      👁️ {post.views.toLocaleString()} 次浏览
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SSR 特性说明 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">✨</span> SSR 特性
            </h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>页面内容在服务器端生成，首屏加载速度快</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>SEO 友好，搜索引擎可以直接抓取完整内容</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>可以安全地访问服务端 API、数据库等资源</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>每次请求都会重新渲染，数据实时更新</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>减少客户端 JavaScript 执行，提升性能</span>
              </li>
            </ul>
          </div>

          {/* 技术说明 */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-6">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
              🔍 技术实现说明
            </h3>
            <div className="text-xs text-yellow-700 dark:text-yellow-400 space-y-2">
              <p>
                <strong>1. 默认 SSR：</strong> Next.js App Router 中，所有组件默认在服务端渲染
              </p>
              <p>
                <strong>2. async/await：</strong> 服务端组件可以直接使用 async 函数获取数据
              </p>
              <p>
                <strong>3. 动态渲染：</strong> 页面每次请求都会重新渲染，刷新页面可看到数据更新
              </p>
              <p>
                <strong>4. 服务端专属：</strong> 可以使用 process、fs 等 Node.js API
              </p>
              <p>
                <strong>5. 查看源码：</strong> 右键"查看网页源代码"可看到完整的 HTML 内容
              </p>
            </div>
          </div>

          {/* 测试提示 */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3">
              🧪 测试 SSR 效果
            </h3>
            <ul className="text-xs text-green-700 dark:text-green-400 space-y-2 list-disc list-inside">
              <li>刷新页面（F5），观察服务器时间和随机数会变化</li>
              <li>右键"查看网页源代码"，可以看到完整的数据已经在 HTML 中</li>
              <li>禁用 JavaScript 后页面仍然可以正常显示（内容已预渲染）</li>
              <li>打开 Network 面板，可以看到 HTML 文档包含完整内容</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 可选：配置页面元数据（也在服务端生成）
export const metadata = {
  title: "SSR 示例 - 服务端渲染",
  description: "展示 Next.js App Router 的服务端渲染特性",
};
