import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";

export default function Terms() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Legal" title="Terms of Service" />
        <div className="space-y-4 text-sm text-charcoal/70">
          <p>
            By registering as a member or using this website, you agree to
            provide accurate information and to use your account solely for
            its intended purpose of viewing your membership, booking, and
            sales records.
          </p>
          <p>
            Membership, plot booking, and sale records displayed on this
            platform are maintained by Sky Vision Infra & Developers'
            administrative team. Members may not alter these records
            directly.
          </p>
          <p>
            Any commission, rank, or sponsorship benefit is subject to the
            terms of our compensation plan, which may be updated from time to
            time. Continued use of your account after an update constitutes
            acceptance of the revised terms.
          </p>
          <p>
            Sky Vision Infra & Developers reserves the right to suspend or
            terminate accounts found to be in violation of these terms or
            engaged in fraudulent activity.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
