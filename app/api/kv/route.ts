import { createClient } from 'redis';
import { NextRequest, NextResponse } from 'next/server';

// 创建 Redis 客户端单例
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

// GET - 读取数据
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: '缺少 key 参数' }, { status: 400 });
  }

  try {
    const client = await getRedisClient();
    const value = await client.get(key);
    
    // 尝试解析 JSON
    let parsedValue = value;
    if (value && typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // 不是 JSON，保持原值
      }
    }
    
    return NextResponse.json({ success: true, key, value: parsedValue });
  } catch (error) {
    console.error('Redis GET 错误:', error);
    return NextResponse.json(
      { error: '读取失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - 写入数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, ttl } = body;

    if (!key) {
      return NextResponse.json({ error: '缺少 key 参数' }, { status: 400 });
    }

    const client = await getRedisClient();
    
    // 将对象转换为 JSON 字符串
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : String(value);

    if (ttl) {
      // 带过期时间
      await client.setEx(key, parseInt(ttl), valueToStore);
    } else {
      // 不过期
      await client.set(key, valueToStore);
    }

    return NextResponse.json({ success: true, key, value });
  } catch (error) {
    console.error('Redis SET 错误:', error);
    return NextResponse.json(
      { error: '写入失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - 删除数据
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: '缺少 key 参数' }, { status: 400 });
  }

  try {
    const client = await getRedisClient();
    await client.del(key);
    return NextResponse.json({ success: true, key, message: '删除成功' });
  } catch (error) {
    console.error('Redis DELETE 错误:', error);
    return NextResponse.json(
      { error: '删除失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
