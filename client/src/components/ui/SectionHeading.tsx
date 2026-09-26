export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-10 ${center ? "text-center" : ""}`}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl font-bold text-navy sm:text-4xl">{title}</h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-base text-charcoal/70 md:text-lg">
          {subtitle}
        </p>
      )}
    </div>
  );
}
