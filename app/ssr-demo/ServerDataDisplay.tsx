// 服务端组件 - 默认就是 Server Component
// 注意：没有 "use client" 指令

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 模拟数据库查询
async function fetchDatabaseData() {
  // 模拟查询延迟
  await new Promise((resolve) => setTimeout(resolve, 5000));
  
  return {
    users: [
      { id: 1, name: "张三", email: "zhangsan@example.com", role: "管理员" },
      { id: 2, name: "李四", email: "lisi@example.com", role: "用户" },
      { id: 3, name: "王五", email: "wangwu@example.com", role: "用户" },
    ],
    stats: {
      totalUsers: 1234,
      activeUsers: 567,
      newToday: 23,
    },
  };
}

export default async function ServerDataDisplay() {
  // 在服务端执行数据获取
  const data = await fetchDatabaseData();
  const renderTime = new Date().toISOString();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <span className="mr-2">🖥️</span> 服务端组件 (Server Component)
      </h2>

      <div className="space-y-4">
        {/* 渲染时间 */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
            🕐 服务端渲染时间
          </h3>
          <p className="text-lg font-mono text-purple-600 dark:text-purple-400">
            {renderTime}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            此时间在服务端生成，刷新页面会更新
          </p>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.stats.totalUsers}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">总用户数</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.stats.activeUsers}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">活跃用户</p>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {data.stats.newToday}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">今日新增</p>
          </div>
        </div>

        {/* 用户列表 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-3">
            👥 用户列表（来自服务端数据库）
          </h3>
          <div className="space-y-2">
            {data.users.map((user) => (
              <div
                key={user.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 特性说明 */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
            📌 服务端组件特性
          </h3>
          <ul className="text-xs text-green-700 dark:text-green-400 space-y-1">
            <li>• 默认就是 Server Component（无需声明）</li>
            <li>• 可以直接访问数据库、文件系统等后端资源</li>
            <li>• 可以使用 async/await 异步获取数据</li>
            <li>• 不会增加客户端 JavaScript 包大小</li>
            <li>• 无法使用 React Hooks 和浏览器 API</li>
            <li>• 组件代码不会发送到浏览器</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
