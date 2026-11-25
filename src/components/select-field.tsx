import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface SelectFieldProps {
  id: string
  name: string
  label: string
  placeholder: string
  options: { value: string; label: string }[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  required?: boolean
  error?: string
  className?: string
}

/** Select do shadcn/ui com rótulo e erro associados (envia o valor no FormData via `name`). */
export function SelectField({
  id,
  name,
  label,
  placeholder,
  options,
  value,
  defaultValue,
  onValueChange,
  required,
  error,
  className,
}: SelectFieldProps) {
  return (
    <div className={className}>
      <Label id={`${id}-rotulo`} htmlFor={id} className="mb-2 text-sm font-normal">
        {label}
        {required && (
          <span aria-hidden="true" className="-ml-1 text-base text-highlight">
            *
          </span>
        )}
      </Label>
      <Select
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        required={required}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={`${id}-rotulo`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-erro` : undefined}
          className={cn('h-10 w-full rounded-sm border-[#3d2a1f] bg-card px-3 text-sm')}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={`${id}-erro`} className="mt-1.5 text-xs font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
