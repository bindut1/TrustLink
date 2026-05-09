import { useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Label } from "./Label";

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  invalid?: boolean;
};

export type FormFieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactElement<ControlProps>;
};

/**
 * Wraps a labelled control. Auto-wires `id` + `aria-describedby` so callers
 * just write `<FormField label="Email"><Input ... /></FormField>`.
 */
export function FormField({
  label,
  required,
  error,
  hint,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  const autoId = useId();
  const id = htmlFor ?? children.props.id ?? autoId;
  const describedById = error || hint ? `${id}-desc` : undefined;

  const control: ReactElement<ControlProps> = {
    ...children,
    props: {
      ...children.props,
      id,
      "aria-describedby": describedById,
      invalid: error ? true : children.props.invalid,
    },
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {control}
      {(error || hint) && (
        <span
          id={describedById}
          className={cn(
            "text-[13.5px] leading-snug",
            error ? "text-danger font-medium" : "text-fg-subtle",
          )}
        >
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
