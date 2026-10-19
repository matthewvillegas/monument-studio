import type { DimensionFieldPath } from "@/types/design";

interface DimensionFieldProps {
  fieldPath: DimensionFieldPath;
  label: string;
  value: string;
  min: number;
  max: number;
  error?: string | undefined;
  onChange: (field: DimensionFieldPath, value: string) => void;
}

function fieldId(fieldPath: DimensionFieldPath): string {
  return fieldPath.replace(".", "-");
}

export function DimensionField({
  fieldPath,
  label,
  value,
  min,
  max,
  error,
  onChange,
}: DimensionFieldProps) {
  const id = fieldId(fieldPath);
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = error ? `${hintId} ${errorId}` : hintId;

  return (
    <div className="dimension-field">
      <div className="dimension-field-header">
        <label htmlFor={id} className="dimension-label">
          {label}
        </label>
        <span id={hintId} className="dimension-range">
          {min}–{max} in
        </span>
      </div>
      <div className="mt-1.5">
        <input
          id={id}
          name={fieldPath}
          type="number"
          inputMode="decimal"
          step="any"
          min={min}
          max={max}
          required
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(fieldPath, event.target.value)}
          className="dimension-input"
        />
      </div>
      {error ? (
        <p id={errorId} className="dimension-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
