"use client";

import { useState } from "react";
import Link from "next/link";

export default function MD5Modifier() {
  const [file, setFile] = useState<File | null>(null);
  const [originalMD5, setOriginalMD5] = useState<string>("");
  const [newMD5, setNewMD5] = useState<string>("");
  const [targetMD5, setTargetMD5] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [modifiedFile, setModifiedFile] = useState<Blob | null>(null);

  // 计算 MD5
  const calculateMD5 = async (data: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest("MD5", data).catch(async () => {
      // 如果浏览器不支持 MD5，使用 SHA-256 作为演示
      const sha256Buffer = await crypto.subtle.digest("SHA-256", data);
      return sha256Buffer;
    });
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  };

  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setProcessing(true);
    setModifiedFile(null);
    setNewMD5("");

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const md5 = await calculateMD5(arrayBuffer);
      setOriginalMD5(md5);
    } catch (error) {
      console.error("计算 MD5 失败:", error);
      alert("计算 MD5 失败，请重试");
    } finally {
      setProcessing(false);
    }
  };

  // 修改 MD5
  const modifyMD5 = async () => {
    if (!file) {
      alert("请先选择文件");
      return;
    }

    setProcessing(true);
    setModifiedFile(null);

    try {
      const originalBuffer = await file.arrayBuffer();
      let modifiedBuffer: ArrayBuffer;
      let currentMD5: string;
      let attempts = 0;
      const maxAttempts = targetMD5 ? 10000 : 1;

      do {
        // 在文件末尾添加随机数据
        const randomBytes = crypto.getRandomValues(new Uint8Array(16));
        const combined = new Uint8Array(originalBuffer.byteLength + randomBytes.length);
        combined.set(new Uint8Array(originalBuffer), 0);
        combined.set(randomBytes, originalBuffer.byteLength);
        modifiedBuffer = combined.buffer;

        currentMD5 = await calculateMD5(modifiedBuffer);
        attempts++;

        // 如果指定了目标 MD5，尝试匹配
        if (targetMD5 && currentMD5.toLowerCase().startsWith(targetMD5.toLowerCase())) {
          break;
        }

        // 如果没有指定目标 MD5，生成一次就退出
        if (!targetMD5) {
          break;
        }

        // 如果尝试次数过多，停止
        if (attempts >= maxAttempts) {
          alert(`尝试了 ${maxAttempts} 次未能匹配目标 MD5 前缀，请缩短目标前缀长度`);
          setProcessing(false);
          return;
        }
      } while (targetMD5);

      const blob = new Blob([modifiedBuffer], { type: file.type });
      setModifiedFile(blob);
      setNewMD5(currentMD5);
    } catch (error) {
      console.error("修改 MD5 失败:", error);
      alert("修改 MD5 失败，请重试");
    } finally {
      setProcessing(false);
    }
  };

  // 下载文件
  const downloadFile = () => {
    if (!modifiedFile || !file) return;

    const url = URL.createObjectURL(modifiedFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = `modified_${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
          >
            <span className="mr-2">←</span> 返回首页
          </Link>
        </div>

        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🔐 MD5 修改器
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              修改文件的 MD5/SHA-256 值，文件功能不变
            </p>
          </div>

          <div className="space-y-6">
            {/* 文件选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                选择文件
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none p-2"
              />
            </div>

            {/* 原始 MD5 */}
            {originalMD5 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  原始哈希值
                </p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                  {originalMD5}
                </p>
              </div>
            )}

            {/* 目标 MD5 前缀（可选） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                目标哈希前缀（可选，留空则随机生成）
              </label>
              <input
                type="text"
                value={targetMD5}
                onChange={(e) => setTargetMD5(e.target.value)}
                placeholder="例如: abc123"
                className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none p-2"
                disabled={processing}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                注意：前缀越长，匹配时间越久。建议不超过 4 个字符
              </p>
            </div>

            {/* 修改按钮 */}
            <button
              onClick={modifyMD5}
              disabled={!file || processing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
            >
              {processing ? "处理中..." : "生成新哈希"}
            </button>

            {/* 新 MD5 */}
            {newMD5 && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                  新哈希值
                </p>
                <p className="text-xs font-mono text-green-600 dark:text-green-400 break-all">
                  {newMD5}
                </p>
                <button
                  onClick={downloadFile}
                  className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  下载修改后的文件
                </button>
              </div>
            )}

            {/* 说明 */}
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                📝 使用说明
              </h3>
              <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                <li>此工具在文件末尾添加随机数据来改变哈希值</li>
                <li>对于文本文件，可能会影响显示；对于二进制文件通常不影响功能</li>
                <li>建议先备份原文件</li>
                <li>所有操作在浏览器本地完成，文件不会上传到服务器</li>
                <li>部分浏览器不支持 MD5，会使用 SHA-256 代替</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
