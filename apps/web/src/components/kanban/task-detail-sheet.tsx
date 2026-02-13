'use client'

import React, { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { type Operation } from '@/lib/api/client'
import { format } from 'date-fns'
import { 
  Calendar, 
  User, 
  Tag, 
  Clock, 
  MessageSquare, 
  Activity as ActivityIcon,
  Send
} from 'lucide-react'
import { useComments, useCreateComment, useActivity } from '@/hooks/use-comments'

interface TaskDetailSheetProps {
  task: Operation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailSheet({ task, open, onOpenChange }: TaskDetailSheetProps) {
  const [comment, setComment] = useState('')
  const { data: commentsData } = useComments('operation', task?.id || '')
  const { data: activityData } = useActivity('operation', task?.id || '')
  const createCommentMutation = useCreateComment()

  if (!task) return null

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    createCommentMutation.mutate({
      content: comment,
      entityType: 'operation',
      entityId: task.id,
    }, {
      onSuccess: () => setComment(''),
    })
  }

  const priorityColor = {
    planning: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    active: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    on_hold: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    archived: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  }[task.status]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col h-full p-0 gap-0 border-l border-border bg-[#0B0B0C]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <SheetHeader className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={priorityColor}>
                {task.status.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {task.id.slice(0, 8)}
              </span>
            </div>
            <SheetTitle className="text-2xl font-semibold leading-tight">
              {task.name}
            </SheetTitle>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground w-16">Owner</span>
                <div className="flex items-center gap-1.5 font-medium">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={`https://avatar.vercel.sh/${task.ownerId}`} />
                    <AvatarFallback>{task.ownerId.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span>{task.ownerId.slice(0, 8)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground w-16">Due</span>
                <span className="font-medium">
                  {task.targetDate ? format(new Date(task.targetDate), 'PPP') : 'No date'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground w-16">Mission</span>
                <span className="font-medium truncate">
                  {task.missionId ? task.missionId.slice(0, 8) : 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground w-16">Created</span>
                <span className="font-medium">
                  {format(new Date(task.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Description</h3>
            <div className="text-sm leading-relaxed prose prose-invert max-w-none bg-secondary/20 rounded-lg p-4 min-h-[100px] border border-border/50">
              {task.description || 'No description provided.'}
            </div>
          </div>

          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-6">
              <TabsTrigger 
                value="comments" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 py-2 text-sm flex gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger 
                value="activity" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none px-0 py-2 text-sm flex gap-2"
              >
                <ActivityIcon className="w-4 h-4" />
                Activity
              </TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="pt-4 space-y-6">
              <div className="space-y-4">
                {commentsData?.data?.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={c.author_avatar_url} />
                      <AvatarFallback>{c.author_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{c.author_name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {format(new Date(c.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
                {(!commentsData?.data || commentsData.data.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="activity" className="pt-4">
              <div className="space-y-4">
                {activityData?.data?.map((a) => (
                  <div key={a.id} className="flex gap-3 items-start relative pb-4 last:pb-0">
                    <div className="mt-1 w-2 h-2 rounded-full bg-border relative z-10" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-medium text-foreground">{a.actor_name}</span>
                        <span className="text-muted-foreground">{a.action}</span>
                      </div>
                      <p className="text-[13px] text-muted-foreground">
                        {a.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        {format(new Date(a.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                {(!activityData?.data || activityData.data.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No activity logged.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 border-t border-border bg-card/50">
          <form onSubmit={handleAddComment} className="relative">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[100px] pr-12 resize-none bg-background focus:ring-1 focus:ring-primary/20"
            />
            <Button 
              type="submit" 
              size="sm" 
              className="absolute bottom-3 right-3 h-8 w-8 rounded-md p-0"
              disabled={!comment.trim() || createCommentMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
