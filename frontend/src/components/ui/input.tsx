'use client'

import React, { forwardRef } from 'react'
import clsx from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="input-group">
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={clsx('input-control', error && 'border-danger', className)}
          style={error ? { borderColor: 'var(--status-at-risk)' } : undefined}
          {...props}
        />
        {error ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--status-at-risk)', marginTop: '2px' }}>
            {error}
          </span>
        ) : helperText ? (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {helperText}
          </span>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
