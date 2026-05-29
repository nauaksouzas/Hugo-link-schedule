import React from 'react';

type LogoSize = 'sm' | 'md' | 'lg';

interface HugoBarberLogoProps {
  size?: LogoSize;
  className?: string;
}

export function HugoBarberLogo({ size = 'md', className = '' }: HugoBarberLogoProps) {
  const sizeClasses = {
    sm: 'w-[40px] h-[40px] md:w-[48px] md:h-[48px] text-xl md:text-2xl',
    md: 'w-[88px] h-[88px] text-5xl',
    lg: 'w-32 h-32 text-6xl',
  };

  return (
    <div 
      className={`flex items-center justify-center font-bold text-[#0d0b08] rounded-2xl flex-shrink-0 ${sizeClasses[size]} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #f1cf83 0%, #c99a3c 100%)',
        boxShadow: '0 4px 10px rgba(201,154,60,.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        fontFamily: 'Georgia, "Times New Roman", serif',
        textShadow: '0 1px 0 rgba(255,255,255,0.3)',
      }}
    >
      H
    </div>
  );
}
