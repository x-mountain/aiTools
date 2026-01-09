// 演示流式传输的不同阶段
export default function StreamingDemo() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <span className="mr-2">🌊</span> 流式传输原理
      </h2>

      <div className="space-y-4">
        {/* 传输时间线 */}
        <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
          <h3 className="font-semibold mb-3">传输时间线</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-mono mr-3">0ms</span>
              <div className="flex-1">
                <p className="text-sm font-medium">📤 第一块 (Chunk 1)</p>
                <p className="text-xs opacity-90">HTML 头部、CSS、初始页面结构</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-mono mr-3">50ms</span>
              <div className="flex-1">
                <p className="text-sm font-medium">📤 第二块 (Chunk 2)</p>
                <p className="text-xs opacity-90">快速组件的 HTML（立即可用的内容）</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-mono mr-3">100ms</span>
              <div className="flex-1">
                <p className="text-sm font-medium">🎨 浏览器渲染</p>
                <p className="text-xs opacity-90">用户看到页面框架和骨架屏</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-mono mr-3">500ms</span>
              <div className="flex-1">
                <p className="text-sm font-medium">📤 第三块 (Chunk 3)</p>
                <p className="text-xs opacity-90">Suspense 组件的数据就绪，发送真实 HTML</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="bg-white/20 px-2 py-1 rounded text-xs font-mono mr-3">520ms</span>
              <div className="flex-1">
                <p className="text-sm font-medium">✨ 自动替换</p>
                <p className="text-xs opacity-90">React 自动用真实内容替换骨架屏</p>
              </div>
            </div>
          </div>
        </div>

        {/* HTTP 响应示例 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
            📡 HTTP 响应头
          </h3>
          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
{`HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Transfer-Encoding: chunked
X-Powered-By: Next.js

<!-- 数据会分多次传输，而不是一次性 -->`}
          </pre>
        </div>

        {/* React 内部机制 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
            ⚛️ React 的流式渲染机制
          </h3>
          <div className="space-y-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                <strong>1. 标记 Suspense 边界：</strong>React 遇到 <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">&lt;Suspense&gt;</code> 时，
                会在 HTML 中插入特殊注释标记（如 <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">$?</code>）
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400">
                <strong>2. 发送 Fallback：</strong>先发送 <code className="bg-green-100 dark:bg-green-800 px-1 rounded">fallback</code> 内容（骨架屏），
                让用户立即看到页面
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-purple-700 dark:text-purple-400">
                <strong>3. 后台处理：</strong>服务器继续等待 async 组件完成数据获取
              </p>
            </div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <p className="text-xs text-orange-700 dark:text-orange-400">
                <strong>4. 发送更新：</strong>数据就绪后，通过新的 chunk 发送真实内容和替换脚本
              </p>
            </div>
            <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
              <p className="text-xs text-pink-700 dark:text-pink-400">
                <strong>5. 客户端 Hydration：</strong>React 在客户端执行脚本，用真实内容替换 fallback
              </p>
            </div>
          </div>
        </div>

        {/* 实际 HTML 输出示例 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
            📄 实际 HTML 输出（简化版）
          </h3>
          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto whitespace-pre-wrap">
{`<!-- Chunk 1: 立即发送 -->
<!DOCTYPE html>
<html>
<head>
  <script>/* React 运行时 */</script>
</head>
<body>
  <div id="root">
    <header>立即显示的内容</header>
    
    <!-- Suspense 边界标记 -->
    <!--$?-->
    <template id="B:0"></template>
    
    <!-- Fallback 内容（骨架屏） -->
    <div class="loading-skeleton">
      加载中...
    </div>
    <!--/$-->
    
    <footer>页脚</footer>
  </div>

<!-- Chunk 2: 500ms 后数据就绪，发送 -->
<div hidden id="S:0">
  <!-- 真实的组件内容 -->
  <div class="user-data">
    <h3>用户数据</h3>
    <p>张三 - zhangsan@example.com</p>
  </div>
</div>

<script>
  // React 的替换函数
  $RC = function(id, html) {
    // 找到 template 标记
    const template = document.getElementById(id);
    // 用真实内容替换 fallback
    template.parentNode.replaceChild(
      document.getElementById('S:0').firstChild,
      template.nextSibling
    );
  };
  $RC("B:0");
</script>

</body>
</html>`}
          </pre>
        </div>

        {/* 关键技术点 */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            🔑 关键技术点
          </h3>
          <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
            <li><strong>分块传输：</strong>使用 HTTP Chunked Transfer Encoding</li>
            <li><strong>渐进式渲染：</strong>浏览器收到部分 HTML 就开始渲染</li>
            <li><strong>非阻塞：</strong>慢速组件不影响其他内容显示</li>
            <li><strong>选择性 Hydration：</strong>React 只对需要交互的部分进行 hydrate</li>
            <li><strong>自动协调：</strong>React 自动处理内容替换，无需手动操作 DOM</li>
          </ul>
        </div>

        {/* 性能对比 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
            ⚡ 性能对比
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">
                ❌ 传统 SSR
              </p>
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                <li>• TTFB: 1500ms</li>
                <li>• FCP: 1600ms</li>
                <li>• LCP: 1700ms</li>
              </ul>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                ✅ 流式 SSR
              </p>
              <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                <li>• TTFB: 50ms ⚡</li>
                <li>• FCP: 150ms ⚡</li>
                <li>• LCP: 600ms ⚡</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            * TTFB: Time to First Byte | FCP: First Contentful Paint | LCP: Largest Contentful Paint
          </p>
        </div>
      </div>
    </div>
  );
}
