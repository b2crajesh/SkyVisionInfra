import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";

export default function Disclaimer() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Legal" title="Disclaimer" />
        <div className="space-y-4 text-sm text-charcoal/70">
          <p>
            Property listings shown on this website, including those on our
            Properties page, are illustrative examples of the type of
            projects Sky Vision Infra & Developers undertakes. They do not
            represent current, live inventory, guaranteed availability, or an
            offer for sale.
          </p>
          <p>
            Any commission or income potential referenced on this website or
            in our membership materials is not guaranteed. Eligibility for
            commissions is subject to qualifying activity, verification, and
            the terms of our compensation plan, which may change over time.
          </p>
          <p>
            Prospective members and buyers are encouraged to conduct their
            own due diligence and seek independent legal or financial advice
            before making any commitment.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
