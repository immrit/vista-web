'use client'

export function FloatingElements() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient Orbs */}
            <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-2000"></div>

            {/* Floating Shapes */}
            <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-500/30 rounded rotate-45 animate-bounce delay-300"></div>
            <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-purple-500/30 rounded-full animate-bounce delay-700"></div>
            <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-cyan-500/30 rounded rotate-45 animate-bounce delay-1000"></div>

            {/* Animated Lines */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3" />
                    </linearGradient>
                </defs>
                <path
                    d="M0,100 Q150,50 300,100 T600,100"
                    stroke="url(#line-gradient)"
                    strokeWidth="2"
                    fill="none"
                    className="animate-pulse"
                />
                <path
                    d="M0,200 Q200,150 400,200 T800,200"
                    stroke="url(#line-gradient)"
                    strokeWidth="1.5"
                    fill="none"
                    className="animate-pulse delay-500"
                />
            </svg>
        </div>
    )
}
