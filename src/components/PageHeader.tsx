const PageHeader = ({ title, description }: { title: string; description?: string }) => {
  return (
    <div className="mb-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </div>
  );
};

export default PageHeader;
