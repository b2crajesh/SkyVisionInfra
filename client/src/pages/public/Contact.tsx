import { useState, type FormEvent } from "react";
import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";
import Card from "../../components/ui/Card";
import FormField from "../../components/FormField";
import Button from "../../components/ui/Button";
import Reveal from "../../components/Reveal";
import { api } from "../../lib/api";
import { useToast } from "../../components/ToastProvider";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const initialForm: ContactForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): boolean => {
    const errs: Partial<ContactForm> = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Enter a valid email.";
    if (!form.phone.trim()) errs.phone = "Phone number is required.";
    if (!form.subject.trim()) errs.subject = "Subject is required.";
    if (!form.message.trim()) errs.message = "Message is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await api.post("/contact", form);
      toast("Thank you - your message has been sent.", "success");
      setForm(initialForm);
      setErrors({});
    } catch (err) {
      toast("Something went wrong sending your message. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Contact"
            title="Get in Touch"
            subtitle="Our team is available to answer questions about membership, plots, and sponsorship."
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Reveal>
            <Card>
              <form onSubmit={handleSubmit} noValidate>
                <FormField
                  label="Full Name"
                  value={form.name}
                  error={errors.name}
                  onChange={(e) => update("name", e.target.value)}
                />
                <FormField
                  label="Email"
                  type="email"
                  value={form.email}
                  error={errors.email}
                  onChange={(e) => update("email", e.target.value)}
                />
                <FormField
                  label="Phone"
                  value={form.phone}
                  error={errors.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
                <FormField
                  label="Subject"
                  value={form.subject}
                  error={errors.subject}
                  onChange={(e) => update("subject", e.target.value)}
                />
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-charcoal">
                    Message
                  </label>
                  <textarea
                    className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy ${
                      errors.message ? "border-red-500" : "border-gray-300"
                    }`}
                    rows={5}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-red-600">{errors.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Card>
          </Reveal>

          <Reveal>
            <Card>
              <h3 className="mb-3 text-lg font-semibold text-navy">Office</h3>
              <p className="mb-1 text-sm text-charcoal/70">
                Sky Vision Towers, Sector 62, Noida, Uttar Pradesh, India
              </p>
              <p className="mb-1 text-sm text-charcoal/70">+91 98765 43210</p>
              <p className="mb-1 text-sm text-charcoal/70">
                [REDACTED_EMAIL_ADDRESS]
              </p>
              <p className="text-sm text-charcoal/70">
                Monday - Saturday, 10:00 AM - 7:00 PM
              </p>
            </Card>
          </Reveal>
        </div>
      </section>
    </PublicLayout>
  );
}
