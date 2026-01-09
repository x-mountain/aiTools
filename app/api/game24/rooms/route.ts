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

// 生成随机房间ID
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 创建房间
export async function POST(request: NextRequest) {
  try {
    const { username, roomName } = await request.json();

    if (!username || !roomName) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const client = await getRedisClient();
    
    // 验证用户存在
    const userExists = await client.exists(`user:${username}`);
    if (!userExists) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const roomId = generateRoomId();
    const roomKey = `room:${roomId}`;

    // 创建房间
    await client.hSet(roomKey, {
      id: roomId,
      name: roomName,
      owner: username,
      status: 'waiting', // waiting, playing, finished
      createdAt: new Date().toISOString(),
      currentRound: '0',
      maxPlayers: '4'
    });

    // 添加房主到玩家列表
    await client.sAdd(`${roomKey}:players`, username);
    
    // 添加到房间列表
    await client.sAdd('rooms:all', roomId);

    return NextResponse.json({ 
      success: true, 
      room: { 
        id: roomId, 
        name: roomName, 
        owner: username,
        status: 'waiting',
        players: [username]
      } 
    });
  } catch (error) {
    console.error('创建房间错误:', error);
    return NextResponse.json(
      { error: '创建失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// 获取房间列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('roomId');

    const client = await getRedisClient();

    // 获取单个房间
    if (roomId) {
      const roomKey = `room:${roomId}`;
      const exists = await client.exists(roomKey);
      
      if (!exists) {
        return NextResponse.json({ error: '房间不存在' }, { status: 404 });
      }

      const roomData = await client.hGetAll(roomKey);
      const players = await client.sMembers(`${roomKey}:players`);
      
      return NextResponse.json({ 
        success: true, 
        room: {
          ...roomData,
          players,
          currentRound: parseInt(roomData.currentRound || '0')
        }
      });
    }

    // 获取所有房间
    const roomIds = await client.sMembers('rooms:all');
    const rooms = [];

    for (const id of roomIds) {
      const roomKey = `room:${id}`;
      const roomData = await client.hGetAll(roomKey);
      const players = await client.sMembers(`${roomKey}:players`);
      
      // 只返回等待中的房间
      if (roomData.status === 'waiting') {
        rooms.push({
          ...roomData,
          players,
          playerCount: players.length,
          currentRound: parseInt(roomData.currentRound || '0')
        });
      }
    }

    return NextResponse.json({ success: true, rooms });
  } catch (error) {
    console.error('获取房间错误:', error);
    return NextResponse.json(
      { error: '获取失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
