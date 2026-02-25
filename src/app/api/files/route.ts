import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json(
        { error: '文件路径不能为空' },
        { status: 400 }
      );
    }

    try {
      const stats = await fs.stat(filePath);
      if (!stats.isDirectory()) {
        return NextResponse.json(
          { error: '路径不是一个目录' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: '目录不存在或无法访问' },
        { status: 400 }
      );
    }

    const entries = await fs.readdir(filePath, { withFileTypes: true });
    const files: FileInfo[] = [];

    for (const entry of entries) {
      const entryPath = path.join(filePath, entry.name);
      const stats = await fs.stat(entryPath);

      files.push({
        name: entry.name,
        path: entryPath,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isDirectory: entry.isDirectory(),
      });
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error('读取文件列表失败:', error);
    return NextResponse.json(
      { error: '读取文件列表失败' },
      { status: 500 }
    );
  }
}
