'use client'

import { useRender } from '@base-ui/react/use-render'
import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useFormState,
  type ControllerProps,
  type DefaultValues,
  type FieldPath,
  type FieldValues,
  type Path,
} from 'react-hook-form'
import { type z } from 'zod'

import { showErrorDialog } from '@/components/error'
import { Label } from '@/components/label'
import { type FormResultWithError } from '@/utils/errors'
import { cn } from '@/utils/styling'

type FormProps<TValues extends FieldValues, TResult> = {
  /** Zod schema used for client-side validation. */
  schema: z.ZodType<TValues, TValues>
  /** Initial field values. Cannot be set on individual fields. */
  defaultValues?: DefaultValues<TValues>
  /**
   * Called with validated data on submit. Return a `Result`: an `INVALID_INPUT`
   * error maps its `fieldErrors` onto the matching fields; any other error opens
   * the shared error dialog.
   */
  onSubmit: (values: TValues) => Promise<FormResultWithError<TResult>>
  /** Called after `onSubmit` returns a successful result. */
  onSuccess?: (value: TResult, values: TValues) => void
  /** Reset fields to `defaultValues` after a successful submit. Defaults to `false`. */
  resetOnSuccess?: boolean
  children: React.ReactNode
} & Omit<React.ComponentProps<'form'>, 'onSubmit' | 'children'>

/**
 * Schema-validated form with the project's `Result` error handling built in.
 * Wrap fields with the `FormField`/`FormItem`/... primitives below; they read
 * the form from context, so no `control` prop is needed.
 */
function Form<TValues extends FieldValues, TResult>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  resetOnSuccess = false,
  className,
  children,
  ...props
}: FormProps<TValues, TResult>) {
  const form = useForm<TValues>({ resolver: zodResolver(schema), defaultValues })

  return (
    <FormProvider {...form}>
      <form
        data-slot="form"
        className={cn('grid gap-6', className)}
        onSubmit={form.handleSubmit(async (values) => {
          const result = await onSubmit(values)
          if (result.ok) {
            if (resetOnSuccess) {
              form.reset()
            }
            onSuccess?.(result.val, values)
            return
          }
          if (result.err.type === 'INVALID_INPUT') {
            for (const [field, message] of Object.entries(result.err.fieldErrors)) {
              form.setError(field as Path<TValues>, { message }, { shouldFocus: true })
            }
            return
          }
          showErrorDialog(result.err)
        })}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  )
}

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = { name: TName }

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

type FormItemContextValue = { id: string }

const FormItemContext = React.createContext<FormItemContextValue | null>(null)

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext?.name })

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }
  if (!itemContext) {
    throw new Error('useFormField should be used within <FormItem>')
  }

  const fieldState = getFieldState(fieldContext.name, formState)
  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn('grid gap-2', className)} {...props} />
    </FormItemContext.Provider>
  )
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ render, ...props }: useRender.ComponentProps<'input'>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return useRender({
    render: render ?? <input />,
    props: {
      'data-slot': 'form-control',
      'id': formItemId,
      'aria-describedby': error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId,
      'aria-invalid': !!error,
      ...props,
    },
  })
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

function FormMessage({ className, children, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? '') : children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-sm text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
}
