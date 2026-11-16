export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
  onDark = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  onDark?: boolean;
}) {
  return (
    <div className={`mb-10 ${center ? "text-center" : ""}`}>
      {eyebrow && (
        <p
          className={`mb-2 text-sm font-semibold uppercase tracking-wide ${
            onDark ? "text-gold-light" : "text-gold"
          }`}
        >
          {eyebrow}
        </p>
      )}
      <h2 className={`text-3xl font-bold sm:text-4xl ${onDark ? "text-white" : "text-navy"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-3 max-w-2xl text-base md:text-lg ${onDark ? "text-white/80" : "text-charcoal/70"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
