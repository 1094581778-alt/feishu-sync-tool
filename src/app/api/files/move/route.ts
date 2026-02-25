import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { sourcePaths, targetDirectory } = await request.json();

    if (!sourcePaths || !Array.isArray(sourcePaths) || sourcePaths.length === 0) {
      return NextResponse.json(
        { error: '请选择要移动的文件' },
        { status: 400 }
      );
    }

    if (!targetDirectory || typeof targetDirectory !== 'string') {
      return NextResponse.json(
        { error: '请指定目标目录' },
        { status: 400 }
      );
    }

    try {
      await fs.access(targetDirectory);
    } catch {
      try {
        await fs.mkdir(targetDirectory, { recursive: true });
      } catch (error) {
        return NextResponse.json(
          { error: '目标目录不存在且无法创建' },
          { status: 400 }
        );
      }
    }

    const movedFiles: string[] = [];
    const failedFiles: string[] = [];

    for (const sourcePath of sourcePaths) {
      try {
        const fileName = path.basename(sourcePath);
        const targetPath = path.join(targetDirectory, fileName);
        
        let finalTargetPath = targetPath;
        let counter = 1;
        
        while (true) {
          try {
            await fs.access(finalTargetPath);
            const ext = path.extname(fileName);
            const baseName = path.basename(fileName, ext);
            finalTargetPath = path.join(targetDirectory, `${baseName}_${counter}${ext}`);
            counter++;
          } catch {
            break;
          }
        }

        await fs.rename(sourcePath, finalTargetPath);
        movedFiles.push(path.basename(finalTargetPath));
      } catch (error) {
        console.error(`移动文件失败: ${sourcePath}`, error);
        failedFiles.push(path.basename(sourcePath));
      }
    }

    return NextResponse.json({
      success: true,
      movedFiles,
      failedFiles,
      message: movedFiles.length > 0 
        ? `成功移动 ${movedFiles.length} 个文件${failedFiles.length > 0 ? `，${failedFiles.length} 个文件移动失败` : ''}`
        : '所有文件移动失败'
    });
  } catch (error) {
    console.error('移动文件失败:', error);
    return NextResponse.json(
      { error: '移动文件失败' },
      { status: 500 }
    );
  }
}
