'use client'

import { forwardRef } from 'react'

interface ToggleSwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean
  label: string
  description?: string
}

export const ToggleSwitch = forwardRef<HTMLButtonElement, ToggleSwitchProps>(
  ({ checked, label, description, className = '', ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        ref={ref}
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
          checked ? 'border-[#007AFF] bg-[#E5F0FF]' : 'border-[#D2D2D7] bg-white'
        } ${className}`}
        {...props}
      >
        <span
          className={`inline-flex h-5 w-9 items-center rounded-full transition ${
            checked ? 'bg-[#007AFF]' : 'bg-[#C7C7CC]'
          }`}
        >
          <span
            className={`h-4 w-4 rounded-full bg-white shadow transition ${
              checked ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </span>
        <div>
          <p className="text-sm font-medium text-[#1D1D1F]">{label}</p>
          {description ? <p className="text-xs text-[#6E6E73]">{description}</p> : null}
        </div>
      </button>
    )
  },
)

ToggleSwitch.displayName = 'ToggleSwitch'

