"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CATEGORIES, UNITS, ALLERGENS } from "../lib/constants";
import type { Allergen, CreateDonationPayload, DonationCategory, DonationUnit } from "../lib/types";

type Props = {
  isOpen: boolean;
  rowIndex: number;
  initial: Partial<CreateDonationPayload>;
  errors: string[];
  onSave: (rowIndex: number, data: Partial<CreateDonationPayload>) => void;
  onCancel: () => void;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-ravively-green focus:outline-none";

export function EditDonationRowModal({ isOpen, rowIndex, initial, errors, onSave, onCancel }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [draft, setDraft] = useState<Partial<CreateDonationPayload>>(initial);

  useEffect(() => {
    if (isOpen) setDraft(initial);
  }, [isOpen, rowIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = (e: MediaQueryList | MediaQueryListEvent) => setIsMobile(e.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  function set<K extends keyof CreateDonationPayload>(field: K, value: CreateDonationPayload[K]) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function toggleAllergen(value: Allergen) {
    setDraft((d) => {
      const list = d.allergens ?? [];
      return {
        ...d,
        allergens: list.includes(value) ? list.filter((a) => a !== value) : [...list, value],
      };
    });
  }

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
              isMobile ? "w-full rounded-t-2xl max-h-[92dvh]" : "w-[520px] rounded-2xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">
                  Ligne {rowIndex + 1} — erreur à corriger
                </p>
                <h2 className="text-lg font-bold text-gray-900">
                  {draft.title || "Don sans titre"}
                </h2>
                <div className="mt-1 space-y-0.5">
                  {errors.map((e, i) => (
                    <p key={i} className="text-sm text-red-600">{e}</p>
                  ))}
                </div>
              </div>
              <button
                onClick={onCancel}
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="h-4 w-4">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Produit</label>
                <input
                  value={draft.title ?? ""}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex : Pains au chocolat"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Catégorie</label>
                <select
                  value={draft.category ?? ""}
                  onChange={(e) => set("category", e.target.value as DonationCategory)}
                  className={inputClass}
                >
                  <option value="">Choisissez une catégorie</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Quantité</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={draft.quantity ?? ""}
                    onChange={(e) => set("quantity", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Unité</label>
                  <select
                    value={draft.unit ?? ""}
                    onChange={(e) => set("unit", e.target.value as DonationUnit)}
                    className={inputClass}
                  >
                    <option value="">Choisissez</option>
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Date limite (DLC)</label>
                <input
                  type="date"
                  value={draft.expirationDate ?? ""}
                  onChange={(e) => set("expirationDate", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Allergènes <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS.map((a) => {
                    const checked = (draft.allergens ?? []).includes(a.value);
                    return (
                      <label
                        key={a.value}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          checked ? "border-ravively-green bg-ravively-green text-white" : "border-gray-300 text-gray-700"
                        }`}
                      >
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleAllergen(a.value)} />
                        {a.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Consignes <span className="text-gray-400 font-normal">(optionnel)</span></label>
                <input
                  value={draft.pickupInstructions ?? ""}
                  onChange={(e) => set("pickupInstructions", e.target.value)}
                  placeholder="Ex : Porte de service à partir de 14h"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={onCancel} className="btn-ghost btn-sm flex-1">
                Annuler
              </button>
              <button
                type="button"
                onClick={() => onSave(rowIndex, draft)}
                className="btn-primary btn-sm flex-1"
              >
                Corriger et valider
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
