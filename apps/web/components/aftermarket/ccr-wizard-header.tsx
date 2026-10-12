"use client"

import { RefreshCw } from "lucide-react"
import { ccrWizardSteps } from "@/lib/ccr-data"
import { cn } from "@workspace/ui/lib/utils"

export function CcrWizardHeader({
  title,
  kind,
  activeStep,
}: {
  title: string
  kind: "standard" | "alb"
  activeStep: number
}) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <h1 className="text-[15px] font-bold text-neutral-900">
          {title}
          {kind === "alb" ? " (ALB)" : ""}
        </h1>
        <RefreshCw className="size-3.5 text-neutral-700" />
      </div>

      <div className="mt-2">
        <div className="flex h-0.5 w-full">
          <span
            className="h-full bg-emerald-800"
            style={{
              width: `${((activeStep + 1) / ccrWizardSteps.length) * 100}%`,
            }}
          />
          <span className="h-full flex-1 bg-neutral-200" />
        </div>
        <ol className="mt-1 flex items-start text-[11px]">
          {ccrWizardSteps.map((step, i) => (
            <li
              key={step}
              className={cn(
                "flex-1 px-1 text-center",
                i === activeStep
                  ? "font-semibold text-neutral-900"
                  : "text-neutral-400"
              )}
            >
              {step}
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}
