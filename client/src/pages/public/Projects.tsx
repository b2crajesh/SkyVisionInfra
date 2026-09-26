import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";
import Card from "../../components/ui/Card";
import Reveal from "../../components/Reveal";

const projects = [
  {
    name: "Sky Meadows Township",
    stage: "Completed",
    summary:
      "A fully developed residential plotted layout with internal roads, drainage, and landscaped common areas.",
  },
  {
    name: "Vision Valley Infrastructure Upgrade",
    stage: "In Progress",
    summary:
      "Road widening, electrical grid extension, and water supply infrastructure for an existing plotted development.",
  },
  {
    name: "Horizon Green Master Plan",
    stage: "Planning",
    summary:
      "Layout design and regulatory approvals underway for a mixed residential-commercial land parcel.",
  },
];

export default function Projects() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Projects"
            title="Development Work Across Stages"
            subtitle="A look at how our projects move from planning through infrastructure to completion."
          />
        </Reveal>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {projects.map((p) => (
            <Reveal key={p.name}>
              <Card>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold">
                  {p.stage}
                </p>
                <h3 className="mb-2 text-lg font-semibold text-navy">{p.name}</h3>
                <p className="text-sm text-charcoal/70">{p.summary}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
