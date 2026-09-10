'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const stages = [
  { name: 'Product Analyst', emoji: '🔍', description: 'Extracting product intelligence...' },
  { name: 'Positioning Strategist', emoji: '🎯', description: 'Defining positioning & messaging angles...' },
  { name: 'AIDA Strategist', emoji: '📊', description: 'Building persuasion strategy...' },
  { name: 'Campaign Builder', emoji: '✍️', description: 'Generating campaign assets...' },
  { name: 'Campaign Critic', emoji: '🔎', description: 'Scoring & critiquing...' },
  { name: 'Launch Calendar', emoji: '📅', description: 'Creating 7-day execution plan...' }
]

export function PipelineProgress() {
  const [currentStage, setCurrentStage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 border border-gray-200 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Creating Your Campaign
          </h2>
          <p className="text-gray-600">
            AI pipeline is running. This takes about 30-60 seconds.
          </p>
        </div>

        <div className="space-y-4">
          {stages.map((stage, index) => {
            const isActive = index === currentStage
            const isComplete = index < currentStage
            const isPending = index > currentStage

            return (
              <motion.div
                key={stage.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-lg ${
                  isActive
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : isComplete
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200 opacity-50'
                }`}
              >
                <div className="text-3xl">{stage.emoji}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                  <p className="text-sm text-gray-600">{stage.description}</p>
                </div>
                <div>
                  {isComplete && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                  {isActive && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Please wait while we generate your campaign...
        </div>
      </motion.div>
    </motion.div>
  )
}
