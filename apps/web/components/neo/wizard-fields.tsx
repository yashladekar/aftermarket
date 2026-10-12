"use client"

import type { ReactNode } from "react"
import { format } from "date-fns"
import { CalendarDays, CircleAlert } from "lucide-react"
import {
  Controller,
  useFormContext,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-[11px] font-medium text-red-600">
      {message}
    </p>
  )
}

type ControlledProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
}

export function FieldLabel({
  children,
  required,
  hint,
  htmlFor,
}: {
  children: ReactNode
  required?: boolean
  hint?: string
  htmlFor?: string
}) {
  return (
    <div className="mb-1 flex items-center gap-1">
      <Label
        htmlFor={htmlFor}
        className="text-[11px] font-bold text-neutral-700"
      >
        {children}
        {required && <span className="text-emerald-700">*</span>}
      </Label>
      {hint && (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="text-emerald-700"
                aria-label={hint}
              >
                <CircleAlert className="size-3.5 fill-emerald-700 text-white" />
              </button>
            }
          />
          <TooltipContent className="max-w-56">{hint}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export function TextField({
  label,
  required,
  hint,
  id,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  required?: boolean
  hint?: string
}) {
  return (
    <div>
      <FieldLabel required={required} hint={hint} htmlFor={id}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        {...props}
        className={cn("h-8 text-xs", props.className)}
      />
    </div>
  )
}

export function ControlledTextField<T extends FieldValues>({
  label,
  required,
  hint,
  id,
  name,
  control,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  required?: boolean
  hint?: string
  id: string
} & ControlledProps<T>) {
  const { clearErrors } = useFormContext<T>()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <FieldLabel required={required} hint={hint} htmlFor={id}>
            {label}
          </FieldLabel>
          <Input
            id={id}
            {...props}
            value={(field.value as string | number | undefined) ?? ""}
            onChange={(e) => {
              field.onChange(e.target.value)
              clearErrors(name)
            }}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            aria-invalid={!!fieldState.error}
            className={cn(
              "h-8 text-xs",
              fieldState.error && "border-red-500",
              props.className
            )}
          />
          <FieldError message={fieldState.error?.message} />
        </div>
      )}
    />
  )
}

export function AreaField({
  label,
  required,
  hint,
  id,
  count,
  max,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  label: string
  required?: boolean
  hint?: string
  count?: number
  max?: number
}) {
  return (
    <div>
      <FieldLabel required={required} hint={hint} htmlFor={id}>
        {label}
      </FieldLabel>
      <div className="relative">
        <Textarea
          id={id}
          {...props}
          className={cn("min-h-20 text-xs", props.className)}
        />
        {typeof count === "number" && typeof max === "number" && (
          <span className="absolute right-2 bottom-1.5 text-[10px] text-neutral-400">
            {count}/{max}
          </span>
        )}
      </div>
    </div>
  )
}

export function ControlledAreaField<T extends FieldValues>({
  label,
  required,
  hint,
  id,
  name,
  control,
  max,
  ...props
}: React.ComponentProps<typeof Textarea> & {
  label: string
  required?: boolean
  hint?: string
  id: string
  max?: number
} & ControlledProps<T>) {
  const { clearErrors } = useFormContext<T>()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value = (field.value as string | undefined) ?? ""
        return (
          <div>
            <FieldLabel required={required} hint={hint} htmlFor={id}>
              {label}
            </FieldLabel>
            <div className="relative">
              <Textarea
                id={id}
                {...props}
                value={value}
                onChange={(e) => {
                  field.onChange(e.target.value)
                  clearErrors(name)
                }}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                aria-invalid={!!fieldState.error}
                className={cn(
                  "min-h-20 text-xs",
                  fieldState.error && "border-red-500",
                  props.className
                )}
              />
              {typeof max === "number" && (
                <span className="absolute right-2 bottom-1.5 text-[10px] text-neutral-400">
                  {value.length}/{max}
                </span>
              )}
            </div>
            <FieldError message={fieldState.error?.message} />
          </div>
        )
      }}
    />
  )
}

