import Card from "./ui/Card";

export default function ServiceCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Card className="h-full transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-navy text-xl text-gold">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-navy">{title}</h3>
      <p className="text-sm text-charcoal/70">{description}</p>
    </Card>
  );
}
