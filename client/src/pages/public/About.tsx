import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";
import Card from "../../components/ui/Card";
import Reveal from "../../components/Reveal";

export default function About() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="About Us"
            title="Sky Vision Infra & Developers"
            subtitle="We are a real estate development and member services company focused on responsibly sourcing, developing, and managing land assets while building a transparent community of participants."
          />
        </Reveal>

        <Reveal>
          <p className="mb-6 text-charcoal/80">
            Founded with the belief that land ownership and real estate
            participation should be accessible, well-documented, and free of
            ambiguity, Sky Vision Infra & Developers works across the full
            lifecycle of a real estate project - from due diligence and
            acquisition, through planning and infrastructure development, to
            sales and long-term member engagement. Our administrative systems
            are built to keep every member record, transaction, and
            commission calculation auditable and secure.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Reveal>
            <Card>
              <h3 className="mb-2 text-lg font-semibold text-navy">Our Mission</h3>
              <p className="text-sm text-charcoal/70">
                To develop well-planned land assets and deliver them through a
                transparent membership and sales process that treats every
                member as a long-term stakeholder, not a one-time customer.
              </p>
            </Card>
          </Reveal>
          <Reveal>
            <Card>
              <h3 className="mb-2 text-lg font-semibold text-navy">Our Vision</h3>
              <p className="text-sm text-charcoal/70">
                To be recognised as the region's most trusted land and
                infrastructure developer, known for disciplined governance,
                accurate record-keeping, and fair treatment of members and
                sponsors alike.
              </p>
            </Card>
          </Reveal>
          <Reveal>
            <Card>
              <h3 className="mb-2 text-lg font-semibold text-navy">Our Values</h3>
              <ul className="list-inside list-disc space-y-1 text-sm text-charcoal/70">
                <li>Transparency in documentation and pricing</li>
                <li>Integrity in every member interaction</li>
                <li>Accountability in commission calculations</li>
                <li>Long-term thinking over short-term gain</li>
              </ul>
            </Card>
          </Reveal>
        </div>

        <Reveal className="mt-10">
          <Card>
            <h3 className="mb-2 text-lg font-semibold text-navy">Trust & Governance</h3>
            <p className="text-sm text-charcoal/70">
              Every member record in our system is protected behind
              authenticated access, sensitive identifiers such as Aadhaar and
              PAN numbers are masked in day-to-day views, and all sales and
              commission data is logged with dates and references. Our admin
              team reviews new member applications, sponsor relationships,
              and sales entries before they are finalised, ensuring that
              growth never comes at the cost of accuracy.
            </p>
          </Card>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
