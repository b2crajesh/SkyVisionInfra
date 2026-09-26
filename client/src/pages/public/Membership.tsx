import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";
import Card from "../../components/ui/Card";
import Reveal from "../../components/Reveal";

const tiers = [
  {
    name: "Associate",
    description:
      "Entry-level membership for new participants. Access to your member dashboard, plot browsing, and referral tools.",
  },
  {
    name: "Silver",
    description:
      "Awarded to members who reach an initial booking and sponsorship milestone, unlocking recognition within the network.",
  },
  {
    name: "Gold",
    description:
      "For members with a sustained record of qualifying activity and sponsorship, reflecting deeper engagement with the program.",
  },
  {
    name: "Platinum",
    description:
      "A senior rank recognising long-standing members who have built substantial referral chains and transaction history.",
  },
  {
    name: "Diamond",
    description:
      "Our highest recognition tier, reserved for members with exceptional, sustained contribution to the network's growth.",
  },
];

export default function Membership() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Membership Program"
            title="A Structured Path for Every Member"
            subtitle="Membership with Sky Vision Infra gives you a documented profile, access to plot bookings, and the ability to sponsor new members into the network. Rank progression reflects engagement and qualifying activity, not payment alone."
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {tiers.map((t) => (
            <Reveal key={t.name}>
              <Card className="h-full text-center">
                <h3 className="mb-2 text-lg font-semibold text-navy">{t.name}</h3>
                <p className="text-sm text-charcoal/70">{t.description}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <Card>
            <h3 className="mb-2 text-lg font-semibold text-navy">What Membership Includes</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-charcoal/70">
              <li>A unique member code and secure login to your personal dashboard</li>
              <li>Visibility into your own booking amount, plot sales, and rank</li>
              <li>The ability to sponsor and refer new members into the network</li>
              <li>Access to plot booking opportunities as they become available</li>
              <li>Nominee details on record for account continuity</li>
            </ul>
          </Card>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
