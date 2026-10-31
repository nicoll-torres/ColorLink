import React, { useState } from 'react';
import { Eye, EyeOff } from '../icons';

interface FieldOption {
  value: string;
  label: string;
}

interface FieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'select' | 'textarea';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  hint?: string;
  error?: string;
  options?: FieldOption[];
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  disabled?: boolean;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  pattern?: string;
  maxLength?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export const Field: React.FC<FieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  hint,
  error,
  options = [],
  required = false,
  min,
  max,
  step,
  rows = 3,
  disabled = false,
  inputMode,
  pattern,
  maxLength,
  onKeyDown,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const isTextArea = type === 'textarea';
  const isSelect = type === 'select';

  return (
    <div className="field" id={`field-container-${id}`}>
      <label htmlFor={id} id={`label-${id}`} className="flex justify-between items-center">
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      </label>

      <div className={`input-wrap ${error ? 'input-error' : ''}`} id={`input-wrap-${id}`}>
        {icon && (
          <span className={`input-icon ${isTextArea ? 'input-icon-top' : ''}`} id={`icon-${id}`}>
            {icon}
          </span>
        )}

        {isSelect ? (
          <select
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className="w-full pr-8 cursor-pointer"
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : isTextArea ? (
          <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            required={required}
          />
        ) : (
          <input
            id={id}
            type={effectiveType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            step={step}
            inputMode={inputMode}
            pattern={pattern}
            maxLength={maxLength}
            onKeyDown={onKeyDown}
          />
        )}

        {isPassword && (
          <button
            type="button"
            className="input-toggle"
            id={`toggle-password-${id}`}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error ? (
        <span className="error-text" id={`error-${id}`}>
          {error}
        </span>
      ) : hint ? (
        <span className="hint-text" id={`hint-${id}`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
};
