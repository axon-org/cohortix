import type React from 'react'

export interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  priority: boolean
  essential?: boolean
  children?: NavItem[]
}

export interface NavGroup {
  id: string
  label?: string
  items: NavItem[]
}
