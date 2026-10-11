import type { TextFieldProps, SelectFieldProps } from '@/ui/contract';

import MuiTextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

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
}: TextFieldProps) {
  return (
    <MuiTextField
      fullWidth
      label={label}
      name={name}
      value={value}
      type={type}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete={autoComplete}
      multiline={rows !== undefined}
      rows={rows}
      error={!!error}
      helperText={error ?? hint}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
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
}: SelectFieldProps) {
  return (
    <MuiTextField
      select
      fullWidth
      label={label}
      name={name}
      value={value}
      required={required}
      disabled={disabled}
      error={!!error}
      helperText={error ?? hint}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </MuiTextField>
  );
}
