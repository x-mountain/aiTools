"use client";

import { useState } from "react";
import Link from "next/link";

interface KVResult {
  success: boolean;
  key?: string;
  value?: any;
  message?: string;
  error?: string;
}

export default function RedisTest() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [ttl, setTtl] = useState("");
  const [result, setResult] = useState<KVResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 写入数据
  const handleSet = async () => {
    if (!key) {
      alert("请输入 Key");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const body: any = { key, value };
      if (ttl) {
        body.ttl = parseInt(ttl);
      }

      const response = await fetch("/api/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // 读取数据
  const handleGet = async () => {
    if (!key) {
      alert("请输入 Key");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/kv?key=${encodeURIComponent(key)}`);
      const data = await response.json();
      setResult(data);
      
      // 如果读取成功，更新 value 输入框
      if (data.success && data.value !== null && data.value !== undefined) {
        setValue(typeof data.value === 'object' ? JSON.stringify(data.value, null, 2) : String(data.value));
      }
    } catch (error) {
      setResult({ success: false, error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // 删除数据
  const handleDelete = async () => {
    if (!key) {
      alert("请输入 Key");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/kv?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        setValue("");
      }
    } catch (error) {
      setResult({ success: false, error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  // 测试计数器
  const handleCounter = async () => {
    setLoading(true);
    setResult(null);

    try {
      const counterKey = "test:counter";
      
      // 先读取当前值
      const getResponse = await fetch(`/api/kv?key=${encodeURIComponent(counterKey)}`);
      const getData = await getResponse.json();
      
      const currentValue = getData.value || 0;
      const newValue = Number(currentValue) + 1;
      
      // 写入新值
      const setResponse = await fetch("/api/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: counterKey, value: newValue }),
      });

      const setData = await setResponse.json();
      setResult({ ...setData, message: `计数器递增: ${currentValue} → ${newValue}` });
      setKey(counterKey);
      setValue(String(newValue));
    } catch (error) {
      setResult({ success: false, error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
          >
            <span className="mr-2">←</span> 返回首页
          </Link>
        </div>

        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🗄️ Redis (Vercel KV) 测试
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              测试 Vercel KV 数据存储功能
            </p>
          </div>

          <div className="space-y-6">
            {/* Key 输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Key（键名）
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="例如: user:123 或 config:app"
                disabled={loading}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 p-3 disabled:opacity-50"
              />
            </div>

            {/* Value 输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Value（值）
              </label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder='支持字符串、数字或 JSON，例如: {"name":"张三","age":25}'
                disabled={loading}
                rows={4}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 p-3 disabled:opacity-50"
              />
            </div>

            {/* TTL 输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                TTL（过期时间，秒）
              </label>
              <input
                type="number"
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                placeholder="留空表示永不过期，例如: 60 表示 60 秒后过期"
                disabled={loading}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 p-3 disabled:opacity-50"
              />
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={handleSet}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
              >
                写入 (SET)
              </button>
              <button
                onClick={handleGet}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
              >
                读取 (GET)
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
              >
                删除 (DEL)
              </button>
              <button
                onClick={handleCounter}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
              >
                测试计数器
              </button>
            </div>

            {/* 结果显示 */}
            {result && (
              <div
                className={`p-4 rounded-lg border ${
                  result.success
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3">
                    {result.success ? "✓" : "✗"}
                  </span>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium mb-2 ${
                        result.success
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      {result.success ? "操作成功" : "操作失败"}
                    </p>
                    {result.message && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {result.message}
                      </p>
                    )}
                    {result.error && (
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                        错误: {result.error}
                      </p>
                    )}
                    {result.value !== undefined && result.value !== null && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          返回值:
                        </p>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                          {typeof result.value === "object"
                            ? JSON.stringify(result.value, null, 2)
                            : String(result.value)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 使用说明 */}
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                📝 使用说明
              </h3>
              <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                <li><strong>写入 (SET)</strong>: 将数据存储到 Redis，支持字符串、数字、JSON 对象</li>
                <li><strong>读取 (GET)</strong>: 根据 Key 读取存储的数据</li>
                <li><strong>删除 (DEL)</strong>: 删除指定 Key 的数据</li>
                <li><strong>测试计数器</strong>: 自动递增计数器演示（Key: test:counter）</li>
                <li>TTL 为空表示数据永不过期，设置 TTL 后数据会在指定秒数后自动删除</li>
                <li>
                  <strong>本地测试注意</strong>: 需要在 Vercel 部署后才能使用，本地需配置环境变量
                </li>
              </ul>
            </div>

            {/* 配置说明 */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                🔧 配置步骤
              </h3>
              <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>在 Vercel Dashboard 中进入项目设置</li>
                <li>点击 "Storage" 标签</li>
                <li>创建 "KV Database"</li>
                <li>连接到项目后会自动注入环境变量</li>
                <li>重新部署项目即可使用</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
