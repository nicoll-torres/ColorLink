import React from 'react';
import { StepThreadItem } from '../types';
import { LogoMark, Check, Lock } from '../icons';

interface BrandPanelProps {
  currentStep: number;
  steps: StepThreadItem[];
  isLoggedIn?: boolean;
  onSelectStep?: (stepId: number) => void;
}

export const BrandPanel: React.FC<BrandPanelProps> = ({
  currentStep,
  steps,
  isLoggedIn = false,
  onSelectStep,
}) => {
  return (
    <aside className="left-panel" id="brand-panel">
      <div className="brand" id="brand-header">
        <div className="brand-mark" id="brand-logo-container">
          <LogoMark className="w-5 h-5 text-sky-300" />
        </div>
        <div>
          <p className="brand-eyebrow text-sky-200" id="brand-eyebrow-text">COLORLINK · SISTEMA OFICIAL</p>
          <h1 className="brand-name" id="brand-title-text">ColorLink</h1>
        </div>
      </div>

      <p className="brand-tagline" id="brand-tagline-text">
        Ecosistema inteligente que transforma requerimientos de pintura en soluciones técnicas, logísticas y de calidad.
      </p>

      {!isLoggedIn && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white/90 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="text-[11px] leading-tight">
            Inicie sesión con su correo y clave para acceder a su portal asignado.
          </span>
        </div>
      )}

      <ul className="thread" id="transversal-thread-list">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              id={`thread-node-${step.id}`}
              className={`thread-node ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
              style={{ cursor: isLoggedIn && onSelectStep ? 'pointer' : 'default' }}
              onClick={() => {
                if (isLoggedIn && onSelectStep) {
                  onSelectStep(step.id);
                }
              }}
            >
              <div className="thread-marker">
                <div className="thread-dot" id={`thread-dot-${step.id}`}>
                  {isDone ? (
                    <Check className="w-4 h-4 text-sky-300 stroke-[3]" />
                  ) : (
                    <span className="text-xs font-mono font-semibold">{step.id}</span>
                  )}
                </div>
                {!isLast && <div className="thread-line" />}
              </div>

              <div className="thread-copy">
                <p className="thread-label" id={`thread-label-${step.id}`}>{step.label}</p>
                <p className="thread-desc" id={`thread-desc-${step.id}`}>{step.desc}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="pt-4 border-t border-white/15 flex items-center justify-between" id="brand-footer-block">
        <p className="brand-foot" id="brand-foot-text">
          UCC · PROYECTO TRANSVERSAL
        </p>
        <span className="text-[10px] font-mono text-sky-200/90 bg-white/10 px-2 py-0.5 rounded">
          v2.5 ColorLink AI
        </span>
      </div>
    </aside>
  );
};
