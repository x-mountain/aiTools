'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AUTO_REFRESH_INTERVAL } from './config';

interface Room {
  id: string;
  name: string;
  owner: string;
  status: string;
  playerCount: number;
  players: string[];
}

interface LeaderboardUser {
  rank: number;
  username: string;
  score: number;
  wins: number;
  games: number;
  winRate: string;
}

export default function Game24Page() {
  const [currentUser, setCurrentUser] = useState<string>('');
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // 从 localStorage 获取当前用户
    const user = localStorage.getItem('game24_user');
    if (user) {
      setCurrentUser(user);
      // 强制刷新房间列表，不使用缓存
      loadRooms();
      loadLeaderboard();
    } else {
      setShowRegister(true);
    }
  }, []);

  // 定时刷新房间列表（仅当配置的刷新间隔 > 0 时启用）
  useEffect(() => {
    if (currentUser && !showCreateRoom && AUTO_REFRESH_INTERVAL > 0) {
      const interval = setInterval(loadRooms, AUTO_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [currentUser, showCreateRoom]);

  const loadRooms = async () => {
    try {
      // 添加时间戳参数防止缓存
      const res = await fetch(`/api/game24/rooms?_t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        console.log('[大厅] 加载房间列表:', data.rooms);
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error('加载房间失败:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const res = await fetch('/api/game24/leaderboard');
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('加载排行榜失败:', err);
    }
  };

  // 手动刷新
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRooms(), loadLeaderboard()]);
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/game24/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('game24_user', username.trim());
        setCurrentUser(username.trim());
        setShowRegister(false);
        loadRooms();
        loadLeaderboard();
      } else {
        setError(data.error || '注册失败');
      }
    } catch (err) {
      setError('网络错误: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError('请输入房间名称');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/game24/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: currentUser, 
          roomName: roomName.trim() 
        })
      });

      const data = await res.json();

      if (data.success) {
        // 跳转到房间页面
        window.location.href = `/game24/room?id=${data.room.id}`;
      } else {
        setError(data.error || '创建房间失败');
      }
    } catch (err) {
      setError('网络错误: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/game24/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, username: currentUser })
      });

      const data = await res.json();

      if (data.success) {
        // 跳转到房间页面
        window.location.href = `/game24/room?id=${roomId}`;
      } else {
        setError(data.error || '加入房间失败');
      }
    } catch (err) {
      setError('网络错误: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('game24_user');
    setCurrentUser('');
    setShowRegister(true);
  };

  // 注册界面
  if (showRegister) {
    return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎮 24点游戏</h1>
          <p className="text-gray-600">使用4张牌算出24点，最快者获胜！</p>
        </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                placeholder="请输入用户名"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '注册中...' : '开始游戏'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-800">
              ← 返回首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 主界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-full overflow-x-hidden">
        {/* 顶部导航 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white truncate">🎮 24点游戏大厅</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 truncate">
                当前玩家: <span className="font-semibold text-purple-600 dark:text-purple-400">{currentUser}</span>
                {AUTO_REFRESH_INTERVAL === 0 && (
                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    手动刷新模式
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2 md:gap-3 flex-shrink-0">
              {AUTO_REFRESH_INTERVAL === 0 && (
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="px-3 md:px-4 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {refreshing ? '🔄 刷新中...' : '🔄 刷新'}
                </button>
              )}
              <Link 
                href="/"
                className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors whitespace-nowrap"
              >
                返回首页
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 md:px-4 py-2 text-sm md:text-base bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          {/* 房间列表 */}
          <div className="lg:col-span-2 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">🏠 游戏房间</h2>
                <button
                  onClick={() => {
                    setShowCreateRoom(true);
                    setRoomName('');
                    setError('');
                  }}
                  className="px-4 md:px-6 py-2 text-sm md:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all whitespace-nowrap"
                >
                  + 创建房间
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              {showCreateRoom && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-3 text-sm md:text-base">创建新房间</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                      placeholder="输入房间名称"
                      className="flex-1 px-4 py-2 text-sm md:text-base border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-white min-w-0"
                      disabled={loading}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleCreateRoom}
                        disabled={loading}
                        className="flex-1 sm:flex-none px-4 md:px-6 py-2 text-sm md:text-base bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {loading ? '创建中...' : '创建'}
                      </button>
                      <button
                        onClick={() => setShowCreateRoom(false)}
                        className="flex-1 sm:flex-none px-4 md:px-6 py-2 text-sm md:text-base bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors whitespace-nowrap"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {rooms.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p className="text-lg">暂无房间</p>
                    <p className="text-sm mt-2">点击"创建房间"开始游戏</p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white truncate">
                            {room.name}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">
                            房主: {room.owner} | 人数: {room.playerCount}/4
                          </p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {room.players.map((player) => (
                              <span
                                key={player}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded"
                              >
                                {player}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={loading || room.playerCount >= 4}
                          className="w-full sm:w-auto px-4 md:px-6 py-2 text-sm md:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {room.playerCount >= 4 ? '已满' : '加入'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 排行榜 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="mr-2">🏆</span> 排行榜
              </h2>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((user) => (
                  <div
                    key={user.username}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      user.username === currentUser
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${
                        user.rank === 1 ? 'text-yellow-500' :
                        user.rank === 2 ? 'text-gray-400' :
                        user.rank === 3 ? 'text-orange-600' :
                        'text-gray-500 dark:text-gray-400'
                      }`}>
                        {user.rank === 1 ? '🥇' :
                         user.rank === 2 ? '🥈' :
                         user.rank === 3 ? '🥉' :
                         `#${user.rank}`}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          胜率: {user.winRate}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {user.score}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.wins}胜/{user.games}局
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {leaderboard.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>暂无排名</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 游戏规则 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">📖 游戏规则</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="space-y-2">
              <p>• 每个房间最多4人，最少2人可开始游戏</p>
              <p>• 游戏开始后，系统随机发4张扑克牌（1-13）</p>
              <p>• 使用加减乘除和括号，让4张牌计算结果为24</p>
            </div>
            <div className="space-y-2">
              <p>• 最快提交正确答案的玩家获胜，得1分</p>
              <p>• 排行榜按总积分排序</p>
              <p>• 示例：2 3 4 5 → (2+3+4)×5-21 = 24</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
