import React from 'react';

interface WalletLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

const WalletLogo: React.FC<WalletLogoProps> = ({ 
  size = 48, 
  className = '',
  animated = true 
}) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/20 to-emerald-500/20 rounded-xl blur-xl ${animated ? 'animate-pulse-glow' : ''}`}></div>
      
      {/* Main wallet icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-2xl"
      >
        {/* Wallet body - gradient fill */}
        <defs>
          <linearGradient id="walletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0B90B" />
            <stop offset="50%" stopColor="#FCD535" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <linearGradient id="walletShine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        
        {/* Main wallet shape */}
        <rect
          x="6"
          y="12"
          width="36"
          height="28"
          rx="4"
          fill="url(#walletGradient)"
          className={animated ? 'animate-pulse-slow' : ''}
        />
        
        {/* Wallet flap */}
        <path
          d="M6 16C6 13.7909 7.79086 12 10 12H38C40.2091 12 42 13.7909 42 16V18H6V16Z"
          fill="#C99400"
          opacity="0.8"
        />
        
        {/* Card slot detail */}
        <rect
          x="10"
          y="22"
          width="20"
          height="3"
          rx="1.5"
          fill="rgba(11, 17, 32, 0.3)"
        />
        
        {/* Coin/money symbol */}
        <circle
          cx="35"
          cy="28"
          r="5"
          fill="#FBBF24"
          stroke="#0B1120"
          strokeWidth="1.5"
        />
        <text
          x="35"
          y="31"
          fontSize="8"
          fontWeight="bold"
          fill="#0B1120"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
        >
          $
        </text>
        
        {/* Shine effect */}
        <rect
          x="6"
          y="12"
          width="36"
          height="28"
          rx="4"
          fill="url(#walletShine)"
          opacity="0.5"
          className={animated ? 'animate-shimmer' : ''}
        />
        
        {/* Lock detail for security */}
        <g opacity="0.6">
          <rect
            x="18"
            y="31"
            width="4"
            height="5"
            rx="1"
            fill="#0B1120"
          />
          <path
            d="M19 31V29C19 27.8954 19.8954 27 21 27C22.1046 27 23 27.8954 23 29V31"
            stroke="#0B1120"
            strokeWidth="1.5"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};

export default WalletLogo;
