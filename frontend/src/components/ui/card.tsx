'use client'

import React from 'react'
import clsx from 'clsx'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  glass?: boolean
}

export function Card({ children, className, glass = false, ...props }: CardProps) {
  return (
    <div className={clsx(glass ? 'glass-panel' : 'card', className)} {...props}>
      {children}
    </div>
  )
}
