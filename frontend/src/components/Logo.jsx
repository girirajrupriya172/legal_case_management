export default function Logo() {
  return (
    <div className="flex items-center gap-3 px-2 mb-stack-lg">
      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          balance
        </span>
      </div>
      <div>
        <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed leading-tight">
          Patidar & Associates
        </h1>
        <p className="text-[10px] font-label-md uppercase tracking-widest text-on-surface-variant">
          Elite Case Management
        </p>
      </div>
    </div>
  );
}
