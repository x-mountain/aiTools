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

// 心跳超时时间（秒）
const HEARTBEAT_TIMEOUT = 30;

// 心跳接口
export async function POST(request: NextRequest) {
  try {
    const { roomId, username } = await request.json();

    if (!roomId || !username) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const client = await getRedisClient();
    const heartbeatKey = `heartbeat:${roomId}:${username}`;
    
    // 设置心跳键，30秒过期
    await client.setEx(heartbeatKey, HEARTBEAT_TIMEOUT, Date.now().toString());
    
    console.log(`[心跳] 用户 ${username} 在房间 ${roomId} 发送心跳`);

    return NextResponse.json({ 
      success: true,
      message: '心跳成功'
    });
  } catch (error) {
    console.error('心跳错误:', error);
    return NextResponse.json(
      { error: '心跳失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// 清理超时用户的API
export async function GET(request: NextRequest) {
  try {
    const client = await getRedisClient();
    
    // 获取所有房间
    const roomIds = await client.sMembers('rooms:all');
    let cleanedUsers = 0;
    let cleanedRooms = 0;

    for (const roomId of roomIds) {
      const roomKey = `room:${roomId}`;
      const players = await client.sMembers(`${roomKey}:players`);
      
      // 检查每个玩家的心跳
      for (const username of players) {
        const heartbeatKey = `heartbeat:${roomId}:${username}`;
        const exists = await client.exists(heartbeatKey);
        
        if (!exists) {
          // 心跳超时，移除玩家
          console.log(`[清理] 用户 ${username} 在房间 ${roomId} 心跳超时，自动移除`);
          await client.sRem(`${roomKey}:players`, username);
          cleanedUsers++;
        }
      }
      
      // 检查房间是否为空
      const remainingPlayers = await client.sMembers(`${roomKey}:players`);
      if (remainingPlayers.length === 0) {
        // 删除空房间
        console.log(`[清理] 房间 ${roomId} 无玩家，自动销毁`);
        await client.del(roomKey);
        await client.del(`${roomKey}:players`);
        await client.del(`${roomKey}:cards`);
        await client.del(`${roomKey}:submissions`);
        await client.del(`${roomKey}:folds`);
        await client.del(`${roomKey}:solutions`);
        await client.sRem('rooms:all', roomId);
        cleanedRooms++;
      }
    }

    console.log(`[清理完成] 清理了 ${cleanedUsers} 个超时用户，${cleanedRooms} 个空房间`);

    return NextResponse.json({ 
      success: true,
      cleanedUsers,
      cleanedRooms
    });
  } catch (error) {
    console.error('清理错误:', error);
    return NextResponse.json(
      { error: '清理失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
