'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface RoomData {
  id: string;
  name: string;
  owner: string;
  status: string;
  players: string[];
}

interface GameState {
  status: string;
  cards: number[] | null;
  winner: string | null;
}

function RoomContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('id');
  
  const [currentUser, setCurrentUser] = useState<string>('');
  const [room, setRoom] = useState<RoomData | null>(null);
  const [gameState, setGameState] = useState<GameState>({ status: 'waiting', cards: null, winner: null });
  const [expression, setExpression] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('game24_user');
    if (!user) {
      window.location.href = '/game24';
      return;
    }
    setCurrentUser(user);
    loadRoom();
    loadGameState();
  }, [roomId]);

  // 定时刷新房间和游戏状态
  useEffect(() => {
    if (currentUser && roomId) {
      const interval = setInterval(() => {
        loadRoom();
        loadGameState();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentUser, roomId]);

  const loadRoom = async () => {
    if (!roomId) return;

    try {
      const res = await fetch(`/api/game24/rooms?roomId=${roomId}`);
      const data = await res.json();
      
      if (data.success) {
        setRoom(data.room);
      } else {
        setError('房间不存在');
      }
    } catch (err) {
      console.error('加载房间失败:', err);
    }
  };

  const loadGameState = async () => {
    if (!roomId) return;

    try {
      const res = await fetch(`/api/game24/game?roomId=${roomId}`);
      const data = await res.json();
      
      if (data.success) {
        setGameState({
          status: data.status,
          cards: data.cards,
          winner: data.winner
        });
      }
    } catch (err) {
      console.error('加载游戏状态失败:', err);
    }
  };

  const handleStartGame = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/game24/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId, 
          action: 'start',
          username: currentUser
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessage('游戏开始！');
        loadGameState();
      } else {
        setError(data.error || '开始游戏失败');
      }
    } catch (err) {
      setError('网络错误: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!expression.trim()) {
      setError('请输入表达式');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/game24/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId, 
          action: 'submit',
          username: currentUser,
          expression: expression.trim()
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`🎉 ${data.message}`);
        setExpression('');
        loadGameState();
      } else {
        setError(data.error || '提交失败');
      }
    } catch (err) {
      setError('网络错误: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await fetch(`/api/game24/rooms/join?roomId=${roomId}&username=${currentUser}`, {
        method: 'DELETE'
      });
      window.location.href = '/game24';
    } catch (err) {
      console.error('退出房间失败:', err);
    }
  };

  const insertNumber = (num: number) => {
    setExpression(expression + num);
  };

  const insertOperator = (op: string) => {
    setExpression(expression + op);
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  const isOwner = currentUser === room.owner;
  const canStart = isOwner && room.players.length >= 2 && gameState.status === 'waiting';
  const isPlaying = gameState.status === 'playing';
  const isFinished = gameState.status === 'finished';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{room.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                房间ID: {room.id} | 房主: {room.owner}
              </p>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              退出房间
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 游戏区域 */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              {/* 状态信息 */}
              <div className="mb-6">
                {gameState.status === 'waiting' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-4 text-center">
                    <p className="text-yellow-800 dark:text-yellow-300 font-semibold text-lg">
                      ⏳ 等待游戏开始... ({room.players.length}/4 人)
                    </p>
                    {room.players.length < 2 && (
                      <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
                        至少需要2人才能开始游戏
                      </p>
                    )}
                  </div>
                )}

                {isPlaying && (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 text-center">
                    <p className="text-green-800 dark:text-green-300 font-semibold text-lg">
                      ⚡ 游戏进行中...
                    </p>
                  </div>
                )}

                {isFinished && gameState.winner && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4 text-center">
                    <p className="text-purple-800 dark:text-purple-300 font-semibold text-lg">
                      🏆 游戏结束！获胜者: {gameState.winner}
                    </p>
                  </div>
                )}
              </div>

              {/* 卡牌显示 */}
              {gameState.cards && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">
                    🎴 当前卡牌
                  </h3>
                  <div className="flex justify-center gap-4">
                    {gameState.cards.map((card, index) => (
                      <div
                        key={index}
                        className="w-20 h-28 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => !isFinished && insertNumber(card)}
                      >
                        <span className="text-4xl font-bold text-white">
                          {card === 1 ? 'A' : card === 11 ? 'J' : card === 12 ? 'Q' : card === 13 ? 'K' : card}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
                    点击卡牌快速输入数字
                  </p>
                </div>
              )}

              {/* 消息提示 */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-4">
                  {message}
                </div>
              )}

              {/* 开始游戏按钮 */}
              {canStart && (
                <button
                  onClick={handleStartGame}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                >
                  {loading ? '开始中...' : '🚀 开始游戏'}
                </button>
              )}

              {/* 答题区域 */}
              {isPlaying && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      输入你的表达式（例如: (1+2+3)*4）
                    </label>
                    <input
                      type="text"
                      value={expression}
                      onChange={(e) => setExpression(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                      placeholder="在此输入算式"
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-mono"
                      disabled={loading}
                    />
                  </div>

                  {/* 快捷操作按钮 */}
                  <div className="grid grid-cols-8 gap-2">
                    <button onClick={() => insertOperator('(')} className="col-span-1 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 font-bold">
                      (
                    </button>
                    <button onClick={() => insertOperator(')')} className="col-span-1 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 font-bold">
                      )
                    </button>
                    <button onClick={() => insertOperator('+')} className="col-span-1 py-3 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 font-bold">
                      +
                    </button>
                    <button onClick={() => insertOperator('-')} className="col-span-1 py-3 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 font-bold">
                      -
                    </button>
                    <button onClick={() => insertOperator('*')} className="col-span-1 py-3 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 font-bold">
                      ×
                    </button>
                    <button onClick={() => insertOperator('/')} className="col-span-1 py-3 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 font-bold">
                      ÷
                    </button>
                    <button onClick={() => setExpression('')} className="col-span-2 py-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 font-bold">
                      清空
                    </button>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '提交中...' : '✅ 提交答案'}
                  </button>
                </div>
              )}

              {/* 游戏结束后重新开始 */}
              {isFinished && isOwner && (
                <button
                  onClick={handleStartGame}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold text-lg rounded-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '开始中...' : '🔄 再来一局'}
                </button>
              )}
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 玩家列表 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <span className="mr-2">👥</span> 玩家列表
              </h3>
              <div className="space-y-2">
                {room.players.map((player) => (
                  <div
                    key={player}
                    className={`p-3 rounded-lg ${
                      player === currentUser
                        ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {player}
                      {player === room.owner && (
                        <span className="ml-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded">
                          房主
                        </span>
                      )}
                      {player === gameState.winner && (
                        <span className="ml-2 text-xs bg-green-400 text-green-900 px-2 py-1 rounded">
                          🏆
                        </span>
                      )}
                    </p>
                  </div>
                ))}
                
                {room.players.length < 4 && (
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">等待玩家加入...</p>
                  </div>
                )}
              </div>
            </div>

            {/* 游戏提示 */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-3">💡 游戏提示</h3>
              <ul className="text-sm space-y-2">
                <li>• 点击卡牌快速输入数字</li>
                <li>• 使用 +、-、×、÷ 和括号</li>
                <li>• 每张牌必须且只能使用一次</li>
                <li>• 最快算出24点的玩家获胜</li>
                <li>• 示例: (1+2+3)×4 = 24</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    }>
      <RoomContent />
    </Suspense>
  );
}
