const StatsCard = ({ label, value }: { label: string; value: number }) => {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
};

export default StatsCard;
