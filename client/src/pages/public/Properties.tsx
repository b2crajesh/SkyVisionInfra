import PublicLayout from "../../components/PublicLayout";
import SectionHeading from "../../components/ui/SectionHeading";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Reveal from "../../components/Reveal";

const properties = [
  {
    name: "Sky Meadows Phase 1",
    location: "Greater Noida Expressway, UP",
    size: "1,200 - 2,400 sq. ft. plots",
    status: "Sold Out",
  },
  {
    name: "Vision Valley Estate",
    location: "Sonipat, Haryana",
    size: "200 - 500 sq. yd. plots",
    status: "Illustrative Listing",
  },
  {
    name: "Horizon Green Layout",
    location: "Neemrana, Rajasthan",
    size: "0.25 - 1 acre parcels",
    status: "Illustrative Listing",
  },
  {
    name: "Sky Vision Business Park",
    location: "Bhiwadi, Rajasthan",
    size: "Commercial plots, 1,000+ sq. ft.",
    status: "Illustrative Listing",
  },
];

export default function Properties() {
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Properties"
            title="A Sample of Our Development Portfolio"
            subtitle="Representative examples of the type of land and plot projects we work on."
          />
        </Reveal>

        <Reveal>
          <div className="mb-8 rounded-md border border-gold/40 bg-gold/10 p-4 text-sm text-navy">
            <strong>Note:</strong> The listings below are illustrative
            examples intended to show the type and scale of projects we
            undertake. They do not represent current, live inventory or an
            offer for sale. Please contact our sales team for up-to-date
            availability.
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Reveal key={p.name}>
              <Card className="h-full">
                <div className="mb-3 flex h-36 items-center justify-center rounded-md bg-lightbg text-charcoal/30">
                  Image Placeholder
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-navy">{p.name}</h3>
                  <Badge tone={p.status === "Sold Out" ? "neutral" : "gold"}>
                    {p.status}
                  </Badge>
                </div>
                <p className="text-sm text-charcoal/70">{p.location}</p>
                <p className="text-sm text-charcoal/70">{p.size}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
