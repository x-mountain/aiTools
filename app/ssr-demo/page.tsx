import Link from "next/link";
import { Suspense } from "react";
import ClientCounter from "./ClientCounter";
import ServerDataDisplay from "./ServerDataDisplay";
import StreamingDemo from "./StreamingDemo";
import Loading from "./loading";

// 模拟从数据库或 API 获取数据
async function fetchServerData() {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 0));
  
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

// 强制动态渲染 - 禁用静态生成
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
              🚀 SSR & RSC 示例
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              展示 Next.js 服务端渲染 (SSR) 和 React Server Components (RSC) 特性
            </p>
          </div>

          {/* RSC 对比说明 */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="mr-2">✨</span> React Server Components (RSC)
            </h2>
            <p className="text-sm mb-4">
              RSC 是 Next.js 13+ 的核心特性，允许组件在服务端渲染，同时保持与客户端组件的灵活混合。
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="mr-2">🖥️</span> 服务端组件 (Server)
                </h3>
                <ul className="text-sm space-y-1">
                  <li>• 默认类型，无需声明</li>
                  <li>• 可以直接访问数据库</li>
                  <li>• 支持 async/await</li>
                  <li>• 不增加 JS 包大小</li>
                  <li>• 无法使用 Hooks</li>
                </ul>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center">
                  <span className="mr-2">💻</span> 客户端组件 (Client)
                </h3>
                <ul className="text-sm space-y-1">
                  <li>• 使用 "use client" 声明</li>
                  <li>• 可以使用 React Hooks</li>
                  <li>• 支持交互和事件</li>
                  <li>• 访问浏览器 API</li>
                  <li>• 增加 JS 包大小</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 服务端组件示例 - 使用 Suspense 实现流式渲染 */}
          <Suspense fallback={<Loading />}>
            <ServerDataDisplay />
          </Suspense>

          {/* 客户端组件示例 */}
          <ClientCounter />

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

          {/* 流式渲染说明 */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg shadow-xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="mr-2">⚡</span> 流式渲染 (Streaming SSR)
            </h2>
            <p className="text-sm mb-4">
              使用 React Suspense，页面可以边加载边显示，不需要等待所有数据加载完成！
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <h3 className="font-semibold mb-2">❌ 传统 SSR （阻塞）</h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center">
                    <span className="w-4 h-4 bg-red-400 rounded mr-2"></span>
                    <span>1. 等待所有数据</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 bg-red-400 rounded mr-2"></span>
                    <span>2. 渲染完整 HTML</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 bg-red-400 rounded mr-2"></span>
                    <span>3. 发送给浏览器</span>
                  </div>
                  <p className="text-xs mt-2 text-red-200">
                    ⏱️ 用户需要等待 1.5s+
                  </p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <h3 className="font-semibold mb-2">✅ 流式 SSR （非阻塞）</h3>
                <div className="text-sm space-y-2">
                  <div className="flex items-center">
                    <span className="w-4 h-4 bg-green-400 rounded mr-2"></span>
                    <span>1. 立即发送页面框架</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 bg-green-400 rounded mr-2"></span>
                    <span>2. 显示加载骨架屏</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-4 h-4 bg-green-400 rounded mr-2"></span>
                    <span>3. 数据就绪后流式更新</span>
                  </div>
                  <p className="text-xs mt-2 text-green-200">
                    ⚡ 用户立即看到页面！
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/10 backdrop-blur rounded-lg">
              <p className="text-xs">
                <strong>实现方式：</strong>使用 <code className="bg-black/20 px-1 rounded">&lt;Suspense&gt;</code> 包裹慢速组件，
                提供 <code className="bg-black/20 px-1 rounded">fallback</code> 加载状态。Next.js 会自动处理流式传输。
              </p>
            </div>
          </div>

          {/* 流式传输技术细节 */}
          <StreamingDemo />

          {/* RSC 最佳实践 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">💡</span> RSC 最佳实践
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  1️⃣ 默认使用服务端组件
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  尽可能使用服务端组件，只在需要交互时才使用 "use client"。这样可以减少客户端 JavaScript 包大小，提升性能。
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                  2️⃣ 使用 Suspense 实现流式渲染
                </h3>
                <p className="text-xs text-green-700 dark:text-green-400 mb-2">
                  用 Suspense 包裹慢速组件，避免阻塞整个页面渲染：
                </p>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
{`// ✅ 好的做法 - 流式渲染
import { Suspense } from 'react';

function Page() {
  return (
    <>
      <FastComponent />  {/* 立即显示 */}
      <Suspense fallback={<Loading />}>
        <SlowComponent /> {/* 异步加载 */}
      </Suspense>
    </>
  );
}

// ❌ 不好的做法 - 阻塞渲染
async function Page() {
  const data = await fetchSlowData(); // 阻塞！
  return <div>{data}</div>;
}`}
                </pre>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
                  3️⃣ 组件树的边界
                </h3>
                <p className="text-xs text-purple-700 dark:text-purple-400 mb-2">
                  将 "use client" 放在组件树的叶子节点，而不是根节点。例如：
                </p>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
{`// ✅ 好的做法
function Page() {
  return (
    <div>
      <ServerComponent />      {/* Server */}
      <InteractiveButton />    {/* Client */}
    </div>
  );
}

// ❌ 不好的做法
"use client";
function Page() {  // 整个页面都变成 Client
  return <div>...</div>;
}`}
                </pre>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">
                  4️⃣ 数据获取策略
                </h3>
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  在服务端组件中直接获取数据，避免额外的 API 请求。可以使用 async/await 直接访问数据库或 API。
                </p>
              </div>

              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                <h3 className="text-sm font-semibold text-pink-800 dark:text-pink-300 mb-2">
                  5️⃣ 混合使用
                </h3>
                <p className="text-xs text-pink-700 dark:text-pink-400">
                  服务端组件可以嵌入客户端组件，但客户端组件不能直接导入服务端组件。如需传递，请使用 children prop。
                </p>
              </div>
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
