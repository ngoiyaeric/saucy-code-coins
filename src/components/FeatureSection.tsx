
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Github, CreditCard, User, Archive, BarChart2 } from "lucide-react";

const features = [
  {
    title: "GitHub Integration",
    description:
      "Seamlessly connect your repositories and set up automatic payouts for merged pull requests.",
    icon: Github,
  },
  {
    title: "Instant Crypto Payouts",
    description:
      "Pay contributors in cryptocurrency instantly through Coinbase when their work is merged.",
    icon: CreditCard,
  },
  {
    title: "Simple Onboarding",
    description:
      "Contributors need only click a claim link and provide their Coinbase email. No complex setup.",
    icon: User,
  },
  {
    title: "Issue Bounties",
    description:
      "Set bounty amounts on specific issues to incentivize contributions where they matter most.",
    icon: Archive,
  },
  {
    title: "Transparent History",
    description:
      "Full transparency with a complete history of all bounties and payouts for your repositories.",
    icon: BarChart2,
  },
  {
    title: "Automatic Verification",
    description:
      "Payouts are only sent once pull requests are verified and merged by repository owners.",
    icon: CheckCircle,
  },
];

const FeatureSection = () => {
  return (
    <section className="container-wide py-24">
      <div className="text-center mb-16">
        <h2 className="heading-2">
          Built for open-source maintainers and contributors
        </h2>
        <p className="mt-4 text-lg text-foreground/80 max-w-2xl mx-auto">
          Our platform makes it easy to fund open-source development and reward
          contributors automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <Card key={feature.title} className="border bg-card overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;
