import { Link } from "react-router-dom";
import PublicLayout from "../../components/PublicLayout";
import Hero from "../../components/Hero";
import ServiceCard from "../../components/ServiceCard";
import SectionHeading from "../../components/ui/SectionHeading";
import Button from "../../components/ui/Button";
import Reveal from "../../components/Reveal";

const previewServices = [
  {
    icon: "🏞️",
    title: "Land Sales",
    description:
      "Carefully vetted land parcels across growth corridors, sold with clear title and transparent documentation.",
  },
  {
    icon: "🏗️",
    title: "Property Development",
    description:
      "End-to-end development of residential and mixed-use plots, from planning approvals to infrastructure.",
  },
  {
    icon: "🤝",
    title: "Membership Program",
    description:
      "A structured membership model that rewards engagement, referrals, and long-term participation.",
  },
];

export default function Home() {
  return (
    <PublicLayout>
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="What We Do"
            title="A Full-Spectrum Real Estate Partner"
            subtitle="From land acquisition to member-driven growth, Sky Vision Infra brings structure and transparency to every stage of the real estate journey."
          />
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {previewServices.map((s) => (
            <Reveal key={s.title}>
              <ServiceCard {...s} />
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-8 text-center">
          <Link to="/services">
            <Button variant="outline">View All Services</Button>
          </Link>
        </Reveal>
      </section>

      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Why Sky Vision"
              title="Built on Trust, Governance, and Long-Term Thinking"
              subtitle="We hold ourselves to disciplined documentation, transparent member records, and a compensation structure that is disclosed in full, not hidden in fine print."
            />
          </Reveal>
          <div className="grid grid-cols-1 gap-6 text-white/90 sm:grid-cols-3">
            <Reveal>
              <div>
                <p className="mb-2 text-3xl font-bold text-gold">10+</p>
                <p className="text-sm">Years of combined leadership experience in land and infrastructure.</p>
              </div>
            </Reveal>
            <Reveal>
              <div>
                <p className="mb-2 text-3xl font-bold text-gold">100%</p>
                <p className="text-sm">Documented member records with masked, secure identity data.</p>
              </div>
            </Reveal>
            <Reveal>
              <div>
                <p className="mb-2 text-3xl font-bold text-gold">Clear</p>
                <p className="text-sm">Disclosed compensation terms with no guaranteed-income claims.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            center
            title="Ready to Take the Next Step?"
            subtitle="Whether you are exploring a plot purchase or considering membership, our team is ready to walk you through the details."
          />
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/membership">
              <Button variant="primary">Become a Member</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline">Talk to Us</Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </PublicLayout>
  );
}
