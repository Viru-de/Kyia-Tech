import React from 'react';
import { AlertTriangle, Archive, Trash2, X, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Badge } from './Badge';

export interface RelatedRecordInfo {
  label: string;
  count: number;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  onConfirmArchive?: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  itemType?: string; // 'Client' | 'Quotation' | 'Invoice' | 'Payment' | 'Expense' | 'Renewal' | 'Record'
  relatedRecords?: RelatedRecordInfo[];
  deleteButtonText?: string;
  archiveButtonText?: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  onConfirmArchive,
  title,
  message,
  itemName,
  itemType = 'Record',
  relatedRecords = [],
  deleteButtonText = 'Delete Permanently',
  archiveButtonText = 'Archive Client (Recommended)',
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const totalRelated = relatedRecords.reduce((acc, r) => acc + r.count, 0);
  const hasRelated = totalRelated > 0;

  const modalTitle = title || `Delete ${itemType}?`;
  const defaultMessage =
    message ||
    (hasRelated
      ? `Are you sure you want to delete this ${itemType.toLowerCase()}? This action may also affect related records.`
      : `Are you sure you want to delete "${itemName || itemType}"? This action cannot be undone.`);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2.5 text-rose-700">
          <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="text-base font-extrabold text-slate-900">{modalTitle}</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Main warning text */}
        <div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {defaultMessage}
          </p>
          {itemName && (
            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Target: {itemName}</span>
            </div>
          )}
        </div>

        {/* Related Records Warning Box (Section 3 Requirement) */}
        {hasRelated && (
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 space-y-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-amber-950">
                  This client has related records in the system:
                </h5>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Deleting this client will either remove or orphan these historical business items. To preserve accounting integrity, archiving is strongly recommended.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {relatedRecords.map((r) => (
                <div
                  key={r.label}
                  className="px-2.5 py-1.5 rounded-lg bg-white/90 border border-amber-200 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-700 font-medium">{r.label}</span>
                  <Badge variant={r.count > 0 ? 'warning' : 'neutral'} size="sm">
                    {r.count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {/* If archiving is available, offer Safe Archive option */}
          {onConfirmArchive && (
            <button
              type="button"
              onClick={onConfirmArchive}
              disabled={isDeleting}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-amber-900 bg-amber-400/90 hover:bg-amber-400 border border-amber-500 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{archiveButtonText}</span>
            </button>
          )}

          {/* Hard Delete Button */}
          <button
            type="button"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-2xs shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : deleteButtonText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
