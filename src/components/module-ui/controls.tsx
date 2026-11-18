import React from 'react';
import { cn } from '@/lib/utils';
import StyledButton, { type StyledButtonProps } from '@/components/ui/StyledButton';
import StyledSelect, { type StyledSelectProps } from '@/components/ui/StyledSelect';
import StyledSwitch, { type StyledSwitchProps } from '@/components/ui/StyledSwitch';
import StyledNumberInput, { type StyledNumberInputProps } from '@/components/ui/StyledNumberInput';

// Buttons
export interface ModuleActionButtonProps extends StyledButtonProps {}
export const ModuleActionButton = React.forwardRef<HTMLButtonElement, ModuleActionButtonProps>(({ className, ...rest }, ref) => {
  return <StyledButton ref={ref} className={cn('h-10', className)} {...rest} />;
});
ModuleActionButton.displayName = 'ModuleActionButton';

// Select
export interface ModuleSelectProps extends StyledSelectProps {}
export const ModuleSelect: React.FC<ModuleSelectProps> = ({ className, ...rest }) => {
  return <StyledSelect className={cn(className)} {...rest} />;
};

// Toggle (Alias der bestehenden Implementierung)
export type ModuleToggleProps = StyledSwitchProps;
export const ModuleToggle = React.forwardRef<HTMLButtonElement, ModuleToggleProps>(({ className, ...rest }, ref) => {
  return <StyledSwitch ref={ref} className={className} {...rest} />;
});
ModuleToggle.displayName = 'ModuleToggle';

// Number Input
export type ModuleNumberInputProps = StyledNumberInputProps;
export const ModuleNumberInput = React.forwardRef<HTMLInputElement, ModuleNumberInputProps>(({ className, ...rest }, ref) => {
  return <StyledNumberInput ref={ref} className={cn('h-10', className)} {...rest} />;
});
ModuleNumberInput.displayName = 'ModuleNumberInput';

// Text Input (schlanker, lokaler Input – nur für Modulbereich verwendet)
export interface ModuleTextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
}
export const ModuleTextInput = React.forwardRef<HTMLInputElement, ModuleTextInputProps>(
  ({ className, error, hint, disabled, ...rest }, ref) => {
    return (
      <div className={cn('relative inline-flex w-full items-stretch', disabled && 'opacity-60')}>
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'h-10 w-full rounded-md border bg-[#0f1220] px-3 text-[0.95rem] text-white',
            'border-[#2a2f45] placeholder:text-[#7f86a8] hover:border-astra-purple/25',
            'focus:outline-none focus-visible:border-astra-purple/40 focus:ring-0',
            'transition-colors duration-150 motion-reduce:transition-none',
            error && 'border-red-500/60 focus:border-red-400',
            className,
          )}
          {...rest}
        />
        {(hint || error) && (
          <div className="mt-1 w-full text-[0.82rem]">
            {error ? <span role="alert" className="text-red-400">{error}</span> : <span className="text-[#8fa1c6]">{hint}</span>}
          </div>
        )}
      </div>
    );
  },
);
ModuleTextInput.displayName = 'ModuleTextInput';

// Textarea
export interface ModuleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  hint?: string;
}
export const ModuleTextarea = React.forwardRef<HTMLTextAreaElement, ModuleTextareaProps>(({ className, error, hint, disabled, ...rest }, ref) => {
  return (
    <div className={cn('relative inline-flex w-full items-stretch', disabled && 'opacity-60')}>
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          'min-h-[84px] w-full rounded-md border bg-[#0f1220] px-3 py-2 text-[0.95rem] text-white',
          'border-[#2a2f45] placeholder:text-[#7f86a8] hover:border-astra-purple/25',
          'focus:outline-none focus-visible:border-astra-purple/40 focus:ring-0',
          'transition-colors duration-150 motion-reduce:transition-none',
          error && 'border-red-500/60 focus:border-red-400',
          className,
        )}
        {...rest}
      />
      {(hint || error) && (
        <div className="mt-1 w-full text-[0.82rem]">
          {error ? <span role="alert" className="text-red-400">{error}</span> : <span className="text-[#8fa1c6]">{hint}</span>}
        </div>
      )}
    </div>
  );
});
ModuleTextarea.displayName = 'ModuleTextarea';

// Checkbox
export interface ModuleCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children'> {
  children?: React.ReactNode;
}
export const ModuleCheckbox = React.forwardRef<HTMLInputElement, ModuleCheckboxProps>(
  ({ className, children, ...rest }, ref) => {
    return (
      <label className={cn('inline-flex items-center gap-2 text-[0.95rem] text-white', className)}>
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            'h-4 w-4 rounded border-[#2a2f45] bg-[#0f1220] text-astra-purple',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-astra-purple/40',
          )}
          {...rest}
        />
        {children}
      </label>
    );
  },
);
ModuleCheckbox.displayName = 'ModuleCheckbox';
