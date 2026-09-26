import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";
import Card from "../../components/ui/Card";
import Reveal from "../../components/Reveal";

const tiers = [
  {
    name: "Direct Sale Commission",
    detail:
      "Applicable when a member's directly sponsored referral completes a qualifying plot booking.",
  },
  {
    name: "Rank Advancement Bonus",
    detail:
      "A one-time recognition when a member's qualifying activity results in a rank promotion.",
  },
  {
    name: "Network Development Credit",
    detail:
      "Calculated periodically based on the documented sales activity of a member's sponsored network.",
  },
];

export default function Commission() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Commission Plan"
            title="A Transparent Compensation Structure"
            subtitle="Our commission plan rewards qualifying sales and sponsorship activity. Every calculation is tied to logged sales and member records in our system."
          />
        </Reveal>

        <Reveal>
          <div className="mb-8 rounded-md border-2 border-gold bg-gold/10 p-5 text-sm text-navy">
            <strong>Important Disclaimer:</strong> Commissions are not
            guaranteed income. Eligibility for any commission is subject to
            qualifying activity, verification, and the company's
            compensation-plan terms and conditions, which may be revised from
            time to time. Sky Vision Infra & Developers makes no
            representation regarding potential earnings, and no member should
            treat commission participation as a substitute for independent
            financial advice.
          </div>
        </Reveal>

        <div className="space-y-4">
          {tiers.map((t) => (
            <Reveal key={t.name}>
              <Card>
                <h3 className="mb-1 text-lg font-semibold text-navy">{t.name}</h3>
                <p className="text-sm text-charcoal/70">{t.detail}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8">
          <Card>
            <h3 className="mb-2 text-lg font-semibold text-navy">Eligibility Basics</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-charcoal/70">
              <li>Member account must be in active, good standing</li>
              <li>Underlying plot sale must be completed and recorded</li>
              <li>Sponsor relationship must be verified in our system</li>
              <li>Commission terms are subject to periodic review and revision</li>
            </ul>
          </Card>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
