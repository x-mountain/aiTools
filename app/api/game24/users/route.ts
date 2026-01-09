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

// 用户注册
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || username.trim().length === 0) {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }

    const client = await getRedisClient();
    
    // 检查用户是否已存在
    const exists = await client.exists(`user:${username}`);
    if (exists) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

    // 创建用户
    const userId = `user:${username}`;
    await client.hSet(userId, {
      username,
      score: '0',
      wins: '0',
      games: '0',
      createdAt: new Date().toISOString()
    });

    // 添加到用户列表
    await client.sAdd('users:all', username);

    return NextResponse.json({ 
      success: true, 
      user: { username, score: 0, wins: 0, games: 0 } 
    });
  } catch (error) {
    console.error('用户注册错误:', error);
    return NextResponse.json(
      { error: '注册失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// 获取用户信息
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: '缺少用户名' }, { status: 400 });
    }

    const client = await getRedisClient();
    const userId = `user:${username}`;
    
    const exists = await client.exists(userId);
    if (!exists) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const userData = await client.hGetAll(userId);
    
    return NextResponse.json({ 
      success: true, 
      user: {
        username: userData.username,
        score: parseInt(userData.score || '0'),
        wins: parseInt(userData.wins || '0'),
        games: parseInt(userData.games || '0'),
        createdAt: userData.createdAt
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json(
      { error: '获取失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
