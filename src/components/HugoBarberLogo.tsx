import React from 'react';

type LogoSize = 'sm' | 'md' | 'lg';

interface HugoBarberLogoProps {
  size?: LogoSize;
  className?: string;
}

export function HugoBarberLogo({ size = 'md', className = '' }: HugoBarberLogoProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 sm:w-20 sm:h-20 text-3xl sm:text-5xl',
    lg: 'w-24 h-24 sm:w-32 sm:h-32 text-5xl sm:text-7xl',
  };

  return (
    <div 
      className={`flex items-center justify-center font-bold text-[#080603] rounded-xl flex-shrink-0 ${sizeClasses[size]} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #fcebaf 0%, #c99a3c 100%)',
        boxShadow: '0 8px 24px rgba(201,154,60,.25), inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -2px 6px rgba(0,0,0,0.1)',
        fontFamily: 'Playfair Display, Georgia, "Times New Roman", serif',
        textShadow: '0 1px 0 rgba(255,255,255,0.4)',
      }}
    >
      H
    </div>
  );
}
