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

// 加入房间
export async function POST(request: NextRequest) {
  try {
    const { roomId, username } = await request.json();

    if (!roomId || !username) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const client = await getRedisClient();
    const roomKey = `room:${roomId}`;
    
    // 检查房间是否存在
    const roomExists = await client.exists(roomKey);
    if (!roomExists) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 });
    }

    // 检查用户是否存在
    const userExists = await client.exists(`user:${username}`);
    if (!userExists) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 检查房间状态
    const roomStatus = await client.hGet(roomKey, 'status');
    if (roomStatus !== 'waiting') {
      return NextResponse.json({ error: '游戏已开始，无法加入' }, { status: 400 });
    }

    // 检查房间人数
    const players = await client.sMembers(`${roomKey}:players`);
    if (players.length >= 4) {
      return NextResponse.json({ error: '房间已满' }, { status: 400 });
    }

    // 检查是否已在房间
    if (players.includes(username)) {
      return NextResponse.json({ error: '已在房间中' }, { status: 400 });
    }

    // 加入房间
    await client.sAdd(`${roomKey}:players`, username);

    return NextResponse.json({ 
      success: true, 
      message: '加入成功',
      players: [...players, username]
    });
  } catch (error) {
    console.error('加入房间错误:', error);
    return NextResponse.json(
      { error: '加入失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// 退出房间
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('roomId');
    const username = searchParams.get('username');

    if (!roomId || !username) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const client = await getRedisClient();
    const roomKey = `room:${roomId}`;
    
    // 移除玩家
    await client.sRem(`${roomKey}:players`, username);
    
    // 检查房间是否还有玩家
    const players = await client.sMembers(`${roomKey}:players`);
    
    if (players.length === 0) {
      // 删除空房间
      await client.del(roomKey);
      await client.del(`${roomKey}:players`);
      await client.del(`${roomKey}:cards`);
      await client.sRem('rooms:all', roomId);
    } else {
      // 如果退出的是房主，转让房主
      const owner = await client.hGet(roomKey, 'owner');
      if (owner === username) {
        await client.hSet(roomKey, 'owner', players[0]);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '退出成功',
      players
    });
  } catch (error) {
    console.error('退出房间错误:', error);
    return NextResponse.json(
      { error: '退出失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
