const EmptyState = ({ title, subtitle }: { title: string; subtitle: string }) => {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 shadow-soft">
      <p className="text-xl font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6">{subtitle}</p>
    </div>
  );
};

export default EmptyState;
