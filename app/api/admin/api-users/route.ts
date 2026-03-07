import { NextRequest, NextResponse } from 'next/server';
import { getApiUsers, deleteApiUser } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await getApiUsers({ page, pageSize });

    return NextResponse.json({
      code: 200,
      msg: 'success',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        code: 500,
        msg: error.message || '获取 API 用户列表失败',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publicIp = searchParams.get('public_ip');

    if (!publicIp) {
      return NextResponse.json(
        { code: 400, msg: '缺少 public_ip 参数' },
        { status: 400 }
      );
    }

    await deleteApiUser(publicIp);

    return NextResponse.json({
      code: 200,
      msg: '删除成功',
    });
  } catch (error: any) {
    return NextResponse.json(
      { code: 500, msg: error.message || '删除失败' },
      { status: 500 }
    );
  }
}

