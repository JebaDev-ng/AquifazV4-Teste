'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const inputVariants = cva(
  'flex w-full rounded-lg border border-[#D2D2D7] bg-[#FFFFFF] px-4 text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:border-[#007AFF] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
  {
    variants: {
      size: {
        default: 'h-11',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-5 text-base',
      },
      variant: {
        default: '',
        error: 'border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500',
        success: 'border-green-500 focus-visible:ring-green-500 focus-visible:border-green-500',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  helper?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helper, variant, size, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium leading-none text-[#1D1D1F]">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            inputVariants({ 
              variant: error ? "error" : variant, 
              size, 
              className 
            })
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helper && !error && (
          <p className="text-xs text-[#86868B]">{helper}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
