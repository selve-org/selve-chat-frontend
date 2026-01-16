'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import '../styles/sunlit.css'

/**
 * SunlitBackground Component
 * 
 * A dappled light effect inspired by sunlight through window blinds.
 * Features:
 * - Animated blinds with billowing leaves
 * - Progressive blur for depth
 * - Sunrise/sunset color transitions
 * - Synchronized with app theme (light/dark)
 * 
 * Design inspired by daylightcomputer.com and sunlit.place
 */
export function SunlitBackground() {
  const { theme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    const body = document.body
    
    // Add animation-ready class after mount to enable transitions
    const timer = setTimeout(() => {
      body.classList.add('sunlit-animation-ready')
    }, 100)

    return () => {
      clearTimeout(timer)
      body.classList.remove('sunlit-animation-ready')
    }
  }, [])

  useEffect(() => {
    const body = document.body
    
    if (isDark) {
      body.classList.add('sunlit-dark')
    } else {
      body.classList.remove('sunlit-dark')
    }
  }, [isDark])

  return (
    <div id="sunlit-dappled-light">
      {/* Ambient glow effects */}
      <div id="sunlit-glow"></div>
      <div id="sunlit-glow-bounce"></div>

      {/* 3D perspective container for blinds and leaves */}
      <div className="sunlit-perspective">
        {/* Billowing leaves with SVG wind effect */}
        <div id="sunlit-leaves">
          <svg style={{ width: 0, height: 0, position: 'absolute' }}>
            <defs>
              <filter id="sunlit-wind" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" numOctaves={2} seed={1}>
                  <animate
                    attributeName="baseFrequency"
                    dur="16s"
                    keyTimes="0;0.33;0.66;1"
                    values="0.005 0.003;0.01 0.009;0.008 0.004;0.005 0.003"
                    repeatCount="indefinite"
                  />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic">
                  <animate
                    attributeName="scale"
                    dur="20s"
                    keyTimes="0;0.25;0.5;0.75;1"
                    values="45;55;75;55;45"
                    repeatCount="indefinite"
                  />
                </feDisplacementMap>
              </filter>
            </defs>
          </svg>
        </div>

        {/* Window blinds structure */}
        <div id="sunlit-blinds">
          <div className="sunlit-shutters">
            {Array.from({ length: 23 }).map((_, i) => (
              <div key={i} className="sunlit-shutter"></div>
            ))}
          </div>
          <div className="sunlit-vertical">
            <div className="sunlit-bar"></div>
            <div className="sunlit-bar"></div>
          </div>
        </div>
      </div>

      {/* Progressive blur layers for depth effect */}
      <div id="sunlit-progressive-blur">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  )
}
