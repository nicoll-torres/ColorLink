import React from 'react';
import { LogoMark } from '../icons';

export const MobileHeader: React.FC = () => {
  return (
    <header className="mobile-header" id="mobile-top-header">
      <div className="brand-mark small bg-teal-800/20 border border-teal-600/30" id="mobile-brand-mark">
        <LogoMark className="w-4 h-4 text-teal-700" />
      </div>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-teal-700 font-semibold leading-none">
          COLORLINK · PINTUCO
        </p>
        <span className="mobile-header-name text-base font-bold text-navy-900" id="mobile-brand-name">
          ColorLink
        </span>
      </div>
    </header>
  );
};
