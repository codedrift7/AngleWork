import '@testing-library/jest-dom/vitest'
import React from 'react'
import { vi } from 'vitest'

// Mock Next.js font modules
vi.mock('next/font/google', () => ({
  Geist: vi.fn(() => ({
    variable: '--font-geist-sans',
    className: 'geist-sans'
  })),
  Geist_Mono: vi.fn(() => ({
    variable: '--font-geist-mono',
    className: 'geist-mono'
  }))
}))

// Mock framer-motion to disable animations in tests
// But preserve component mounting/unmounting logic
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children, mode }: { children: React.ReactNode; mode?: string }) => {
    // mode="wait" means only one child at a time, but we still render it
    return children
  },
  motion: new Proxy({} as any, {
    get: (_target, prop: string) => {
      return React.forwardRef((props: any, ref: any) => {
        // Strip animation props but keep everything else
        const { 
          initial, animate, exit, transition, 
          whileHover, whileTap, whileFocus, whileDrag,
          variants, layout, layoutId,
          ...rest 
        } = props
        return React.createElement(prop, { ...rest, ref })
      })
    }
  })
}))