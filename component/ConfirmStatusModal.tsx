"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { useState } from "react"

export type StatusAction = "approve" | "reject" | "delete" | "confirm"

interface ConfirmStatusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: StatusAction
  title: string
  description?: string
  itemName?: string
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  confirmText?: string
  cancelText?: string
  onConfirm: (reason?: string) => void | Promise<void>
  isLoading?: boolean
}

export function ConfirmStatusModal({
  open,
  onOpenChange,
  action,
  title,
  description,
  itemName,
  requireReason = false,
  reasonLabel = "Lý do",
  reasonPlaceholder = "Nhập lý do...",
  confirmText,
  cancelText = "Hủy",
  onConfirm,
  isLoading = false,
}: ConfirmStatusModalProps) {
  const [reason, setReason] = useState("")

  const getActionConfig = () => {
    switch (action) {
      case "approve":
        return {
          icon: CheckCircle,
          iconColor: "text-green-600",
          buttonVariant: "default" as const,
          buttonClassName: "bg-green-600 hover:bg-green-700",
          defaultConfirmText: "Xác nhận duyệt",
          defaultDescription: `Bạn có chắc muốn duyệt ${itemName || "mục này"}?`,
        }
      case "reject":
        return {
          icon: XCircle,
          iconColor: "text-red-600",
          buttonVariant: "destructive" as const,
          buttonClassName: "bg-red-600 hover:bg-red-700",
          defaultConfirmText: "Xác nhận từ chối",
          defaultDescription: `Bạn có chắc muốn từ chối ${itemName || "mục này"}?`,
        }
      case "delete":
        return {
          icon: AlertCircle,
          iconColor: "text-red-600",
          buttonVariant: "destructive" as const,
          buttonClassName: "bg-red-600 hover:bg-red-700",
          defaultConfirmText: "Xác nhận xóa",
          defaultDescription: `Bạn có chắc muốn xóa ${itemName || "mục này"}? Hành động này không thể hoàn tác.`,
        }
      case "confirm":
        return {
          icon: AlertCircle,
          iconColor: "text-blue-600",
          buttonVariant: "default" as const,
          buttonClassName: "bg-blue-600 hover:bg-blue-700",
          defaultConfirmText: "Xác nhận",
          defaultDescription: description || `Bạn có chắc muốn thực hiện hành động này?`,
        }
      default:
        return {
          icon: AlertCircle,
          iconColor: "text-gray-600",
          buttonVariant: "default" as const,
          buttonClassName: "",
          defaultConfirmText: "Xác nhận",
          defaultDescription: description || "Bạn có chắc muốn thực hiện hành động này?",
        }
    }
  }

  const config = getActionConfig()
  const Icon = config.icon

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      return
    }
    await onConfirm(reason.trim() || undefined)
    if (!isLoading) {
      setReason("")
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setReason("")
    onOpenChange(false)
  }

  const isConfirmDisabled = requireReason && !reason.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.iconColor} bg-opacity-10`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {description || config.defaultDescription}
          </DialogDescription>
        </DialogHeader>

        {requireReason && (
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">{reasonLabel}</Label>
            <Textarea
              id="reason"
              placeholder={reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              disabled={isLoading}
            />
            {requireReason && !reason.trim() && (
              <p className="text-sm text-red-600">Vui lòng nhập {reasonLabel.toLowerCase()}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            className={config.buttonClassName}
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              confirmText || config.defaultConfirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

