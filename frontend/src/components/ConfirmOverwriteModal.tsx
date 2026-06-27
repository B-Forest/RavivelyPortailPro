"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  fieldLabel: string;
  currentValue: string;
  newValue: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmOverwriteModal({
  isOpen,
  fieldLabel,
  currentValue,
  newValue,
  onConfirm,
  onCancel,
}: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = (e: MediaQueryList | MediaQueryListEvent) => setIsMobile(e.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-50 flex justify-center bg-black/50 ${isMobile ? "items-end" : "items-center"}`}
          onClick={onCancel}
        >
          <motion.div
            initial={isMobile ? { y: "100%" } : { scale: 0.92, opacity: 0 }}
            animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={isMobile ? { y: "100%" } : { scale: 0.92, opacity: 0 }}
            transition={isMobile ? { duration: 0.28, ease: "easeInOut" } : { type: "spring", stiffness: 140, damping: 18 }}
            className={`relative flex flex-col bg-white shadow-xl ${
              isMobile
                ? "w-full rounded-t-2xl max-h-[90dvh]"
                : "w-[420px] rounded-2xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-ravively-green mb-1">
                  Champ déjà rempli
                </p>
                <h2 className="text-lg font-bold text-gray-900">{fieldLabel}</h2>
              </div>
              <button
                onClick={onCancel}
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Fermer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1 font-medium">Valeur actuelle</p>
                  <p className="font-semibold text-gray-700 break-words">{currentValue || <em className="text-gray-400 font-normal">vide</em>}</p>
                </div>
                <div className="rounded-xl border border-ravively-green/30 bg-green-50 p-3">
                  <p className="text-xs text-ravively-green mb-1 font-medium">Nouvelle valeur</p>
                  <p className="font-semibold text-gray-900 break-words">{newValue}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Voulez-vous remplacer la valeur actuelle par celle détectée par l&apos;IA ?
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-ghost btn-sm flex-1"
                >
                  Conserver
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="btn-primary btn-sm flex-1"
                >
                  Remplacer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
