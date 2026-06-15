'use client'

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import { Fragment, useLayoutEffect, useState, type ComponentProps, type ReactNode } from 'react'

import { Button } from '@/components/button'
import { cn } from '@/utils/styling'

export type DialogButtonConfig = {
  label: string
  variant?: ComponentProps<typeof Button>['variant']
  onClick?: () => void
  href?: string
}

export type ImperativeDialogProps = {
  className?: string
  closeButton?: boolean
  onDismiss?: () => void
} & (
  | {
      title: string
      body?: ReactNode
      buttons?: DialogButtonConfig[]
      titleClassName?: string
      bodyClassName?: string
      children?: never
    }
  | {
      title?: never
      body?: never
      buttons?: never
      titleClassName?: never
      bodyClassName?: never
      children: ReactNode
    }
)

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={<Button variant="ghost" className="absolute top-4 right-4" size="icon-sm" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="dialog-header" className={cn('flex flex-col gap-2', className)} {...props} />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & { showCloseButton?: boolean }) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>Close</DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('font-heading leading-none font-medium', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

const ImperativeDialogPanel = ({
  title,
  body,
  children,
  titleClassName,
  bodyClassName,
  buttons = [{ label: 'OK' }],
  closeButton,
  className,
}: ImperativeDialogProps) => {
  return (
    <DialogContent className={className} showCloseButton={closeButton}>
      {children ?? (
        <>
          <DialogHeader>
            <DialogTitle className={titleClassName}>{title}</DialogTitle>
            {body &&
              (typeof body === 'string' ? (
                <DialogDescription className={bodyClassName}>
                  {body.split('\n').map((line, i, lines) => (
                    <Fragment key={i}>
                      {line}
                      {i < lines.length - 1 && <br />}
                    </Fragment>
                  ))}
                </DialogDescription>
              ) : (
                <div className={cn('text-sm text-muted-foreground', bodyClassName)}>{body}</div>
              ))}
          </DialogHeader>
          {buttons.length > 0 && (
            <DialogFooter>
              {buttons.map((button) => (
                <DialogClose
                  key={button.label}
                  render={
                    <Button
                      variant={button.variant ?? 'default'}
                      onClick={button.onClick}
                      href={button.href}
                    />
                  }
                >
                  {button.label}
                </DialogClose>
              ))}
            </DialogFooter>
          )}
        </>
      )}
    </DialogContent>
  )
}

const ControlledDialog = ({
  open,
  onDismiss,
  ...props
}: { open: boolean; onDismiss: () => void } & ImperativeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onDismiss()}>
      <ImperativeDialogPanel {...props} />
    </Dialog>
  )
}

const dialogStackRef = {
  current: null as null | {
    pushDialog: (props: ImperativeDialogProps & { children?: never }) => void
  },
}

/** Provide target to render dialogs into imperatively with the `dialog` function. */
export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialogStack, setDialogStack] = useState<
    (ImperativeDialogProps & { children?: never; open: boolean; key: string })[]
  >([])

  useLayoutEffect(() => {
    dialogStackRef.current = {
      pushDialog: (props) => {
        setDialogStack((stack) => [...stack, { ...props, open: true, key: crypto.randomUUID() }])
      },
    }
  })

  return (
    <>
      {children}
      {dialogStack.map(({ key, ...props }) => (
        <ControlledDialog
          key={key}
          {...props}
          onDismiss={() => {
            setDialogStack((stack) => stack.map((d) => (d.key === key ? { ...d, open: false } : d)))
            props.onDismiss?.()
            setTimeout(() => {
              setDialogStack((stack) => stack.filter((d) => d.key !== key))
            }, 1000)
          }}
        />
      ))}
    </>
  )
}

/** Imperatively render a dialog when called. */
export const dialog = (
  ...args:
    | [ImperativeDialogProps & { children?: never }]
    | [
        string,
        ...(
          | []
          | [string]
          | [Omit<ImperativeDialogProps & { children?: never }, 'title'>]
          | [string, Omit<ImperativeDialogProps & { children?: never }, 'title' | 'body'>]
        ),
      ]
) => {
  if (!dialogStackRef.current) throw new Error('DialogProvider not found')
  if (typeof args[0] === 'string') {
    const [title, ...restArgs] = args
    if (restArgs.length === 0) {
      return dialogStackRef.current.pushDialog({ title })
    }
    if (typeof restArgs[0] === 'string') {
      const [body, options] = restArgs
      return dialogStackRef.current.pushDialog({ title, body, ...(options || {}) })
    }
    const [options] = restArgs
    return dialogStackRef.current.pushDialog({ title, ...(options || {}) })
  }
  return dialogStackRef.current.pushDialog(args[0])
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
