import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
    variant?: 'default' | 'white' | 'icon'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
}

const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto'
}

export function Logo({ variant = 'default', size = 'md', className }: LogoProps) {
    const getLogoSrc = () => {
        switch (variant) {
            case 'white':
                return '/assets/images/logo-white.png'
            case 'icon':
                return '/assets/images/logo-icon.png'
            default:
                return '/assets/images/logo.png'
        }
    }

    return (
        <div className={cn('flex items-center justify-center', className)}>
            <Image
                src={getLogoSrc()}
                alt="Vista Logo"
                width={200}
                height={80}
                className={cn(sizeClasses[size], 'object-contain')}
                priority
            />
        </div>
    )
}
