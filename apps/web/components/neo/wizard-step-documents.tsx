"use client"

import { useRef, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { Check, CloudUpload, Trash } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { FieldError, FieldLabel } from "@/components/neo/wizard-fields"
import { fileTypes } from "@/lib/neo-wizard"
import type { WizardValues } from "@/lib/neo-schemas"
import { cn } from "@workspace/ui/lib/utils"

const ACCEPTED_EXT = [
  "jpeg",
  "jpg",
  "pdf",
  "xls",
  "xlsx",
  "xlsm",
  "doc",
  "docx",
  "eml",
  "msg",
  "zip",
  "png",
  "ppt",
  "pptx",
]

function FileTypePicker({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className={cn(
                "h-8 w-full justify-start text-xs font-normal",
                !value && "text-neutral-400",
                error && "border-red-500"
              )}
            >
              {value || "-- Please Select File Type --"}
            </Button>
          }
        />
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search" />
            <CommandList>
              <CommandEmpty>No file type found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__none"
                  onSelect={() => {
                    onChange("")
                    setOpen(false)
                  }}
                  className="bg-emerald-800 text-xs font-semibold text-white data-selected:bg-emerald-800 data-selected:text-white"
                >
                  -- Please Select File Type --
                </CommandItem>
                {fileTypes.map((t) => (
                  <CommandItem
                    key={t}
                    value={t}
                    onSelect={() => {
                      onChange(t)
                      setOpen(false)
                    }}
                    className="text-xs"
                  >
                    {t}
                    {value === t && <Check className="ml-auto size-3.5" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FieldError message={error} />
    </div>
  )
}

export function DocumentsStep() {
  const {
    setValue,
    control,
    clearErrors,
    formState: { errors },
  } = useFormContext<WizardValues>()
  const docs = useWatch({ control, name: "docs" }) ?? []
  const notification = useWatch({ control, name: "notification" }) ?? ""
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const incoming = Array.from(files)
    const bad = incoming.find((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? ""
      return !ACCEPTED_EXT.includes(ext)
    })
    if (bad) {
      setFileError(
        `"${bad.name}" is not a permitted file type (jpeg, jpg, pdf, xls, xlsx, xlsm, doc, docx, msg, emails, zip, png, ppt, pptx)`
      )
      return
    }
    const oversized = incoming.find((f) => f.size > 25 * 1024 * 1024)
    if (oversized) {
      setFileError(`"${oversized.name}" exceeds the 25 MB limit`)
      return
    }
    const next = incoming.map((f) => ({
      name: f.name.slice(0, 255),
      type: "",
      description: "",
    }))
    setValue("docs", [...docs, ...next], { shouldValidate: true })
    setFileError(null)
  }

  const updateDoc = (
    i: number,
    patch: Partial<{ type: string; description: string }>
  ) => {
    const next = docs.map((d, j) => (j === i ? { ...d, ...patch } : d))
    setValue("docs", next, { shouldValidate: true })
    clearErrors(`docs.${i}`)
  }

  const removeDoc = (i: number) => {
    setValue(
      "docs",
      docs.filter((_, j) => j !== i),
      { shouldValidate: true }
    )
    clearErrors("docs")
  }

  return (
    <div>
      {notification && (
        <p className="mb-3 text-[11px] text-neutral-600">
          Based on the method of notification (
          <span className="font-semibold">{notification}</span>) given in the
          previous step, upload the relevant document to support the
          selection.
        </p>
      )}

      <FieldLabel hint="Multiple supporting files in the specified format mentioned in the instructions of this page can be added to support the claim">
        Upload Documents
      </FieldLabel>
      <div className="grid grid-cols-2 gap-x-10">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-8 text-[11px] font-bold"
            onClick={() => fileRef.current?.click()}
          >
            UPLOAD
          </Button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-8 flex-1 items-center gap-2 rounded border border-dashed border-neutral-300 px-3 text-xs text-neutral-400"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              addFiles(e.dataTransfer.files)
            }}
          >
            <CloudUpload className="size-4" />
            Drop files here
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".jpeg,.jpg,.pdf,.xls,.xlsx,.xlsm,.doc,.docx,.eml,.msg,.zip,.png,.ppt,.pptx"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-bold text-neutral-700">
            Instructions
          </p>
          <p className="text-[11px] text-neutral-500">
            Permitted file types include jpeg, jpg, pdf, xls, xlsx, xlsm, doc,
            docx, msg, emails, zip, png, ppt, pptx
          </p>
        </div>
      </div>

      <FieldError message={fileError ?? undefined} />

      <div className="mt-4 border border-neutral-200">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold text-neutral-600">
                File Name
              </TableHead>
              <TableHead className="w-56 text-[11px] font-semibold text-neutral-600">
                File Type
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-neutral-600">
                Description
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="py-6 text-center text-xs text-neutral-500"
                >
                  No items available
                </TableCell>
              </TableRow>
            ) : (
              docs.map((d, i) => {
                const docErrors = errors.docs?.[i]
                return (
                  <TableRow key={`${d.name}-${i}`}>
                    <TableCell className="align-top">{d.name}</TableCell>
                    <TableCell className="align-top">
                      <FileTypePicker
                        value={d.type}
                        onChange={(v) => updateDoc(i, { type: v })}
                        error={docErrors?.type?.message}
                      />
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="relative">
                        <Textarea
                          value={d.description}
                          maxLength={2000}
                          onChange={(e) =>
                            updateDoc(i, { description: e.target.value })
                          }
                          placeholder="Description"
                          aria-invalid={!!docErrors?.description}
                          className={cn(
                            "min-h-10 pr-14 text-xs",
                            docErrors?.description && "border-red-500"
                          )}
                        />
                        <span className="absolute right-2 bottom-1.5 text-[10px] text-neutral-400">
                          {d.description.length}/2000
                        </span>
                      </div>
                      <FieldError message={docErrors?.description?.message} />
                    </TableCell>
                    <TableCell className="align-top">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeDoc(i)}
                        aria-label={`Remove ${d.name}`}
                      >
                        <Trash className="size-3.5 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
