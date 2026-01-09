import { createClient } from 'redis';
import { NextRequest, NextResponse } from 'next/server';

let redis: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redis) {
    redis = createClient({ 
      url: process.env.REDIS_URL || process.env.KV_REST_API_URL
    });
    redis.on('error', (err: Error) => console.error('Redis Client Error', err));
    await redis.connect();
  }
  return redis;
}

// 获取排行榜
export async function GET() {
  try {
    const client = await getRedisClient();
    
    // 获取所有用户
    const usernames = await client.sMembers('users:all');
    const users = [];

    for (const username of usernames) {
      const userData = await client.hGetAll(`user:${username}`);
      users.push({
        username: userData.username,
        score: parseInt(userData.score || '0'),
        wins: parseInt(userData.wins || '0'),
        games: parseInt(userData.games || '0'),
        winRate: parseInt(userData.games || '0') > 0 
          ? ((parseInt(userData.wins || '0') / parseInt(userData.games || '0')) * 100).toFixed(1)
          : '0.0'
      });
    }

    // 按积分排序
    users.sort((a, b) => b.score - a.score);

    // 添加排名
    const rankedUsers = users.map((user, index) => ({
      rank: index + 1,
      ...user
    }));

    return NextResponse.json({ 
      success: true, 
      leaderboard: rankedUsers 
    });
  } catch (error) {
    console.error('获取排行榜错误:', error);
    return NextResponse.json(
      { error: '获取失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
