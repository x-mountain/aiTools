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

// 分数类，用于精确计算
class Fraction {
  numerator: number;   // 分子
  denominator: number; // 分母

  constructor(numerator: number, denominator: number = 1) {
    if (denominator === 0) {
      throw new Error('分母不能为0');
    }
    // 约分
    const gcd = this.gcd(Math.abs(numerator), Math.abs(denominator));
    this.numerator = numerator / gcd;
    this.denominator = denominator / gcd;
    // 确保分母为正
    if (this.denominator < 0) {
      this.numerator = -this.numerator;
      this.denominator = -this.denominator;
    }
  }

  // 最大公约数
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  // 加法
  add(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator
    );
  }

  // 减法
  subtract(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator - other.numerator * this.denominator,
      this.denominator * other.denominator
    );
  }

  // 乘法
  multiply(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.numerator,
      this.denominator * other.denominator
    );
  }

  // 除法
  divide(other: Fraction): Fraction {
    if (other.numerator === 0) {
      throw new Error('不能除以0');
    }
    return new Fraction(
      this.numerator * other.denominator,
      this.denominator * other.numerator
    );
  }

  // 判断是否等于24
  equals24(): boolean {
    return this.numerator === 24 && this.denominator === 1;
  }

  // 转换为数值
  toNumber(): number {
    return this.numerator / this.denominator;
  }
}

// 24点求解算法（使用分数精确计算）
function solve24(cards: number[]): string[] {
  const solutions: Set<string> = new Set();
  const target = 24;

  // 递归计算所有可能的表达式
  function calculate(nums: Fraction[], exprs: string[]): void {
    if (nums.length === 1) {
      if (nums[0].equals24()) {
        // 验证表达式不包含小数
        const expr = exprs[0];
        try {
          const result = Function(`"use strict"; return (${expr})`)();
          // 必须精确等于24（不使用误差范围）
          if (result === 24) {
            solutions.add(expr);
          }
        } catch (e) {
          // 忽略计算错误的表达式
        }
      }
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      for (let j = 0; j < nums.length; j++) {
        if (i === j) continue;

        const a = nums[i];
        const b = nums[j];
        const exprA = exprs[i];
        const exprB = exprs[j];

        const remaining = nums.filter((_, idx) => idx !== i && idx !== j);
        const remainingExprs = exprs.filter((_, idx) => idx !== i && idx !== j);

        // 加法
        try {
          calculate([...remaining, a.add(b)], [...remainingExprs, `(${exprA}+${exprB})`]);
        } catch (e) { /* 忽略错误 */ }

        // 减法
        try {
          calculate([...remaining, a.subtract(b)], [...remainingExprs, `(${exprA}-${exprB})`]);
        } catch (e) { /* 忽略错误 */ }

        // 乘法
        try {
          calculate([...remaining, a.multiply(b)], [...remainingExprs, `(${exprA}*${exprB})`]);
        } catch (e) { /* 忽略错误 */ }

        // 除法
        try {
          if (b.numerator !== 0) {
            const result = a.divide(b);
            // 只保留结果为整数的除法表达式
            if (result.denominator === 1 || nums.length > 1) {
              calculate([...remaining, result], [...remainingExprs, `(${exprA}/${exprB})`]);
            }
          }
        } catch (e) { /* 忽略除以0的错误 */ }
      }
    }
  }

  // 生成所有排列
  function permute(arr: number[]): number[][] {
    if (arr.length <= 1) return [arr];
    const result: number[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
      const perms = permute(rest);
      for (const perm of perms) {
        result.push([arr[i], ...perm]);
      }
    }
    return result;
  }

  // 尝试所有排列
  const perms = permute(cards);
  for (const perm of perms) {
    const fractions = perm.map(n => new Fraction(n));
    const expressions = perm.map(String);
    calculate(fractions, expressions);
  }

  // 过滤掉包含小数的解
  const validSolutions = Array.from(solutions).filter(expr => {
    try {
      const result = Function(`"use strict"; return (${expr})`)();
      // 精确等于24，不允许有任何误差
      return result === 24 && !expr.includes('.');
    } catch (e) {
      return false;
    }
  });

  return validSolutions.slice(0, 5); // 返回前5个解
}

