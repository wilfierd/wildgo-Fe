"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteMessageConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

/**
 * DeleteMessageConfirm component shows a confirmation dialog before deleting a message
 *
 * Features:
 * - Warning icon and message
 * - Confirm and cancel buttons
 * - Loading state during deletion
 * - Error handling
 *
 * @param open - Whether the dialog is open
 * @param onOpenChange - Callback to change dialog state
 * @param onConfirm - Callback to confirm deletion
 */
export function DeleteMessageConfirm({ open, onOpenChange, onConfirm }: DeleteMessageConfirmProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    try {
      setLoading(true)
      setError(null)
      await onConfirm()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Failed to delete message:', err)
      setError(err.message || 'Failed to delete message')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={handleCancel}>
        <DialogHeader>
          <DialogTitle>Delete Message</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            {/* Warning message */}
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">
                  Are you sure you want to delete this message?
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This action cannot be undone. The message will be permanently deleted.
                </p>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
            className="hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Message'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
