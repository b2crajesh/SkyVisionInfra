import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";
import Card from "../../components/ui/Card";
import Reveal from "../../components/Reveal";

export default function Sponsor() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Sponsor Program"
            title="Grow the Network, Document Every Referral"
            subtitle="Our sponsor program lets existing associates introduce new associates into Sky Vision Infra, with every relationship recorded transparently on the associate's profile."
          />
        </Reveal>

        <Reveal>
          <Card className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-navy">How Sponsorship Works</h3>
            <p className="text-sm text-charcoal/70">
              When a new associate joins, they may be introduced by an existing
              associate, who becomes their recorded sponsor. This relationship is
              stored on the new associate's profile and is visible to our
              administrative team for verification. Sponsors do not process
              payments or hold associate funds - all bookings and payments are
              handled directly by Sky Vision Infra's admin team.
            </p>
          </Card>
        </Reveal>

        <Reveal>
          <Card className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-navy">Why Sponsor?</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-charcoal/70">
              <li>Help friends, family, or colleagues access documented land opportunities</li>
              <li>Build a recognised referral history tied to your associate profile</li>
              <li>Progress toward higher membership ranks through qualifying sponsorship activity</li>
              <li>Participate in our disclosed commission structure, subject to its terms</li>
            </ul>
          </Card>
        </Reveal>

        <Reveal>
          <Card>
            <h3 className="mb-2 text-lg font-semibold text-navy">Responsible Sponsorship</h3>
            <p className="text-sm text-charcoal/70">
              We ask every sponsor to introduce Sky Vision Infra accurately -
              as a land and real estate development company with an associate
              program, not as a guaranteed income opportunity. Full
              commission terms are available on our{" "}
              <a href="/commission" className="text-gold hover:underline">
                Commission Plan
              </a>{" "}
              page.
            </p>
          </Card>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
