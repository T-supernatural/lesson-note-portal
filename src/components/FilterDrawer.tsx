import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

const FilterDrawer = ({ open, title = 'Filters', onClose, onClear, onApply, children }: { open: boolean; title?: string; onClose: () => void; onClear?: () => void; onApply?: () => void; children: ReactNode }) => {
  if (!open) return null;
  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}><button type="button" className="absolute inset-0 bg-slate-950/30" aria-label="Close filters" onClick={onClose} /><div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:w-[28rem] md:rounded-none md:rounded-l-3xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-950">{title}</h2><button type="button" onClick={onClose} aria-label="Close filters" className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="space-y-4">{children}</div><div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">{onClear ? <Button type="button" variant="outline" onClick={onClear}>Clear</Button> : null}<Button type="button" className="flex-1" onClick={() => { onApply?.(); onClose(); }}>Apply filters</Button></div></div></div>;
};

export default FilterDrawer;
