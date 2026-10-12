import type { CheckboxProps, RadioGroupProps } from '@/ui/contract';

import { useId } from 'react';

import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import FormLabel from '@mui/material/FormLabel';
import MuiCheckbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import MuiRadioGroup from '@mui/material/RadioGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

/** Label text with an optional hint line under it. */
function ChoiceLabel({ label, hint }: { label: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <Box sx={{ py: 1 }}>
      <Typography variant="body2" component="span" sx={{ display: 'block' }}>
        {label}
      </Typography>
      {hint && (
        <Typography variant="caption" component="span" sx={{ display: 'block', color: 'text.secondary' }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export function Checkbox({ label, checked, onChange, name, hint, disabled, indeterminate, hideLabel }: CheckboxProps) {
  if (hideLabel) {
    return (
      <MuiCheckbox
        name={name}
        checked={checked}
        disabled={disabled}
        indeterminate={indeterminate}
        onChange={(event) => onChange(event.target.checked)}
        slotProps={{ input: { 'aria-label': typeof label === 'string' ? label : undefined } }}
        sx={{ width: 44, height: 44 }}
      />
    );
  }
  return (
    <FormControlLabel
      disabled={disabled}
      // With a hint the box sits by the first line; a single-line label is centred on the box,
      // so the checkbox lines up with buttons in the same row.
      sx={hint ? { m: 0, alignItems: 'flex-start', '& .MuiCheckbox-root': { mt: 0.25 } } : { m: 0 }}
      control={
        <MuiCheckbox
          name={name}
          checked={checked}
          indeterminate={indeterminate}
          onChange={(event) => onChange(event.target.checked)}
          sx={{ width: 44, height: 44 }}
        />
      }
      label={<ChoiceLabel label={label} hint={hint} />}
    />
  );
}

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
} as const;

export function RadioGroup({
  label,
  value,
  onChange,
  options,
  name,
  direction = 'column',
  hideLabel,
  error,
  hint,
  disabled,
  look = 'plain',
}: RadioGroupProps) {
  const groupName = useId();
  const helpId = useId();
  const help = error ?? hint;
  return (
    <FormControl component="fieldset" error={!!error} disabled={disabled} sx={{ width: 1 }}>
      <FormLabel component="legend" sx={hideLabel ? visuallyHidden : { mb: 1, typography: 'subtitle2', color: 'text.primary' }}>
        {label}
      </FormLabel>
      <MuiRadioGroup
        name={name ?? groupName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={help ? helpId : undefined}
        sx={
          look === 'cards' && direction === 'row'
            ? // A grid keeps every card the same width; flex wrapping stretched the last row's cards.
              { gap: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }
            : { gap: look === 'cards' ? 1 : 0, flexDirection: direction === 'row' ? 'row' : 'column', flexWrap: 'wrap' }
        }
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            control={<Radio sx={{ width: 44, height: 44 }} />}
            label={<ChoiceLabel label={option.label} hint={option.hint} />}
            sx={[
              { m: 0, alignItems: 'flex-start', '& .MuiRadio-root': { mt: 0.25 } },
              look === 'cards' && {
                pr: 2,
                border: 1,
                borderRadius: 1.5,
                borderColor: value === option.value ? 'primary.main' : 'divider',
                bgcolor: value === option.value ? 'primary.lighter' : 'transparent',
              },
            ]}
          />
        ))}
      </MuiRadioGroup>
      {help && (
        <FormHelperText id={helpId} role={error ? 'alert' : undefined} sx={{ mx: 0 }}>
          {help}
        </FormHelperText>
      )}
    </FormControl>
  );
}
