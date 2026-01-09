"use client";

import { useState, useEffect } from "react";

// 客户端组件 - 用于展示交互功能
export default function ClientCounter() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [clientTime, setClientTime] = useState("");

  useEffect(() => {
    setMounted(true);
    setClientTime(new Date().toLocaleString());
    
    // 每秒更新时间
    const timer = setInterval(() => {
      setClientTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <span className="mr-2">💻</span> 客户端组件 (Client Component)
      </h2>
      
      <div className="space-y-4">
        {/* 交互式计数器 */}
        <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
          <h3 className="text-lg font-semibold mb-3">交互式计数器</h3>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{count}</span>
            <div className="space-x-2">
              <button
                onClick={() => setCount(count - 1)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                -
              </button>
              <button
                onClick={() => setCount(0)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                重置
              </button>
              <button
                onClick={() => setCount(count + 1)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 实时时钟 */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
            ⏰ 客户端实时时钟
          </h3>
          <p className="text-2xl font-mono text-green-600 dark:text-green-400">
            {clientTime}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            {mounted ? "✓ 组件已挂载在客户端" : "⏳ 等待挂载..."}
          </p>
        </div>

        {/* 特性说明 */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            📌 客户端组件特性
          </h3>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• 使用 "use client" 指令声明</li>
            <li>• 可以使用 React Hooks (useState, useEffect 等)</li>
            <li>• 可以访问浏览器 API (window, document 等)</li>
            <li>• 支持事件处理和交互功能</li>
            <li>• 会增加客户端 JavaScript 包大小</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
