
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  icon
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300 my-auto">
          <div className="p-8 text-center">
            {icon && (
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                {icon}
              </div>
            )}

            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">{title}</h3>
            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
              {message}
            </p>

            <div className="flex flex-col space-y-3">
              <button
                onClick={onConfirm}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                {confirmLabel}
              </button>
              <button
                onClick={onCancel}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                {cancelLabel}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">SROC Confirmation Protocol</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
