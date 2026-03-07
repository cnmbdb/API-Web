import { NextRequest, NextResponse } from 'next/server';
import { getServers, deleteServer } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await getServers({ page, pageSize });

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 500,
        msg: error.message || '获取服务器列表失败',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceHost = searchParams.get('source_host');

    if (!sourceHost) {
      return NextResponse.json(
        { code: 400, msg: '缺少 source_host 参数' },
        { status: 400 }
      );
    }

    const deleted = await deleteServer(sourceHost);

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

