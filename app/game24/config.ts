/*
 * @Author: mountain lijiyue@povison.com
 * @Date: 2026-01-09 22:57:31
 * @LastEditors: mountain lijiyue@povison.com
 * @LastEditTime: 2026-01-09 23:03:02
 * @Description: 待补充
 * 
 */
/**
 * 24点游戏配置文件
 */

/**
 * 自动刷新间隔配置（毫秒）
 * - 设置为 0：禁用自动刷新，启用手动刷新模式
 * - 设置为正整数：启用自动刷新，按指定间隔刷新
 * 
 * 推荐值：
 * - 1000 (1秒)：实时性要求高的场景
 * - 2000 (2秒)：平衡性能和实时性
 * - 3000-5000 (3-5秒)：降低服务器压力
 * - 0：完全由用户控制刷新时机
 */
export const AUTO_REFRESH_INTERVAL: number = 2000;
