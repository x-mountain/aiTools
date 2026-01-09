import Link from "next/link";

export default function Home() {
  const tools = [
    {
      name: "MD5修改器",
      description: "修改文件的MD5值，文件内容不变，仅改变MD5值",
      href: "/md5-modifier",
      icon: "🔐",
    },
    {
      name: "视频在线压缩",
      description: "在浏览器中压缩视频，支持调整分辨率和质量",
      href: "/video-compressor",
      icon: "🎬",
    },
    {
      name: "Redis 测试",
      description: "测试 Vercel KV (Redis) 数据存储功能",
      href: "/redis-test",
      icon: "🗄️",
    },
    {
      name: "SSR 示例",
      description: "展示 Next.js 服务端渲染 (SSR) 特性",
      href: "/ssr-demo",
      icon: "🚀",
    },
    {
      name: "24点游戏",
      description: "多人在线24点游戏，支持排行榜和房间对战",
      href: "/game24",
      icon: "🎮",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            在线工具库
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            免费、安全、便捷的在线工具集合
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className="text-4xl mb-4">{tool.icon}</div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                {tool.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center text-gray-500 dark:text-gray-400">
          <p>所有操作均在浏览器本地完成，数据不会上传到服务器</p>
          <p className="text-sm mt-2">（24点游戏需要 Redis 支持，请确保已配置 REDIS_URL 环境变量）</p>
        </div>
      </main>
    </div>
  );
}
