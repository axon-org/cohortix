import { CheckSquare } from 'lucide-react';

export default function MyTasksPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
        <CheckSquare className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">My Tasks</h1>
      <p className="text-muted-foreground mb-4 max-w-md">
        Personal view of all tasks assigned to you across all operations.
      </p>
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-md">
        <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
        <span className="text-sm text-muted-foreground">Coming Soon</span>
      </div>
    </div>
  );
}
