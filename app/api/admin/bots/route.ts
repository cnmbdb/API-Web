import { NextRequest, NextResponse } from 'next/server';
import { getBotConnectionsGrouped, deleteBotConnection } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const runtimeStatus = (searchParams.get('runtimeStatus') as 'online' | 'offline' | null) || undefined;

    // 新模式：按服务器 IP 分组
    const result = await getBotConnectionsGrouped({
      page,
      pageSize,
      runtimeStatus,
    });

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 500,
        msg: error.message || '获取机器人连接失败',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { code: 400, msg: '缺少 id 参数' },
        { status: 400 }
      );
    }

    const deleted = await deleteBotConnection(parseInt(id));

    return NextResponse.json({
      code: deleted ? 200 : 404,
      msg: deleted ? '删除成功' : '记录不存在',
    });
  } catch (error: any) {
    return NextResponse.json(
      { code: 500, msg: error.message || '删除失败' },
      { status: 500 }
    );
  }
}
