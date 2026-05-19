interface HeaderProps {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
}

export function Header({ name, description, logoUrl }: HeaderProps) {
  return (
    <header className="relative mb-10 overflow-hidden text-center">
      <div
        className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, #D95F3B 0%, transparent 70%)" }}
        aria-hidden
      />
      {logoUrl && (
        <img
          src={logoUrl}
          alt={name}
          className="relative mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-md"
        />
      )}
      <h1 className="relative font-serif text-4xl font-black tracking-tight text-stone-900 md:text-5xl">
        {name}
      </h1>
      {description && (
        <p className="relative mt-3 text-stone-500">{description}</p>
      )}
    </header>
  );
}
