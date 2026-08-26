const PageHeader = ({ title, description }: { title: string; description?: string }) => {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
    </div>
  );
};

export default PageHeader;
