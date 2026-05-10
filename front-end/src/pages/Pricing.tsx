import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Basic",
    price: "29",
    period: "month",
    description: "Perfect for beginners starting their fitness journey",
    features: [
      "Access to gym floor",
      "Standard equipment usage",
      "Locker room access",
      "2 group classes/week",
      "Fitness assessment",
    ],
    popular: false,
  },
  {
    name: "Premium",
    price: "59",
    period: "month",
    description: "Our most popular plan for serious fitness enthusiasts",
    features: [
      "All Basic features",
      "Unlimited group classes",
      "Personal training session/month",
      "Nutrition consultation",
      "Priority class booking",
      "Sauna & spa access",
      "Guest passes (2/month)",
    ],
    popular: true,
  },
  {
    name: "Elite",
    price: "99",
    period: "month",
    description: "The ultimate fitness experience with exclusive perks",
    features: [
      "All Premium features",
      "4 personal training sessions/month",
      "Custom meal plans",
      "24/7 gym access",
      "Private locker",
      "Unlimited guest passes",
      "Exclusive member events",
      "Recovery zone access",
    ],
    popular: false,
  },
];

const faqs = [
  {
    question: "Can I cancel my membership anytime?",
    answer: "Yes, you can cancel your membership at any time. We offer a flexible month-to-month billing with no long-term contracts.",
  },
  {
    question: "Do you offer student discounts?",
    answer: "Yes! Students with a valid ID can get 20% off any membership plan. Contact our team for more details.",
  },
  {
    question: "What's included in the personal training sessions?",
    answer: "Personal training sessions include one-on-one coaching, customized workout plans, form correction, and progress tracking.",
  },
  {
    question: "Can I freeze my membership?",
    answer: "Yes, you can freeze your membership for up to 3 months per year for medical reasons or extended travel.",
  },
];

export default function Pricing() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Simple, Transparent <span className="text-gradient">Pricing</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your fitness goals. No hidden fees, no contracts.
            Start your journey today.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative bg-card border-border hover-lift ${
                  plan.popular ? "ring-2 ring-primary" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-6">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="pb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-primary hover:opacity-90"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/auth?mode=signup">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-card border-y border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">Compare Plans</h2>
            <p className="mt-4 text-muted-foreground">
              See what's included in each membership tier
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-6 text-left font-semibold">Feature</th>
                  <th className="py-4 px-6 text-center font-semibold">Basic</th>
                  <th className="py-4 px-6 text-center font-semibold text-primary">Premium</th>
                  <th className="py-4 px-6 text-center font-semibold">Elite</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-4 px-6">Gym Floor Access</td>
                  <td className="py-4 px-6 text-center">Standard hours</td>
                  <td className="py-4 px-6 text-center">Extended hours</td>
                  <td className="py-4 px-6 text-center">24/7</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6">Group Classes</td>
                  <td className="py-4 px-6 text-center">2/week</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6">Personal Training</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">1/month</td>
                  <td className="py-4 px-6 text-center">4/month</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6">Nutrition Support</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">Consultation</td>
                  <td className="py-4 px-6 text-center">Custom Plans</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6">Spa & Sauna</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-4 px-6">Guest Passes</td>
                  <td className="py-4 px-6 text-center">-</td>
                  <td className="py-4 px-6 text-center">2/month</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="bg-card rounded-lg p-6 border border-border">
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-card border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Still Have Questions?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Our team is here to help you choose the right plan for your fitness goals.
          </p>
          <div className="mt-8">
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