export function SelectField({
  label,
  required,
  hint,
  value,
  onChange,
  options,
  placeholder = "-- Please Select --",
  allowAny = true,
}: {
  label: string
  required?: boolean
  hint?: string
  value: string
  onChange: (v: string) => void
  options: string[] | { value: string; label: string }[]
  placeholder?: string
  allowAny?: boolean
}) {
  return (
    <div>
      <FieldLabel required={required} hint={hint}>
        {label}
      </FieldLabel>
      <Select
        value={value || null}
        onValueChange={(v) => onChange(v === "__any" ? "" : (v ?? ""))}
      >
        <SelectTrigger className="h-8 w-full text-xs">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowAny && <SelectItem value="__any">{placeholder}</SelectItem>}
          {options.map((o) => {
            const v = typeof o === "string" ? o : o.value
            const l = typeof o === "string" ? o : o.label
            return (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ControlledSelectField<T extends FieldValues>({
  label,
  required,
  hint,
  name,
  control,
  options,
  placeholder = "-- Please Select --",
  allowAny = true,
}: {
  label: string
  required?: boolean
  hint?: string
  options: string[] | { value: string; label: string }[]
  placeholder?: string
  allowAny?: boolean
} & ControlledProps<T>) {
  const { clearErrors } = useFormContext<T>()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div>
          <FieldLabel required={required} hint={hint}>
            {label}
          </FieldLabel>
          <Select
            value={(field.value as string | undefined) || null}
            onValueChange={(v) => {
              field.onChange(v === "__any" ? "" : (v ?? ""))
              clearErrors(name)
            }}
          >
            <SelectTrigger
              aria-invalid={!!fieldState.error}
              className={cn(
                "h-8 w-full text-xs",
                fieldState.error && "border-red-500"
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {allowAny && (
                <SelectItem value="__any">{placeholder}</SelectItem>
              )}
              {options.map((o) => {
                const v = typeof o === "string" ? o : o.value
                const l = typeof o === "string" ? o : o.label
                return (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <FieldError message={fieldState.error?.message} />
        </div>
      )}
    />
  )
}

export function RadioCards<T extends string>({
  value,
  onChange,
  options,
  error,
}: {
  value: T
  onChange: (v: T) => void
  options: T[]
  error?: string
}) {
  return (
    <div>
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as T)}
      className="flex gap-2"
    >
      {options.map((o) => (
        <Label
          key={o}
          className={cn(
            "flex h-8 flex-1 cursor-pointer items-center justify-between rounded border px-2.5 text-xs",
            value === o
              ? "border-emerald-700 bg-emerald-50/50"
              : "border-neutral-300 text-neutral-500"
          )}
        >
          <span>{o || "—"}</span>
          <RadioGroupItem value={o} className="size-3.5" />
        </Label>
      ))}
      </RadioGroup>
      <FieldError message={error} />
    </div>
  )
}

export function ControlledRadioCards<T extends FieldValues, V extends string>({
  name,
  control,
  options,
}: ControlledProps<T> & { options: V[] }) {
  const { clearErrors } = useFormContext<T>()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <RadioCards
          value={(field.value as V | undefined) ?? ("" as V)}
          onChange={(v) => {
            field.onChange(v)
            clearErrors(name)
          }}
          options={options}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}

export function RadioInline({
  value,
  onChange,
  options,
  error,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  error?: string
}) {
  return (
    <div>
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v ?? "")}
      className="flex flex-wrap items-center gap-x-3 gap-y-1"
    >
      {options.map((o) => (
        <Label
          key={o}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-neutral-600"
        >
          <RadioGroupItem value={o} className="size-3.5" />
          {o}
        </Label>
      ))}
      </RadioGroup>
      <FieldError message={error} />
    </div>
  )
}

export function ControlledRadioInline<T extends FieldValues>({
  name,
  control,
  options,
}: ControlledProps<T> & { options: string[] }) {
  const { clearErrors } = useFormContext<T>()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <RadioInline
          value={(field.value as string | undefined) ?? ""}
          onChange={(v) => {
            field.onChange(v)
            clearErrors(name)
          }}
          options={options}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}

export function CheckRow({
  checked,
  onChange,
  label,
  error,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  error?: string
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold text-neutral-700">{label}</p>
      <div className="flex h-8 items-center">
        <Checkbox checked={checked} onCheckedChange={onChange} />
      </div>
      <FieldError message={error} />
    </div>
  )
}

export function ControlledCheckRow<T extends FieldValues>({
  name,
  control,
  label,
}: ControlledProps<T> & { label: string }) {
  const { clearErrors } = useFormContext<T>()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <CheckRow
          checked={(field.value as boolean | undefined) ?? false}
          onChange={(v) => {
            field.onChange(v)
            clearErrors(name)
          }}
          label={label}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}

export function StaticField({ 
  label, 
  value, 
  hint 
}: { 
  label: string
  value: string
  hint?: string
}) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <p className="flex h-8 items-center text-xs text-neutral-500">
        {value || "-"}
      </p>
    </div>
  )
}

export function DateField({
  label,
  required,
  hint,
  value,
  onChange,
  error,
}: {
  label: string
  required?: boolean
  hint?: string
  value: Date | undefined
  onChange: (d: Date | undefined) => void
  error?: string
}) {
  return (
    <div>
      <FieldLabel required={required} hint={hint}>{label}</FieldLabel>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className={cn(
                "h-8 w-40 justify-start gap-2 px-2 text-xs font-normal",
                !value && "text-neutral-400",
                error && "border-red-500"
              )}
            >
              {value ? format(value, "dd/MM/yyyy") : "dd/mm/yyyy"}
              <CalendarDays className="ml-auto size-3.5 text-neutral-500" />
            </Button>
          }
        />
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
      <FieldError message={error} />
    </div>
  )
}

export function ControlledDateField<T extends FieldValues>({
  label,
  required,
  hint,
  name,
  control,
}: {
  label: string
  required?: boolean
  hint?: string
} & ControlledProps<T>) {
  const { clearErrors } = useFormContext<T>()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <DateField
          label={label}
          required={required}
          hint={hint}
          value={field.value as Date | undefined}
          onChange={(d) => {
            field.onChange(d)
            clearErrors(name)
          }}
          error={fieldState.error?.message}
        />
      )}
    />
  )
}

