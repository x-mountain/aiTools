"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export default function VideoCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [compressed, setCompressed] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [loadingFFmpeg, setLoadingFFmpeg] = useState(false);
  
  // 压缩选项
  const [quality, setQuality] = useState("medium");
  const [resolution, setResolution] = useState("original");
  const [outputFormat, setOutputFormat] = useState("mp4");

  const ffmpegRef = useRef<FFmpeg | null>(null);

  // 初始化 FFmpeg
  const loadFFmpeg = async () => {
    if (ffmpegRef.current || loadingFFmpeg) return;
    
    setLoadingFFmpeg(true);
    setMessage("正在加载 FFmpeg...");
    
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on("log", ({ message }) => {
        console.log(message);
      });

      ffmpeg.on("progress", ({ progress: prog }) => {
        setProgress(Math.round(prog * 100));
      });

      // 使用 CDN 加载 FFmpeg 核心文件
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setFfmpegLoaded(true);
      setMessage("FFmpeg 加载成功！");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("加载 FFmpeg 失败:", error);
      setMessage("加载 FFmpeg 失败，请刷新页面重试");
    } finally {
      setLoadingFFmpeg(false);
    }
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCompressed(null);
      setProgress(0);
      setMessage("");
    }
  };

  // 压缩视频
  const compressVideo = async () => {
    if (!file || !ffmpegRef.current) return;

    setProcessing(true);
    setProgress(0);
    setMessage("开始处理视频...");

    try {
      const ffmpeg = ffmpegRef.current;

      // 写入文件到 FFmpeg 虚拟文件系统
      const inputName = "input" + getFileExtension(file.name);
      const outputName = `output.${outputFormat}`;
      
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // 构建 FFmpeg 命令参数
      const args = buildFFmpegArgs(inputName, outputName);
      
      setMessage("正在压缩视频...");
      await ffmpeg.exec(args);

      // 读取输出文件
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: `video/${outputFormat}` });
      const url = URL.createObjectURL(blob);

      setCompressed(url);
      setMessage("压缩完成！");
      setProgress(100);
    } catch (error) {
      console.error("压缩失败:", error);
      setMessage("压缩失败: " + (error as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  // 构建 FFmpeg 命令参数
  const buildFFmpegArgs = (inputName: string, outputName: string): string[] => {
    const args = ["-i", inputName];

    // 分辨率设置
    if (resolution !== "original") {
      args.push("-vf", `scale=-2:${resolution}`);
    }

    // 质量设置（CRF值）
    const crfMap: Record<string, string> = {
      high: "18",
      medium: "23",
      low: "28",
    };
    args.push("-crf", crfMap[quality]);

    // 编码设置
    args.push(
      "-c:v", "libx264",
      "-preset", "medium",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart"
    );

    args.push(outputName);
    return args;
  };

  // 获取文件扩展名
  const getFileExtension = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext ? `.${ext}` : ".mp4";
  };

  // 下载压缩后的视频
  const downloadVideo = () => {
    if (!compressed || !file) return;

    const a = document.createElement("a");
    a.href = compressed;
    a.download = `compressed_${file.name.replace(/\.[^/.]+$/, "")}.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  useEffect(() => {
    // 组件加载时自动初始化 FFmpeg
    loadFFmpeg();
  }, []);

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

        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🎬 视频在线压缩
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              在浏览器中压缩视频，无需上传到服务器
            </p>
          </div>

          {/* FFmpeg 加载状态 */}
          {!ffmpegLoaded && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                {loadingFFmpeg ? "⏳ 正在加载视频处理引擎..." : "准备加载视频处理引擎"}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {/* 文件选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                选择视频文件
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={!ffmpegLoaded || processing}
                className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none p-2 disabled:opacity-50"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  文件大小: {formatFileSize(file.size)}
                </p>
              )}
            </div>

            {/* 压缩选项 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 质量选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  压缩质量
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  disabled={processing}
                  className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 p-2 disabled:opacity-50"
                >
                  <option value="high">高质量（文件较大）</option>
                  <option value="medium">中等质量（推荐）</option>
                  <option value="low">低质量（文件最小）</option>
                </select>
              </div>

              {/* 分辨率选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  输出分辨率
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  disabled={processing}
                  className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 p-2 disabled:opacity-50"
                >
                  <option value="original">原始分辨率</option>
                  <option value="1080">1080p</option>
                  <option value="720">720p</option>
                  <option value="480">480p</option>
                  <option value="360">360p</option>
                </select>
              </div>

              {/* 格式选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  输出格式
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  disabled={processing}
                  className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 p-2 disabled:opacity-50"
                >
                  <option value="mp4">MP4</option>
                  <option value="webm">WebM</option>
                </select>
              </div>
            </div>

            {/* 开始压缩按钮 */}
            <button
              onClick={compressVideo}
              disabled={!file || !ffmpegLoaded || processing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300"
            >
              {processing ? "压缩中..." : "开始压缩"}
            </button>

            {/* 进度条 */}
            {processing && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  {progress}% 完成
                </p>
              </div>
            )}

            {/* 消息提示 */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes("失败") || message.includes("错误")
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                    : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                }`}
              >
                <p className="text-sm">{message}</p>
              </div>
            )}

            {/* 下载按钮 */}
            {compressed && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-3">
                    ✓ 压缩完成！
                  </p>
                  <video
                    src={compressed}
                    controls
                    className="w-full rounded-lg mb-3"
                  />
                  <button
                    onClick={downloadVideo}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
                  >
                    下载压缩后的视频
                  </button>
                </div>
              </div>
            )}

            {/* 说明 */}
            <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                📝 使用说明
              </h3>
              <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                <li>所有处理在浏览器本地完成，视频不会上传到服务器</li>
                <li>首次使用需要加载约 30MB 的处理引擎，请耐心等待</li>
                <li>支持大多数常见视频格式：MP4、AVI、MOV、MKV 等</li>
                <li>处理大文件时可能需要较长时间，取决于您的设备性能</li>
                <li>建议使用桌面浏览器以获得最佳性能</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
