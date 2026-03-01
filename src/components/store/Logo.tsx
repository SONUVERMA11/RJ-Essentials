'use client';

interface LogoProps {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'full' | 'icon';
    className?: string;
    showTagline?: boolean;
    darkBg?: boolean;
}

const sizes = {
    xs: { box: 28, text: 'text-sm', tagline: 'text-[8px]' },
    sm: { box: 36, text: 'text-base', tagline: 'text-[9px]' },
    md: { box: 44, text: 'text-lg', tagline: 'text-[10px]' },
    lg: { box: 56, text: 'text-2xl', tagline: 'text-xs' },
};

// RJ Store Logo Icon — Yellow Block Style
export function LogoIcon({ size = 36 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            {/* Bright Yellow background */}
            <rect x="0" y="0" width="120" height="120" rx="20" fill="#FFE500" />
            {/* Bold Blue RJ Text */}
            <text x="60" y="62" textAnchor="middle" fontFamily="'Arial Black', 'Impact', sans-serif" fontWeight="900" fontSize="56" fill="#2874F0" letterSpacing="-4">
                RJ
            </text>
            {/* ESSENTIALS Text */}
            <text x="60" y="94" textAnchor="middle" fontFamily="'Arial', 'Helvetica', sans-serif" fontWeight="800" fontSize="14" fill="#2874F0" letterSpacing="1">
                ESSENTIALS
            </text>
        </svg>
    );
}

export default function Logo({ size = 'md', variant = 'full', className = '', showTagline = true, darkBg = false }: LogoProps) {
    const s = sizes[size];

    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <LogoIcon size={s.box} />
            {variant === 'full' && (
                <div>
                    <h1 className={`${s.text} font-bold leading-tight tracking-tight ${darkBg ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        RJ ESSENTIALS
                    </h1>
                    {showTagline && (
                        <p className={`${s.tagline} ${darkBg ? 'text-blue-200' : 'text-gray-400'} italic -mt-0.5`}>
                            Quality at Your Doorstep
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