export function CountInput({
  label,
  required,
  hint,
  id,
  value,
  max,
  onChange,
  placeholder,
  error,
}: {
  label: string
  required?: boolean
  hint?: string
  id: string
  value: string
  max: number
  onChange: (v: string) => void
  placeholder?: string
  error?: string
}) {
  return (
    <div>
      <FieldLabel required={required} hint={hint} htmlFor={id}>
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
          className={cn("h-8 pr-12 text-xs", error && "border-red-500")}
        />
        <span className="absolute right-2 bottom-2 text-[10px] text-neutral-400">
          {value.length}/{max}
        </span>
      </div>
      <FieldError message={error} />
    </div>
  )
}

export function ControlledCountInput<T extends FieldValues>({
  label,
  required,
  hint,
  id,
  name,
  control,
  max,
  placeholder,
}: {
  label: string
  required?: boolean
  hint?: string
  id: string
  max: number
  placeholder?: string
} & ControlledProps<T>) {
  const { clearErrors } = useFormContext<T>()
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value = (field.value as string | undefined) ?? ""
        return (
          <CountInput
            label={label}
            required={required}
            hint={hint}
            id={id}
            value={value}
            max={max}
            onChange={(v) => {
              field.onChange(v)
              clearErrors(name)
            }}
            placeholder={placeholder}
            error={fieldState.error?.message}
          />
        )
      }}
    />
  )
}
