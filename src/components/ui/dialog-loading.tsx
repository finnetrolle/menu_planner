import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DialogLoadingFallbackProps {
  open: boolean
  title: string
  description: string
  onOpenChange: (open: boolean) => void
}

export default function DialogLoadingFallback({
  open,
  title,
  description,
  onOpenChange,
}: DialogLoadingFallbackProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-muted-foreground">Подготавливаем форму...</div>
      </DialogContent>
    </Dialog>
  )
}
