"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FilePenLine, SquarePen, Triangle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { CcrTopNav } from "@/components/aftermarket/ccr-top-nav"
import { FieldError } from "@/components/aftermarket/wizard-fields"
import {
  createCcrTypeDefaults,
  createCcrTypeSchema,
  type CreateCcrTypeInput,
  type CreateCcrTypeValues,
} from "@/lib/ccr-schemas"
import { cn } from "@workspace/ui/lib/utils"

const options = [
  {
    key: "standard",
    title: "Create CCR",
    description: "Use this option to create Non ALB CCR.",
    icon: SquarePen,
  },
  {
    key: "alb",
    title: "Create ALB CCR",
    description: "Use this option to create ALB CCR.",
    icon: FilePenLine,
  },
] as const

function CornerFold({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-0 right-0 size-0 border-t-[14px] border-l-[14px] border-t-neutral-400 border-l-transparent",
        selected && "border-t-emerald-800"
      )}
    />
  )
}

export default function CreateCcrPage() {
  const router = useRouter()
  const form = useForm<CreateCcrTypeInput, unknown, CreateCcrTypeValues>({
    resolver: zodResolver(createCcrTypeSchema),
    defaultValues: createCcrTypeDefaults,
  })
  const selected = form.watch("ccrKind") ?? "standard"

  const onNext = form.handleSubmit((values) => {
    const params = new URLSearchParams({ kind: values.ccrKind })
    router.push(`/create-ccr/select-vendors?${params.toString()}`)
  })

  return (
    <div className="min-h-svh bg-white">
      <CcrTopNav active="home" />

      <main className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <h1 className="text-[15px] font-bold text-neutral-900">
            Create CCR
          </h1>
          <SquarePen className="size-4 text-neutral-800" />
        </div>
        <div className="mt-1 border-t border-neutral-200" />

        <form onSubmit={onNext}>
          <p className="mt-8 text-center text-[15px] font-medium text-emerald-900">
            Which type of CCR you wish to create?
          </p>

          <div className="mt-4 flex items-stretch justify-center gap-3">
            {options.map((opt) => {
              const active = selected === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    form.setValue("ccrKind", opt.key, { shouldValidate: true })
                  }
                  aria-pressed={active}
                  className={cn(
                    "relative w-44 border bg-white px-3 py-4 text-center outline-none transition-colors",
                    active
                      ? "border-emerald-800 shadow-[0_0_0_1px_var(--color-emerald-800)]"
                      : "border-neutral-300 hover:border-neutral-400"
                  )}
                >
                  <CornerFold selected={active} />
                  <opt.icon
                    className={cn(
                      "mx-auto size-7",
                      active ? "text-emerald-800" : "text-neutral-600"
                    )}
                  />
                  <span
                    className={cn(
                      "mt-2 block text-[12px] font-bold",
                      active ? "text-emerald-900" : "text-neutral-800"
                    )}
                  >
                    {opt.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-neutral-400">
                    {opt.description}
                  </span>
                  {active && (
                    <span className="absolute right-1 bottom-1 text-emerald-800">
                      <Triangle className="size-2.5 fill-emerald-800" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-3 text-center">
            <FieldError message={form.formState.errors.ccrKind?.message} />
          </div>

          <div className="mt-10 flex items-center justify-between">
            <Link
              href="/"
              className="rounded-sm border border-red-900/60 px-2.5 py-1 text-[11px] font-bold tracking-wide text-red-900 hover:bg-red-50"
            >
              CANCEL
            </Link>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="h-7 rounded-sm border-emerald-800 px-2.5 text-[11px] font-bold text-emerald-800"
            >
              NEXT
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
