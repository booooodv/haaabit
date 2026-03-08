import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cloneElement, forwardRef, isValidElement, useId } from "react";

import { cn } from "./cn";
import styles from "./forms.module.css";

type FieldProps = {
  label?: ReactNode;
  htmlFor?: string;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
  required?: boolean;
  labelSuffix?: ReactNode;
};

type CheckboxGroupOption = {
  label: ReactNode;
  value: string;
  hint?: ReactNode;
  defaultChecked?: boolean;
  disabled?: boolean;
};

type CheckboxGroupProps = {
  legend: ReactNode;
  name: string;
  options: CheckboxGroupOption[];
  className?: string;
};

export function Field({
  label,
  htmlFor,
  description,
  error,
  children,
  className,
  required = false,
  labelSuffix,
}: FieldProps) {
  const fallbackId = useId();
  const fieldId = htmlFor ?? fallbackId;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const content = isValidElement<{
    "aria-describedby"?: string;
    "aria-errormessage"?: string;
  }>(children)
    ? cloneElement(children, {
        "aria-describedby": [children.props["aria-describedby"], describedBy].filter(Boolean).join(" ") || undefined,
        "aria-errormessage": errorId ?? children.props["aria-errormessage"],
      })
    : children;

  return (
    <div className={cn(styles.field, className)}>
      {label ? (
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor={htmlFor}>
            {label}
            {required ? " *" : null}
          </label>
          {labelSuffix}
        </div>
      ) : null}
      {description ? (
        <div id={descriptionId} className={styles.description}>
          {description}
        </div>
      ) : null}
      {content}
      {error ? (
        <div id={errorId} className={styles.error}>
          {error}
        </div>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(styles.control, className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn(styles.control, styles.select, className)} {...props}>
      {children}
    </select>
  );
});

export function CheckboxGroup({ legend, name, options, className }: CheckboxGroupProps) {
  return (
    <fieldset className={cn(styles.checkboxGroup, className)}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              name={name}
              type="checkbox"
              value={option.value}
              defaultChecked={option.defaultChecked}
              disabled={option.disabled}
            />
            <span>
              <span>{option.label}</span>
              {option.hint ? <span className={styles.optionHint}>{option.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
