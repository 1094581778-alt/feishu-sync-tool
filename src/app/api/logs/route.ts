import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { LogLevel, OperationType, OperationResult } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 解析查询参数
    const startTime = searchParams.get('startTime') || undefined;
    const endTime = searchParams.get('endTime') || undefined;
    const operationType = searchParams.get('operationType') as OperationType | undefined;
    const operationResult = searchParams.get('operationResult') as OperationResult | undefined;
    const level = searchParams.get('level') ? parseInt(searchParams.get('level')!) as LogLevel : undefined;
    const category = searchParams.get('category') || undefined;
    const module = searchParams.get('module') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    
    // 查询日志
    const logs = logger.queryLogs({
      startTime,
      endTime,
      operationType,
      operationResult,
      level,
      category,
      module,
      limit,
    });
    
    // 获取统计信息
    const statistics = logger.getLogStatistics();
    
    return NextResponse.json({
      success: true,
      data: {
        logs,
        statistics,
        total: logs.length,
        queryParams: {
          startTime,
          endTime,
          operationType,
          operationResult,
          level,
          category,
          module,
          limit,
        },
      },
    });
  } catch (error) {
    logger.error('API_ERROR', '查询日志失败', error);
    
    return NextResponse.json({
      success: false,
      error: '查询日志失败',
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clearAll = searchParams.get('clearAll') === 'true';
    
    if (clearAll) {
      logger.clear();
      return NextResponse.json({
        success: true,
        message: '所有日志已清空',
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '请提供 clearAll=true 参数来清空日志',
    }, { status: 400 });
  } catch (error) {
    logger.error('API_ERROR', '清空日志失败', error);
    
    return NextResponse.json({
      success: false,
      error: '清空日志失败',
      message: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}