// 简化表达式显示（移除不必要的括号）
function simplifyExpression(expr: string): string {
  // 这里可以添加更复杂的简化逻辑
  return expr.replace(/\(([\d.]+)\)/g, '$1');
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
      
      // 清空上一轮的提交记录和弃牌记录
      await client.del(`${roomKey}:submissions`);
      await client.del(`${roomKey}:folds`);

      return NextResponse.json({ 
        success: true, 
        cards,
        message: '游戏开始！'
      });
    }

    // 弃牌
    if (action === 'fold') {
      // 检查游戏状态
      const status = await client.hGet(roomKey, 'status');
      if (status !== 'playing') {
        return NextResponse.json({ error: '游戏未开始' }, { status: 400 });
      }

      // 检查是否已弃牌
      const alreadyFolded = await client.sIsMember(`${roomKey}:folds`, username);
      if (alreadyFolded) {
        return NextResponse.json({ error: '您已经弃牌' }, { status: 400 });
      }

      // 记录弃牌
      await client.sAdd(`${roomKey}:folds`, username);
      
      // 获取所有玩家和弃牌玩家
      const players = await client.sMembers(`${roomKey}:players`);
      const foldedPlayers = await client.sMembers(`${roomKey}:folds`);
      
      // 判断是否所有人都弃牌（和局）
      if (foldedPlayers.length === players.length) {
        // 所有人弃牌，和局
        // 获取当前卡牌并求解
        const cardsStr = await client.get(`${roomKey}:cards`);
        let solutions: string[] = [];
        let hasAnswer = false;
        
        if (cardsStr) {
          const cards = JSON.parse(cardsStr);
          solutions = solve24(cards);
          hasAnswer = solutions.length > 0;
          
          // 保存答案到Redis
          await client.set(`${roomKey}:solutions`, JSON.stringify({
            hasAnswer,
            solutions: hasAnswer ? solutions : [],
            cards
          }));
        }
        
        await client.hSet(roomKey, 'status', 'finished');
        await client.hSet(roomKey, 'winner', 'draw');
        
        // 更新所有玩家的游戏局数
        for (const player of players) {
          await client.hIncrBy(`user:${player}`, 'games', 1);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: '双方都选择弃牌，和局！',
          isDraw: true,
          hasAnswer,
          solutions: hasAnswer ? solutions : [],
          noSolution: !hasAnswer
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: '弃牌成功，对方可以继续作答',
        foldedCount: foldedPlayers.length,
        totalPlayers: players.length
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

      // 检查是否已弃牌
      const hasFolded = await client.sIsMember(`${roomKey}:folds`, username);
      if (hasFolded) {
        return NextResponse.json({ error: '您已弃牌，不能再提交答案' }, { status: 400 });
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
      
      // 更新其他玩家的游戏局数（未弃牌的玩家）
      const players = await client.sMembers(`${roomKey}:players`);
      const foldedPlayers = await client.sMembers(`${roomKey}:folds`);
      for (const player of players) {
        if (player !== username && !foldedPlayers.includes(player)) {
          await client.hIncrBy(`user:${player}`, 'games', 1);
        }
      }

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
    const foldedPlayers = await client.sMembers(`${roomKey}:folds`);
    
    // 获取答案信息（如果是和局）
    let solutionData = null;
    if (roomData.status === 'finished' && roomData.winner === 'draw') {
      const solutionsStr = await client.get(`${roomKey}:solutions`);
      if (solutionsStr) {
        solutionData = JSON.parse(solutionsStr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      status: roomData.status,
      cards,
      winner: roomData.winner || null,
      currentRound: parseInt(roomData.currentRound || '0'),
      foldedPlayers,
      solutionData
    });
  } catch (error) {
    console.error('获取游戏状态错误:', error);
    return NextResponse.json(
      { error: '获取失败: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
