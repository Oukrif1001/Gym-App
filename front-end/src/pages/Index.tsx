import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dumbbell,
  Users,
  Calendar,
  Trophy,
  ArrowRight,
  Zap,
  Heart,
  Target,
  Play
} from "lucide-react";

import aquatic from "@/assets/aquatic-pool.jpg";
import gymExterior from "@/assets/gym-exterior.jpg";
import gymWeights from "@/assets/page-home.jpg";
import personal from "@/assets/personal.jpg";
import gymHero from "@/assets/gym-hero.jpg";

const features = [
  {
    icon: Dumbbell,
    title: "Équipement Premium",
    description: "Accédez aux derniers équipements et machines de fitness pour des résultats optimaux.",
  },
  {
    icon: Users,
    title: "Coachs Experts",
    description: "Travaillez avec des professionnels certifiés qui vous guideront vers vos objectifs.",
  },
  {
    icon: Calendar,
    title: "Horaires Flexibles",
    description: "Choisissez parmi une grande variété de cours adaptés à votre emploi du temps.",
  },
  {
    icon: Trophy,
    title: "Suivez Vos Progrès",
    description: "Surveillez vos réalisations et célébrez les étapes de votre parcours fitness.",
  },
];

const classes = [
  {
    name: "Musculation",
    description: "Développez vos muscles et votre puissance",
    icon: Dumbbell,
    color: "from-primary to-accent",
  },
  {
    name: "Cardio Intense",
    description: "Boostez votre endurance et brûlez des calories",
    icon: Zap,
    color: "from-accent to-primary",
  },
  {
    name: "Yoga & Bien-être",
    description: "Trouvez l'équilibre et la flexibilité",
    icon: Heart,
    color: "from-primary to-accent",
  },
  {
    name: "HIIT Training",
    description: "Résultats maximaux en temps minimum",
    icon: Target,
    color: "from-accent to-primary",
  },
];

const stats = [
  { value: "500+", label: "Membres Actifs" },
  { value: "20+", label: "Coachs Experts" },
  { value: "50+", label: "Cours par Semaine" },
  { value: "10+", label: "Années d'Expérience" },
];

const galleryImages = [
  { src: gymExterior, alt: "POWER GYM - Notre bâtiment moderne", title: "Notre Salle" },
  { src: gymWeights, alt: "Espace musculation", title: "Espace Musculation" },
  { src: personal, alt: "Personal Trainer", title: "Personal Trainer" },
  { src: aquatic, alt: "Équipement de fitness", title: "Équipement Premium" },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background with overlay */}
        <div className="absolute inset-0 bg-gradient-dark" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `url('${gymHero}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />

        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 text-center lg:px-8">
          <div className="animate-fade-in-up">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-8 backdrop-blur-sm">
              🔥 Offre de lancement : -50% le premier mois
            </span>
          </div>

          <h1 className="text-5xl font-display font-bold tracking-tight sm:text-7xl lg:text-8xl animate-fade-in-up stagger-1">
            TRANSFORMEZ
            <br />
            <span className="text-gradient">VOTRE VIE</span>
          </h1>

          <p className="mt-8 text-xl leading-8 text-muted-foreground max-w-2xl mx-auto animate-fade-in-up stagger-2 text-balance">
            Rejoignez POWER GYM et libérez votre plein potentiel. Installations de pointe,
            coachs experts et une communauté qui soutient votre parcours fitness.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-3">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow text-lg px-8 py-6 rounded-xl group" asChild>
              <Link to="/auth?mode=signup">
                Commencer Maintenant
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl border-2 hover:bg-card/50 backdrop-blur-sm group" asChild>
              <Link to="/services">
                <Play className="mr-2 h-5 w-5" />
                Découvrir
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-card/50 backdrop-blur-xl" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-card/50 border border-border/50 hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <p className="text-5xl font-display font-bold text-gradient">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-medium uppercase tracking-wider text-sm">Nos Installations</span>
            <h2 className="mt-4 text-4xl font-display font-bold sm:text-5xl">DÉCOUVREZ NOTRE SALLE</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
              Des installations modernes et un équipement de pointe pour atteindre vos objectifs.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {galleryImages.map((image, index) => (
              <div
                key={index}
                className="relative group overflow-hidden rounded-2xl aspect-square hover-lift cursor-pointer border border-border/50"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-xl font-display font-bold text-foreground">{image.title}</h3>
                </div>
                {/* Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-primary opacity-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-card/30" />
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-medium uppercase tracking-wider text-sm">Nos Avantages</span>
            <h2 className="mt-4 text-4xl font-display font-bold sm:text-5xl">POURQUOI POWER GYM ?</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
              Nous vous offrons tout ce dont vous avez besoin pour atteindre vos objectifs fitness.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="group bg-card/50 backdrop-blur-sm border-border/50 hover-lift hover-glow overflow-hidden"
              >
                <CardContent className="p-8 relative">
                  {/* Icon Background Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity" />

                  <div className="relative">
                    <div className="rounded-2xl bg-gradient-primary w-14 h-14 flex items-center justify-center mb-6 shadow-glow-sm group-hover:shadow-glow transition-shadow">
                      <feature.icon className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Classes Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-medium uppercase tracking-wider text-sm">Nos Cours</span>
            <h2 className="mt-4 text-4xl font-display font-bold sm:text-5xl">COURS POPULAIRES</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
              Des entraînements intenses au yoga relaxant, nous avons quelque chose pour tout le monde.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {classes.map((classItem, index) => (
              <div
                key={classItem.name}
                className="group relative overflow-hidden rounded-2xl bg-card p-8 hover-lift cursor-pointer border border-border/50"
              >
                {/* Background Gradient on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${classItem.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                <div className="relative">
                  <div className="rounded-xl bg-muted w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                    <classItem.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-bold">{classItem.name}</h3>
                  <p className="text-muted-foreground mt-2">{classItem.description}</p>

                  {/* Arrow on Hover */}
                  <div className="mt-6 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-sm font-medium">En savoir plus</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="rounded-xl border-2 px-8" asChild>
              <Link to="/services">
                Voir Tous Les Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-12 lg:p-20">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            {/* Glow Effects */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 text-center">
              <h2 className="text-4xl font-display font-bold text-primary-foreground sm:text-5xl lg:text-6xl">
                PRÊT À COMMENCER ?
              </h2>
              <p className="mt-6 text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                Rejoignez des milliers de membres qui ont transformé leur vie chez POWER GYM.
                Inscrivez-vous aujourd'hui et obtenez votre premier mois à -50% !
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-background text-foreground hover:bg-background/90 text-lg px-8 py-6 rounded-xl shadow-elevated" asChild>
                  <Link to="/auth?mode=signup">Rejoindre Maintenant</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-6 rounded-xl" asChild>
                  <Link to="/pricing">Voir les Tarifs</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
