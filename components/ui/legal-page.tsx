type LegalSection = {
  heading: string;
  body: string[];
};

export function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 lg:py-28">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="text-3xl lg:text-4xl font-light mb-3">{title}</h1>
      <p className="text-xs text-ink/40 mb-10">Last updated {lastUpdated}</p>

      {intro && (
        <p className="text-ink/70 leading-relaxed mb-10">{intro}</p>
      )}

      <div className="space-y-10">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="font-display text-xl mb-3">{section.heading}</h2>
            <div className="space-y-3 text-sm text-ink/65 leading-relaxed">
              {section.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
