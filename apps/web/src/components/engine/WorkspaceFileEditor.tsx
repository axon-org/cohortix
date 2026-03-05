'use client';

import * as React from 'react';
import { useAgentWorkspaceFile, useUpdateWorkspaceFile } from '@/hooks/use-agent-workspace';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Pencil, FileText, Check, X, RefreshCw } from 'lucide-react';

interface WorkspaceFileEditorProps {
  cohortId: string;
  agentId: string;
  filePath: string;
}

export function WorkspaceFileEditor({ cohortId, agentId, filePath }: WorkspaceFileEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [isSaved, setIsSaved] = React.useState(false);

  const { data, isLoading, isError, error, refetch } = useAgentWorkspaceFile(
    cohortId,
    agentId,
    filePath
  );

  const {
    mutate: updateFile,
    isPending: isSaving,
    isError: isSaveError,
    error: saveError,
  } = useUpdateWorkspaceFile();

  // Reset local state when data loads
  React.useEffect(() => {
    if (data?.content) {
      setContent(data.content);
    }
  }, [data]);

  // Handle save success effect
  React.useEffect(() => {
    if (!isSaved) return;
    
    const timer = setTimeout(() => setIsSaved(false), 3000);
    return () => clearTimeout(timer);
  }, [isSaved]);

  const handleSave = () => {
    updateFile(
      { cohortId, agentId, filePath, content },
      {
        onSuccess: () => {
          setIsEditing(false);
          setIsSaved(true);
        },
      }
    );
  };

  const handleCancel = () => {
    if (data?.content) {
      setContent(data.content);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {filePath}
          </CardTitle>
          <Skeleton className="h-4 w-20" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full border-destructive/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
            <FileText className="h-4 w-4" />
            {filePath}
          </CardTitle>
          <Badge variant="destructive">Error</Badge>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Failed to load file</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message || 'Could not connect to engine workspace.'}
            </AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {filePath}
        </CardTitle>
        <div className="flex items-center gap-2">
          {isSaved && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
            >
              <Check className="mr-1 h-3 w-3" />
              Saved
            </Badge>
          )}
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
              placeholder={`# ${filePath}\n\nStart writing...`}
            />
            {isSaveError && (
              <Alert variant="destructive">
                <AlertTitle>Save failed</AlertTitle>
                <AlertDescription>
                  {(saveError as Error)?.message || 'Could not save changes.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="rounded-md border bg-muted/50 p-4 font-mono text-sm whitespace-pre-wrap min-h-[100px] max-h-[400px] overflow-y-auto">
            {data?.content || <span className="text-muted-foreground italic">Empty file</span>}
          </div>
        )}
      </CardContent>

      {isEditing && (
        <CardFooter className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
