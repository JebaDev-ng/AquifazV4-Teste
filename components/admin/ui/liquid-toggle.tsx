'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

type ToggleVariant = 'default' | 'success' | 'warning' | 'danger'

const BASE_VARS = {
  '--c-active': '#275EFE',
  '--c-success': '#10B981',
  '--c-warning': '#F59E0B',
  '--c-danger': '#EF4444',
  '--c-active-inner': '#FFFFFF',
  '--c-default': '#D2D6E9',
  '--c-default-dark': '#C7CBDF',
  '--c-black': '#1B1B22',
} as const

const VARIANT_COLOR: Record<ToggleVariant, string> = {
  default: BASE_VARS['--c-active'],
  success: BASE_VARS['--c-success'],
  warning: BASE_VARS['--c-warning'],
  danger: BASE_VARS['--c-danger'],
}

export interface LiquidToggleProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked' | 'className' | 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  variant?: ToggleVariant
  disabled?: boolean
}

export function LiquidToggle({
  checked = false,
  onCheckedChange,
  className,
  variant = 'default',
  disabled = false,
  ...rest
}: LiquidToggleProps) {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const cssVariables = useMemo(() => {
    return {
      ...BASE_VARS,
      '--c-background': VARIANT_COLOR[variant],
    } as React.CSSProperties
  }, [variant])

  const backgroundColor = isChecked ? VARIANT_COLOR[variant] : BASE_VARS['--c-default']

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return
    }
    setIsChecked(event.target.checked)
    onCheckedChange?.(event.target.checked)
  }

  return (
    <label
      className={cn(
        'relative inline-flex h-8 cursor-pointer select-none overflow-hidden rounded-full transition-transform',
        className,
        disabled && 'cursor-not-allowed opacity-60',
      )}
      style={{ ...cssVariables, width: 52 }}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className={cn(
          'h-full w-full cursor-pointer appearance-none rounded-full outline-none transition-[background-color] duration-500',
        )}
        disabled={disabled}
        aria-disabled={disabled}
        style={{
          backgroundColor,
          transition: 'background-color 0.5s ease',
        }}
        {...rest}
      />
      <svg
        viewBox="0 0 52 32"
        filter="url(#goo)"
        className="pointer-events-none absolute inset-0 fill-white"
        style={{ transform: 'translate3d(0,0,0)' }}
      >
        <circle
          cx="16"
          cy="16"
          r="10"
          style={{
            transformOrigin: '16px 16px',
            transform: `translateX(${isChecked ? '12px' : '0px'}) scale(${isChecked ? '0' : '1'})`,
            transition: 'transform 0.5s ease',
          }}
        />
        <circle
          cx="36"
          cy="16"
          r="10"
          style={{
            transformOrigin: '36px 16px',
            transform: `translateX(${isChecked ? '0px' : '-12px'}) scale(${isChecked ? '1' : '0'})`,
            transition: 'transform 0.5s ease',
          }}
        />
        {isChecked ? (
          <circle
            cx="35"
            cy="-1"
            r="2.5"
            style={{ transition: 'transform 0.7s ease', transform: 'translate3d(0,0,0)' }}
          />
        ) : null}
      </svg>
    </label>
  )
}

export function GooeyFilter() {
  return (
    <svg className="fixed h-0 w-0">
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}

export { LiquidToggle as Toggle }
