import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dumbbell,
  Zap,
  Heart,
  Target,
  Users,
  Timer,
  Flame,
  Activity,
  ArrowRight,
} from "lucide-react";

const services = [
  {
    icon: Dumbbell,
    title: "Strength Training",
    description: "Build muscle mass, increase strength, and improve overall body composition with our comprehensive strength training programs.",
    features: ["Free weights & machines", "Progressive overload programs", "Personalized workout plans"],
  },
  {
    icon: Zap,
    title: "Cardio Training",
    description: "Boost your cardiovascular health and endurance with our state-of-the-art cardio equipment and classes.",
    features: ["Treadmills & ellipticals", "Cycling studios", "Rowing machines"],
  },
  {
    icon: Heart,
    title: "Yoga & Pilates",
    description: "Find balance, improve flexibility, and strengthen your core with our yoga and pilates sessions.",
    features: ["Hatha & Vinyasa yoga", "Mat pilates classes", "Meditation sessions"],
  },
  {
    icon: Target,
    title: "HIIT Workouts",
    description: "Maximum results in minimum time. Our high-intensity interval training will push you to your limits.",
    features: ["30-minute sessions", "Full-body workouts", "Calorie-burning circuits"],
  },
  {
    icon: Users,
    title: "Personal Training",
    description: "Get one-on-one attention from our certified trainers who will create a customized program just for you.",
    features: ["Goal assessment", "Nutrition guidance", "Progress tracking"],
  },
  {
    icon: Timer,
    title: "Group Fitness Classes",
    description: "Join our energetic group classes and enjoy the motivation of working out with others.",
    features: ["Spinning classes", "Aerobics", "Dance fitness"],
  },
  {
    icon: Flame,
    title: "CrossFit",
    description: "Challenge yourself with varied functional movements performed at high intensity.",
    features: ["Olympic weightlifting", "Gymnastic movements", "Metabolic conditioning"],
  },
  {
    icon: Activity,
    title: "Sports Performance",
    description: "Enhance your athletic performance with sport-specific training programs.",
    features: ["Speed & agility", "Power training", "Recovery protocols"],
  },
];

const equipment = [
  "Free Weights & Dumbbells",
  "Cable Machines",
  "Smith Machines",
  "Leg Press Machines",
  "Treadmills",
  "Elliptical Trainers",
  "Stationary Bikes",
  "Rowing Machines",
  "Battle Ropes",
  "Kettlebells",
  "Resistance Bands",
  "Foam Rollers",
];

export default function Services() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">
            Our <span className="text-gradient">Services</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover a wide range of fitness services designed to help you achieve your goals,
            whether you're a beginner or an experienced athlete.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <Card key={service.title} className="bg-card border-border hover-lift group">
                <CardHeader>
                  <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg tracking-wider">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment Section */}
      <section className="py-24 bg-card border-y border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl tracking-wider">Premium Equipment</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Our gym is equipped with the latest and most advanced fitness equipment
              to ensure you have everything you need for an effective workout.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {equipment.map((item) => (
              <div
                key={item}
                className="bg-muted rounded-lg p-4 text-center text-sm hover:bg-primary/10 transition-colors"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl tracking-wider">Class Schedule</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              We offer classes throughout the day to fit your busy schedule.
              Sign up to view the full class schedule and book your spot.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary tracking-wider">Morning Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>6:00 AM - Early Bird Cardio</p>
                <p>7:00 AM - Yoga Flow</p>
                <p>8:00 AM - HIIT Express</p>
                <p>9:00 AM - Strength Basics</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary tracking-wider">Afternoon Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>12:00 PM - Lunch Break Burn</p>
                <p>1:00 PM - Pilates Core</p>
                <p>2:00 PM - CrossFit Open</p>
                <p>3:00 PM - Spin Class</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-primary tracking-wider">Evening Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>5:00 PM - Power Hour</p>
                <p>6:00 PM - Group Strength</p>
                <p>7:00 PM - Dance Fitness</p>
                <p>8:00 PM - Relaxation Yoga</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-card border-t border-border">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Join POWER GYM today and gain access to all our services, classes, and equipment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90" asChild>
              <Link to="/auth?mode=signup">
                Join Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
