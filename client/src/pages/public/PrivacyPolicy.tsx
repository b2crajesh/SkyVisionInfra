import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";

export default function PrivacyPolicy() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Legal" title="Privacy Policy" />
        <div className="space-y-4 text-sm text-charcoal/70">
          <p>
            Sky Vision Infra & Developers collects personal information such
            as name, address, date of birth, government identity numbers
            (Aadhaar and PAN), and contact details solely for the purpose of
            member verification, plot booking, and account management.
          </p>
          <p>
            Sensitive identity numbers are stored securely and displayed in
            masked form throughout our systems. Access to full member data is
            restricted to authorised administrative personnel.
          </p>
          <p>
            We do not sell or share member data with third parties for
            marketing purposes. Data may be shared with regulatory or
            government bodies where required by law.
          </p>
          <p>
            Members may request a copy of their stored data or request
            corrections by contacting our support team.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
