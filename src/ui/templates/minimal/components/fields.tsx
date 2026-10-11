import type { TextFieldProps, SelectFieldProps } from '@/ui/contract';

import { useId } from 'react';

import MuiTextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

// ----------------------------------------------------------------------

/** The text under a field: the error (announced, role alert) and the hint, both when both are present. */
function helperText(error?: string, hint?: string) {
  if (!error) return hint;
  return (
    <>
      <span role="alert" style={{ display: 'block' }}>
        {error}
      </span>
      {hint && <span style={{ display: 'block', color: 'var(--mui-palette-text-secondary)' }}>{hint}</span>}
    </>
  );
}

export function TextField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  hint,
  required,
  requiredMark = true,
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
  suffix,
  suggestions,
  mono,
  invalid,
  size = 'medium',
}: TextFieldProps) {
  const listId = useId();
  const hasList = !!suggestions?.length;
  const adornments = {
    ...(prefix != null && { startAdornment: <InputAdornment position="start">{prefix}</InputAdornment> }),
    ...(suffix != null &&
      suffix !== false && {
        endAdornment: (
          <InputAdornment position="end" aria-live="polite">
            {suffix}
          </InputAdornment>
        ),
      }),
  };
  const field = (
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
      error={!!error || !!invalid}
      helperText={helperText(error, hint)}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      slotProps={{
        htmlInput: {
          maxLength,
          inputMode,
          readOnly,
          ...(hasList && { list: listId }),
          ...(hideLabel && { 'aria-label': label }),
        },
        inputLabel: {
          ...((type === 'date' || placeholder || prefix !== undefined) && { shrink: true }),
          ...(!requiredMark && { required: false }),
        },
        input: {
          ...adornments,
          ...(mono && { sx: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } }),
        },
      }}
    />
  );
  if (!hasList) return field;
  return (
    <>
      {field}
      <datalist id={listId}>
        {suggestions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
    </>
  );
}

/** Options in runs by group, keeping their order; ungrouped options form runs with no heading. */
function optionGroups(options: SelectFieldProps['options']) {
  const runs: [string | undefined, SelectFieldProps['options'][number][]][] = [];
  for (const option of options) {
    const last = runs[runs.length - 1];
    if (last && last[0] === option.group) last[1].push(option);
    else runs.push([option.group, [option]]);
  }
  return runs;
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
  requiredMark = true,
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
      helperText={helperText(error, hint)}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      slotProps={{
        select: { native: true },
        htmlInput: hideLabel ? { 'aria-label': label } : {},
        inputLabel: { shrink: true, ...(!requiredMark && { required: false }) },
      }}
    >
      {optionGroups(options).map(([group, items]) => {
        const rendered = items.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ));
        return group ? (
          <optgroup key={group} label={group}>
            {rendered}
          </optgroup>
        ) : (
          rendered
        );
      })}
    </MuiTextField>
  );
}
