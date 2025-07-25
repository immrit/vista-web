'use client'

import { useEffect, useRef } from 'react'

export function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        resizeCanvas()
        window.addEventListener('resize', resizeCanvas)

        // Particles configuration
        const particles: Array<{
            x: number
            y: number
            vx: number
            vy: number
            radius: number
            opacity: number
            color: string
        }> = []

        const colors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B']

        // Create particles
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.1,
                color: colors[Math.floor(Math.random() * colors.length)]
            })
        }

        // Animation loop
        function animate() {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                // Update position
                particle.x += particle.vx
                particle.y += particle.vy

                // Bounce off edges (guard against null canvas)
                if (canvas) {
                    if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
                    if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1
                }

                // Draw particle
                if (ctx) {
                    ctx.save()
                    ctx.globalAlpha = particle.opacity
                    ctx.fillStyle = particle.color
                    ctx.beginPath()
                    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                    particles.forEach((particle, i) => {
                        particles.slice(i + 1).forEach(otherParticle => {
                            const dx = particle.x - otherParticle.x
                            const dy = particle.y - otherParticle.y
                            const distance = Math.sqrt(dx * dx + dy * dy)

                            if (distance < 100 && ctx) {
                                ctx.save()
                                ctx.globalAlpha = (100 - distance) / 100 * 0.1
                                ctx.strokeStyle = '#3B82F6'
                                ctx.lineWidth = 1
                                ctx.beginPath()
                                ctx.moveTo(particle.x, particle.y)
                                ctx.lineTo(otherParticle.x, otherParticle.y)
                                ctx.stroke()
                                ctx.restore()
                            }
                        })
                    })

                    requestAnimationFrame(animate)
                }

                animate()

                return () => {
                    window.removeEventListener('resize', resizeCanvas)
                }
            }, [])

            return (
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ zIndex: -1 }}
                />
            )
        }
    }

    )
}
