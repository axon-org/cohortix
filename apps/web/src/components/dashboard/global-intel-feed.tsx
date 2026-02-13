'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Sparkles, 
  Plus, 
  ExternalLink, 
  Tag as TagIcon,
  MessageSquare,
  Clock,
  ChevronRight
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useInsights } from '@/hooks/use-insights'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function GlobalIntelFeed() {
  const { data: insightsData, isLoading } = useInsights()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col h-full shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm tracking-tight">Global Intel</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-[11px] font-medium gap-1 text-primary hover:text-primary hover:bg-primary/10 px-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Insight
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-1 space-y-1">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full mb-1" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))
        ) : insightsData?.data?.map((insight) => (
          <div 
            key={insight.id} 
            className="group p-3 rounded-lg hover:bg-secondary/30 transition-all border border-transparent hover:border-border cursor-pointer relative"
          >
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0 border border-border/50">
                <AvatarImage src={insight.ally_avatar_url} />
                <AvatarFallback className="text-[10px]">{insight.ally_name?.slice(0, 2).toUpperCase() || 'AI'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-[13px] leading-tight text-foreground truncate group-hover:text-primary transition-colors">
                    {insight.title}
                  </h3>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {insight.content}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  {insight.source && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[80px]">{insight.source}</span>
                    </div>
                  )}
                  {insight.tags && insight.tags.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <TagIcon className="w-3 h-3" />
                      <span>{insight.tags[0]}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}
        {insightsData?.data?.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="bg-secondary/20 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">No intel gathered yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">AI allies will share insights here as they work</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border bg-secondary/5">
        <Button variant="ghost" size="sm" className="w-full justify-between text-[11px] h-7 hover:bg-secondary/50">
          <span className="text-muted-foreground">View intel archive</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </div>

      <AddInsightModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  )
}

function AddInsightModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [tags, setTags] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, call mutation here
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0B0B0C] border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Global Insight</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">Title</Label>
            <Input 
              id="title" 
              placeholder="Summary of the insight" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content" className="text-xs uppercase tracking-wider text-muted-foreground">Content</Label>
            <Textarea 
              id="content" 
              placeholder="What did you learn?" 
              className="min-h-[120px] bg-background resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source" className="text-xs uppercase tracking-wider text-muted-foreground">Source</Label>
              <Input 
                id="source" 
                placeholder="e.g. Market Research" 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-xs uppercase tracking-wider text-muted-foreground">Tags</Label>
              <Input 
                id="tags" 
                placeholder="e.g. strategy, risk" 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="px-8">Create Insight</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
