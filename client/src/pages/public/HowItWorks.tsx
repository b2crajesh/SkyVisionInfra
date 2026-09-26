import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";
import Reveal from "../../components/Reveal";

const steps = [
  {
    step: "1",
    title: "Enquire",
    description:
      "Reach out through our contact form or office to discuss membership, plots, or investment opportunities.",
  },
  {
    step: "2",
    title: "Verification",
    description:
      "Our team verifies your identity documents and, if applicable, your sponsoring member's details.",
  },
  {
    step: "3",
    title: "Membership Enrolment",
    description:
      "Once approved, your member record is created with a unique member code, rank, and secure login credentials.",
  },
  {
    step: "4",
    title: "Plot Selection & Booking",
    description:
      "Choose from available plots, complete the booking process, and receive documented sale records.",
  },
  {
    step: "5",
    title: "Ongoing Access",
    description:
      "Log in anytime to view your member profile, booking history, and sales associated with your account.",
  },
];

export default function HowItWorks() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="How It Works"
            title="From Enquiry to Ownership"
            subtitle="A straightforward, documented path for every new member and plot buyer."
          />
        </Reveal>
        <div className="space-y-6">
          {steps.map((s) => (
            <Reveal key={s.step}>
              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-gold">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{s.title}</h3>
                  <p className="text-sm text-charcoal/70">{s.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
