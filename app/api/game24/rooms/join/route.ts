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

    // 检查房间状态 - 允许waiting和finished状态加入
    const roomStatus = await client.hGet(roomKey, 'status');
    if (roomStatus === 'playing') {
      return NextResponse.json({ error: '游戏进行中，无法加入' }, { status: 400 });
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
    
    // 立即设置心跳，防止被自动清理
    const heartbeatKey = `heartbeat:${roomId}:${username}`;
    await client.setEx(heartbeatKey, 30, Date.now().toString());
    console.log(`[加入房间] 为用户 ${username} 设置心跳`);
    
    // 更新房间的playerCount字段
    const newPlayerCount = players.length + 1;
    await client.hSet(roomKey, 'playerCount', newPlayerCount.toString());
    console.log(`[加入房间] 更新房间 ${roomId} 人数为: ${newPlayerCount}`);

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
    
    // 检查是否是房主
    const owner = await client.hGet(roomKey, 'owner');
    const isOwner = owner === username;
    
    // 移除玩家
    const removeResult = await client.sRem(`${roomKey}:players`, username);
    console.log(`[退出房间] 用户 ${username} 退出房间 ${roomId}，移除结果: ${removeResult}`);
    
    // 如果是房主退出，直接销毁整个房间
    if (isOwner) {
      // 删除房间相关的所有数据
      await client.del(roomKey);
      await client.del(`${roomKey}:players`);
      await client.del(`${roomKey}:cards`);
      await client.del(`${roomKey}:submissions`);
      await client.del(`${roomKey}:folds`);
      await client.del(`${roomKey}:solutions`);
      await client.sRem('rooms:all', roomId);
      
      return NextResponse.json({ 
        success: true, 
        message: '房主退出，房间已销毁',
        roomDestroyed: true,
        players: []
      });
    }
    
    // 非房主退出，检查房间是否还有玩家
    const players = await client.sMembers(`${roomKey}:players`);
    console.log(`[退出房间] 房间 ${roomId} 剩余玩家:`, players);
    
    if (players.length === 0) {
      // 删除空房间
      await client.del(roomKey);
      await client.del(`${roomKey}:players`);
      await client.del(`${roomKey}:cards`);
      await client.del(`${roomKey}:submissions`);
      await client.del(`${roomKey}:folds`);
      await client.del(`${roomKey}:solutions`);
      await client.sRem('rooms:all', roomId);
    } else {
      // 房间还有玩家，更新房间的playerCount字段
      await client.hSet(roomKey, 'playerCount', players.length.toString());
      console.log(`[退出房间] 更新房间 ${roomId} 人数为: ${players.length}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: '退出成功',
      roomDestroyed: false,
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
