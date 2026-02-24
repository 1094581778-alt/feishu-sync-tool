import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface CreateNewTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTable: (tableName: string) => Promise<void>;
  loading?: boolean;
}

export function CreateNewTableDialog({
  open,
  onOpenChange,
  onCreateTable,
  loading = false,
}: CreateNewTableDialogProps) {
  const [tableName, setTableName] = useState('');

  const handleCreate = async () => {
    if (tableName.trim()) {
      await onCreateTable(tableName.trim());
      setTableName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && tableName.trim()) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-purple-600" />
            新建工作表
          </DialogTitle>
          <DialogDescription>
            创建新的飞书多维表格工作表，并自动添加未匹配字段
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="table-name">工作表名称</Label>
            <Input
              id="table-name"
              placeholder="请输入工作表名称"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setTableName('');
            }}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!tableName.trim() || loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                创建工作表
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
