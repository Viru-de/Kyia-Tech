import React from 'react';
import { useApp } from '../../context/AppContext';

interface WatermarkProps {
  text?: string;
  opacity?: number;
}

export const Watermark: React.FC<WatermarkProps> = ({ text, opacity }) => {
  const { companySettings } = useApp();

  if (!companySettings.watermarkEnabled) return null;

  const displayText = text || companySettings.watermarkText || 'KLYIA TECHNOLOGY';
  const displayOpacity = opacity ?? companySettings.watermarkOpacity ?? 0.05;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      <div
        className="font-black text-center tracking-widest uppercase transform -rotate-30 scale-125 whitespace-nowrap"
        style={{
          fontSize: 'min(9vw, 84px)',
          color: `rgba(15, 23, 42, ${displayOpacity})`,
          letterSpacing: '0.22em',
          lineHeight: '1.2',
        }}
      >
        {displayText}
        <div className="text-sm font-semibold tracking-widest mt-1 opacity-70">
          WEB • SOFTWARE • DIGITAL • AI SOLUTIONS
        </div>
      </div>
    </div>
  );
};
