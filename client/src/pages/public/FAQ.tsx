import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";
import Accordion from "../../components/Accordion";
import Reveal from "../../components/Reveal";

const faqs = [
  {
    question: "How do I become an associate of Sky Vision Infra?",
    answer:
      "Associate accounts are created by our admin team after identity verification. Contact us through the Contact page or your sponsoring associate to begin the enrolment process.",
  },
  {
    question: "What is a sponsor, and do I need one?",
    answer:
      "A sponsor is an existing associate who introduces you to Sky Vision Infra. A sponsor is optional for new associates, but when one is recorded it is displayed on your associate profile.",
  },
  {
    question: "How are plots sold and recorded?",
    answer:
      "Every plot sale is recorded against your associate account with a plot reference, area, amount, and sale date, all viewable from your associate dashboard.",
  },
  {
    question: "Are the properties shown on the website currently available?",
    answer:
      "The properties listed on our Properties page are illustrative examples of our development work and do not represent live, current inventory. Please contact our sales team for up-to-date availability.",
  },
  {
    question: "How are commissions calculated?",
    answer:
      "Commissions are calculated based on documented, qualifying sales and sponsorship activity in accordance with our compensation-plan terms. They are not guaranteed income - see our Commission Plan page for full details.",
  },
  {
    question: "How do membership ranks work?",
    answer:
      "Ranks - Junior Executive, Executive, Senior Executive, Manager, Senior Manager, and Ambassador - reflect an associate's sustained engagement and qualifying activity over time, as reviewed by our administrative team. Ambassador is the highest associate rank.",
  },
  {
    question: "How is my personal information protected?",
    answer:
      "Sensitive identifiers such as Aadhaar and PAN numbers are masked in day-to-day account views and access to associate data is restricted to authenticated, authorised staff.",
  },
  {
    question: "How do I access my account?",
    answer:
      "Once your associate account is created, you will receive an associate ID and a temporary password from our admin team. Use these to log in and update your password from your dashboard.",
  },
  {
    question: "Can I update my payment or booking details myself?",
    answer:
      "Booking and sale records are entered and maintained by our admin team to ensure accuracy. Associates can view but not directly edit these records; contact our office for any correction requests.",
  },
  {
    question: "Who do I contact for support?",
    answer:
      "You can reach our support team through the Contact page, by phone, or by email during our published business hours.",
  },
];

export default function FAQ() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            subtitle="Answers to common questions about membership, sponsorship, plots, payments, commissions, and account access."
          />
        </Reveal>
        <Reveal>
          <Accordion items={faqs} />
        </Reveal>
      </section>
    </PublicLayout>
  );
}
