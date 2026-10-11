import type { FileInputProps } from '@/ui/contract';

import { useId, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Icon } from './icon';

// ----------------------------------------------------------------------

/** Whether a file fits an `accept` list (".csv", "image/*", "text/csv"), as the file picker filters. */
export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) =>
      rule.startsWith('.')
        ? name.endsWith(rule)
        : rule.endsWith('/*')
          ? type.startsWith(rule.slice(0, -1))
          : type === rule
    );
}

const hiddenInput = {
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
} as const;

/**
 * A real file input, visually hidden and named by `label` (getByLabel and setInputFiles reach it),
 * behind a button or a drop area that opens it.
 */
export function FileInput({
  label,
  buttonLabel,
  onFiles,
  accept,
  multiple,
  disabled,
  hint,
  look = 'button',
}: FileInputProps) {
  const inputId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Dropped files skip the picker's filter, so `accept` is applied here for both paths.
  const take = (list: FileList | null) => {
    const files = (list ? Array.from(list) : []).filter((file) => matchesAccept(file, accept));
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      aria-label={label}
      aria-describedby={hint ? hintId : undefined}
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      style={hiddenInput}
      onChange={(event) => {
        take(event.target.files);
        event.target.value = '';
      }}
    />
  );

  const hintText = hint && (
    <Typography id={hintId} variant="caption" component="div" sx={{ mt: 1, color: 'text.secondary' }}>
      {hint}
    </Typography>
  );

  if (look === 'dropzone') {
    return (
      <Box>
        <Box
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!disabled) take(event.dataTransfer.files);
          }}
          sx={{
            p: 4,
            gap: 1.5,
            display: 'flex',
            borderRadius: 1.5,
            alignItems: 'center',
            flexDirection: 'column',
            textAlign: 'center',
            border: '1px dashed',
            borderColor: dragging ? 'primary.main' : 'divider',
            bgcolor: dragging ? 'primary.lighter' : 'background.neutral',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Icon name="upload" size={40} />
          {input}
          <Button
            variant="contained"
            color="inherit"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {buttonLabel}
          </Button>
        </Box>
        {hintText}
      </Box>
    );
  }

  return (
    <Box>
      {input}
      <Button
        variant="outlined"
        color="inherit"
        disabled={disabled}
        startIcon={<Icon name="upload" />}
        onClick={() => inputRef.current?.click()}
      >
        {buttonLabel}
      </Button>
      {hintText}
    </Box>
  );
}
