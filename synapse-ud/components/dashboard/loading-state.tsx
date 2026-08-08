'use client'

import { useEffect, useState } from 'react'

const messages = [
  'Collecting company disclosures...',
  'Searching supporting evidence...',
  'Searching counter evidence...',
  'Evaluating contradictions...',
  'Building reasoning graph...',
  'Generating verdict...',
  'Preparing explanation...',
]

export function LoadingState() {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length)
    }, 400)

    return () => clearInterval(messageInterval)
  }, [])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 95 ? prev + Math.random() * 15 : prev))
    }, 500)

    return () => clearInterval(progressInterval)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md text-center">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              viewBox="0 0 24 24"
              className="size-8 text-primary animate-pulse"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="6" cy="6" r="2.2" />
              <circle cx="18" cy="7" r="2.2" />
              <circle cx="7" cy="18" r="2.2" />
              <circle cx="17" cy="17" r="2.2" />
              <path d="M8 6.6 15.8 6.9M7.4 8 7 15.8M8.6 7.2 16 15.8M8.7 17.2 15 17.1M16.5 9 17 15" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Analyzing ESG Claims
        </h2>
        <p className="text-muted-foreground mb-8">
          Our AI is examining evidence and building a comprehensive analysis.
        </p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Status Messages */}
        <div className="min-h-12 mb-8">
          <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              {messages[currentMessage]}
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2 text-left">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 text-sm transition-colors ${
                idx <= currentMessage
                  ? 'text-foreground'
                  : 'text-muted-foreground/50'
              }`}
            >
              <div
                className={`size-4 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx < currentMessage
                    ? 'bg-primary text-primary-foreground'
                    : idx === currentMessage
                      ? 'bg-primary/20 text-primary animate-pulse'
                      : 'border-2 border-muted'
                }`}
              >
                {idx < currentMessage ? '✓' : ''}
              </div>
              <span>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
