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

// 生成4张随机扑克牌（1-13）
function generateCards(): number[] {
  const cards: number[] = [];
  for (let i = 0; i < 4; i++) {
    cards.push(Math.floor(Math.random() * 13) + 1);
  }
  return cards;
}

// 验证算式是否正确（简化版：只验证结果是否为24）
function validateExpression(expression: string, cards: number[]): { valid: boolean; result?: number; error?: string } {
  try {
    // 移除空格
    const expr = expression.replace(/\s/g, '');
    
    // 检查是否只包含数字、运算符和括号
    if (!/^[\d+\-*/().]+$/.test(expr)) {
      return { valid: false, error: '表达式包含非法字符' };
    }
    
    // 提取表达式中的数字
    const numbersInExpr = expr.match(/\d+/g)?.map(Number) || [];
    
    // 检查数字数量
    if (numbersInExpr.length !== 4) {
      return { valid: false, error: '必须使用4个数字' };
    }
    
    // 检查是否使用了给定的牌（不考虑顺序）
    const sortedCards = [...cards].sort((a, b) => a - b);
    const sortedExprNumbers = [...numbersInExpr].sort((a, b) => a - b);
    
    if (JSON.stringify(sortedCards) !== JSON.stringify(sortedExprNumbers)) {
      return { valid: false, error: '必须使用给定的4张牌' };
    }
    
    // 计算结果（使用 Function 构造器更安全）
    const result = Function(`"use strict"; return (${expr})`)();
    
    // 检查结果是否为24（允许浮点误差）
    if (Math.abs(result - 24) < 0.0001) {
      return { valid: true, result };
    } else {
      return { valid: false, error: `计算结果为 ${result}，不是24` };
    }
  } catch (error) {
    return { valid: false, error: '表达式错误：' + (error as Error).message };
  }
}

// 开始游戏
export async function POST(request: NextRequest) {
  try {
    const { roomId, action, username, expression } = await request.json();

    const client = await getRedisClient();
    const roomKey = `room:${roomId}`;
    
    // 检查房间是否存在
    const roomExists = await client.exists(roomKey);
    if (!roomExists) {
      return NextResponse.json({ error: '房间不存在' }, { status: 404 });
    }

    // 开始游戏
    if (action === 'start') {
      // 检查是否是房主
      const owner = await client.hGet(roomKey, 'owner');
      if (owner !== username) {
        return NextResponse.json({ error: '只有房主可以开始游戏' }, { status: 403 });
      }

      // 检查人数（至少2人）
      const players = await client.sMembers(`${roomKey}:players`);
      if (players.length < 2) {
        return NextResponse.json({ error: '至少需要2人才能开始游戏' }, { status: 400 });
      }

      // 生成卡牌
      const cards = generateCards();
      
      // 更新房间状态
      await client.hSet(roomKey, {
        status: 'playing',
        startTime: Date.now().toString(),
        currentRound: '1'
      });
      
      // 保存卡牌
      await client.set(`${roomKey}:cards`, JSON.stringify(cards));
      
      // 清空上一轮的提交记录
      await client.del(`${roomKey}:submissions`);

      return NextResponse.json({ 
        success: true, 
        cards,
        message: '游戏开始！'
      });
    }

    // 提交答案
    if (action === 'submit') {
      if (!expression) {
        return NextResponse.json({ error: '缺少表达式' }, { status: 400 });
      }

      // 检查游戏状态
      const status = await client.hGet(roomKey, 'status');
      if (status !== 'playing') {
        return NextResponse.json({ error: '游戏未开始' }, { status: 400 });
      }

      // 检查是否已提交
      const submitted = await client.hGet(`${roomKey}:submissions`, username);
      if (submitted) {
        return NextResponse.json({ error: '您已经提交过答案' }, { status: 400 });
      }

      // 获取当前卡牌
      const cardsStr = await client.get(`${roomKey}:cards`);
      if (!cardsStr) {
        return NextResponse.json({ error: '未找到卡牌数据' }, { status: 500 });
      }
      const cards = JSON.parse(cardsStr);

      // 验证表达式
      const validation = validateExpression(expression, cards);
      
      if (!validation.valid) {
        return NextResponse.json({ 
          success: false, 
          error: validation.error 
        }, { status: 400 });
      }

      // 记录提交时间和表达式
      const submitTime = Date.now();
      await client.hSet(`${roomKey}:submissions`, username, JSON.stringify({
        expression,
        time: submitTime,
        result: validation.result
      }));

      // 获取开始时间，计算用时
      const startTime = await client.hGet(roomKey, 'startTime');
      const timeUsed = submitTime - parseInt(startTime || '0');

      // 更新用户积分
      await client.hIncrBy(`user:${username}`, 'score', 1);
      await client.hIncrBy(`user:${username}`, 'wins', 1);
      await client.hIncrBy(`user:${username}`, 'games', 1);

      // 更新房间状态为完成
      await client.hSet(roomKey, 'status', 'finished');
      await client.hSet(roomKey, 'winner', username);

      return NextResponse.json({ 
        success: true, 
        message: '恭喜你获胜！',
        winner: username,
        timeUsed,
        expression
      });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('游戏操作错误:', error);
    return NextResponse.json(
      { error: '操作失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// 获取游戏状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: '缺少房间ID' }, { status: 400 });
    }

    const client = await getRedisClient();
    const roomKey = `room:${roomId}`;
    
    const roomData = await client.hGetAll(roomKey);
    const cardsStr = await client.get(`${roomKey}:cards`);
    const cards = cardsStr ? JSON.parse(cardsStr) : null;

    return NextResponse.json({ 
      success: true, 
      status: roomData.status,
      cards,
      winner: roomData.winner || null,
      currentRound: parseInt(roomData.currentRound || '0')
    });
  } catch (error) {
    console.error('获取游戏状态错误:', error);
    return NextResponse.json(
      { error: '获取失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
