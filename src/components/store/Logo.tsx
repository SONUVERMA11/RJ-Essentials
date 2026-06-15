'use client';

interface LogoProps {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'full' | 'icon';
    className?: string;
    showTagline?: boolean;
    darkBg?: boolean;
}

const sizes = {
    xs: { box: 24, text: 'text-sm', tagline: 'text-[8px]' },
    sm: { box: 28, text: 'text-sm', tagline: 'text-[8px]' },
    md: { box: 32, text: 'text-base', tagline: 'text-[9px]' },
    lg: { box: 40, text: 'text-lg', tagline: 'text-[10px]' },
};

// Monochrome RJ Logo Icon
export function LogoIcon({ size = 32 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <rect width="120" height="120" rx="24" className="fill-foreground" />
            <text x="60" y="68" textAnchor="middle" fontFamily="'Inter', 'Arial', sans-serif" fontWeight="800" fontSize="52" className="fill-background" letterSpacing="-3">
                RJ
            </text>
        </svg>
    );
}

export default function Logo({ size = 'md', variant = 'full', className = '', showTagline = true }: LogoProps) {
    const s = sizes[size];

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <LogoIcon size={s.box} />
            {variant === 'full' && (
                <div className="flex flex-col">
                    <span className={`${s.text} font-bold leading-none tracking-tight text-foreground`}>
                        RJ ESSENTIALS
                    </span>
                    {showTagline && (
                        <span className={`${s.tagline} text-muted-foreground font-medium leading-none mt-0.5 tracking-wide uppercase`}>
                            Quality First
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
