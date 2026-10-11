import type { TextFieldProps, SelectFieldProps } from '@/ui/contract';

import MuiTextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

// ----------------------------------------------------------------------

/** An error under a field is announced (role alert); a hint is plain text. */
const helperProps = (error?: string) => (error ? { role: 'alert' } : {});

export function TextField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  hint,
  required,
  disabled,
  type = 'text',
  autoComplete,
  placeholder,
  rows,
  maxLength,
  inputMode,
  readOnly,
  autoFocus,
  hideLabel,
  prefix,
  size = 'medium',
}: TextFieldProps) {
  return (
    <MuiTextField
      fullWidth
      // A hidden label moves to aria-label, so the outlined border keeps no gap for it.
      label={hideLabel ? undefined : label}
      name={name}
      value={value}
      type={type}
      size={size}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      multiline={rows !== undefined}
      rows={rows}
      error={!!error}
      helperText={error ?? hint}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      slotProps={{
        htmlInput: { maxLength, inputMode, readOnly, ...(hideLabel && { 'aria-label': label }) },
        inputLabel: (type === 'date' || placeholder) ? { shrink: true } : {},
        formHelperText: helperProps(error),
        ...(prefix !== undefined && {
          input: { startAdornment: <InputAdornment position="start">{prefix}</InputAdornment> },
        }),
      }}
    />
  );
}

/**
 * A native select inside MUI's outlined field: phones show their own picker, and tests and assistive
 * tech see a real <select> (Playwright's selectOption works on it).
 */
export function SelectField({
  label,
  name,
  value,
  onChange,
  onBlur,
  options,
  error,
  hint,
  required,
  disabled,
  hideLabel,
  size = 'medium',
}: SelectFieldProps) {
  return (
    <MuiTextField
      select
      fullWidth
      label={hideLabel ? undefined : label}
      name={name}
      value={value}
      size={size}
      required={required}
      disabled={disabled}
      error={!!error}
      helperText={error ?? hint}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      slotProps={{
        select: { native: true },
        htmlInput: hideLabel ? { 'aria-label': label } : {},
        inputLabel: { shrink: true },
        formHelperText: helperProps(error),
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </MuiTextField>
  );
}
