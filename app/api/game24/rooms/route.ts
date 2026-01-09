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

// 检查是否需要执行清理（每10秒最多清理一次）
async function shouldPerformCleanup(client: any): Promise<boolean> {
  const lastCleanupKey = 'system:last_cleanup';
  const lastCleanup = await client.get(lastCleanupKey);
  
  if (!lastCleanup) {
    // 从未清理过，执行清理
    await client.setEx(lastCleanupKey, 10, Date.now().toString());
    return true;
  }
  
  const lastTime = parseInt(lastCleanup);
  const now = Date.now();
  
  // 如果距离上次清理超过10秒，则执行清理
  if (now - lastTime > 10000) {
    await client.setEx(lastCleanupKey, 10, Date.now().toString());
    return true;
  }
  
  return false;
}

// 清理超时用户和空房间的函数
async function cleanupInactiveUsersAndRooms(client: any) {
  try {
    const roomIds = await client.sMembers('rooms:all');

    for (const roomId of roomIds) {
      const roomKey = `room:${roomId}`;
      const players = await client.sMembers(`${roomKey}:players`);
      
      // 检查每个玩家的心跳
      for (const username of players) {
        const heartbeatKey = `heartbeat:${roomId}:${username}`;
        const exists = await client.exists(heartbeatKey);
        
        if (!exists) {
          // 心跳超时，移除玩家
          console.log(`[自动清理] 用户 ${username} 在房间 ${roomId} 心跳超时，自动移除`);
          await client.sRem(`${roomKey}:players`, username);
        }
      }
      
      // 检查房间是否为空
      const remainingPlayers = await client.sMembers(`${roomKey}:players`);
      if (remainingPlayers.length === 0) {
        // 删除空房间
        console.log(`[自动清理] 房间 ${roomId} 无玩家，自动销毁`);
        await client.del(roomKey);
        await client.del(`${roomKey}:players`);
        await client.del(`${roomKey}:cards`);
        await client.del(`${roomKey}:submissions`);
        await client.del(`${roomKey}:folds`);
        await client.del(`${roomKey}:solutions`);
        await client.sRem('rooms:all', roomId);
      } else if (remainingPlayers.length !== players.length) {
        // 有玩家被清理，更新房间人数
        await client.hSet(roomKey, 'playerCount', remainingPlayers.length.toString());
        console.log(`[自动清理] 更新房间 ${roomId} 人数为: ${remainingPlayers.length}`);
      }
    }
  } catch (error) {
    console.error('清理错误:', error);
  }
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
      maxPlayers: '4',
      playerCount: '1' // 初始化为1（房主）
    });

    // 添加房主到玩家列表
    await client.sAdd(`${roomKey}:players`, username);
    
    // 立即设置房主的心跳，防止被自动清理
    const heartbeatKey = `heartbeat:${roomId}:${username}`;
    await client.setEx(heartbeatKey, 30, Date.now().toString());
    console.log(`[创建房间] 为房主 ${username} 设置心跳`);
    
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

    // 先清理超时用户和空房间（但不要每次都清理，防止误删）
    // 只有在需要时才清理，比如每10秒一次
    const shouldCleanup = await shouldPerformCleanup(client);
    if (shouldCleanup) {
      await cleanupInactiveUsersAndRooms(client);
    }

    // 获取所有房间
    const roomIds = await client.sMembers('rooms:all');
    const rooms = [];

    for (const id of roomIds) {
      const roomKey = `room:${id}`;
      const roomData = await client.hGetAll(roomKey);
      const players = await client.sMembers(`${roomKey}:players`);
      
      console.log(`[获取房间列表] 房间 ${id} 玩家:`, players);
      
      // 返回等待中和已结束的房间（不返回游戏中的房间）
      if (roomData.status === 'waiting' || roomData.status === 'finished') {
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
