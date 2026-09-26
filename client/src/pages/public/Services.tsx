import PublicLayout from "../../components/PublicLayout";
import ServiceCard from "../../components/ServiceCard";
import SectionHeading from "../../components/ui/SectionHeading";
import Reveal from "../../components/Reveal";

const services = [
  {
    icon: "🏞️",
    title: "Land Sales",
    description:
      "We source and sell land parcels with verified titles, clear boundary documentation, and transparent pricing, guiding buyers through every step of due diligence.",
  },
  {
    icon: "🏗️",
    title: "Property Development",
    description:
      "From master planning to road, water, and electrical infrastructure, we develop raw land into ready-to-build plots and residential layouts.",
  },
  {
    icon: "📈",
    title: "Real Estate Opportunities",
    description:
      "We identify emerging growth corridors and structured investment opportunities in land and early-stage development projects.",
  },
  {
    icon: "🎖️",
    title: "Membership Program",
    description:
      "A tiered membership structure - Associate through Diamond - that recognises engagement, participation, and contribution to the network.",
  },
  {
    icon: "🔗",
    title: "Sponsor & Referral Program",
    description:
      "Members can sponsor new members into the network, building a documented referral chain that is tracked transparently in every profile.",
  },
  {
    icon: "🗂️",
    title: "Member Management",
    description:
      "A secure back-office system for onboarding, verifying, and maintaining member records, ranks, and account status.",
  },
  {
    icon: "📋",
    title: "Plot Sales Management",
    description:
      "Every plot sale is logged against a member and a reference, with area, amount, and date tracked for full transaction history.",
  },
  {
    icon: "💰",
    title: "Commission Management",
    description:
      "A rules-based, disclosed commission structure tied to qualifying sales and sponsorship activity, calculated and recorded transparently.",
  },
];

export default function Services() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Our Services"
            title="What Sky Vision Infra Offers"
            subtitle="A complete set of services spanning land development, sales, and member-driven growth - each built on documented, auditable processes."
          />
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Reveal key={s.title}>
              <ServiceCard {...s} />
            </Reveal>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
