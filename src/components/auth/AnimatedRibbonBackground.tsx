'use client'

export function AnimatedRibbonBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
            <div className="absolute inset-0 bg-white dark:bg-black" />

            <div className="auth-orb auth-orb-1 absolute -top-[10%] -left-[10%] h-[min(90vw,420px)] w-[min(90vw,420px)] rounded-full bg-[#F5F5F7] dark:bg-[#1A1A1A]" />
            <div className="auth-orb auth-orb-2 absolute -bottom-[15%] -right-[15%] h-[min(100vw,540px)] w-[min(100vw,540px)] rounded-full bg-[#EBEBF0] dark:bg-[#121212]" />
            <div className="auth-orb auth-orb-3 absolute top-[35%] -right-[10%] h-[min(70vw,360px)] w-[min(70vw,360px)] rounded-full bg-[#EEEEEE] dark:bg-[#222222]" />

            <div className="auth-orb auth-orb-accent absolute top-[20%] left-[15%] h-[min(50vw,280px)] w-[min(50vw,280px)] rounded-full bg-vista-primary/[0.06] dark:bg-vista-primary/[0.12]" />
        </div>
    )
}
