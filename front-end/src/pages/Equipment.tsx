import { Layout } from "@/components/layout/Layout";
import gymCardio from "@/assets/gym-cardio.jpg";
import gymExterior from "@/assets/gym-exterior.jpg";
import gymHero from "@/assets/gym-hero.jpg";
import gymWeights from "@/assets/gym-weights.jpg";
import machinePec from "@/assets/machine-pec.jpg";
import machineDorso from "@/assets/machine-dorso.jpg";
import machineLegs from "@/assets/machine-legs.jpg";
import machineEpaules from "@/assets/machine-epaules.jpg";
import machineCable from "@/assets/machine-cable.jpg";
import machineRowing from "@/assets/machine-rowing.jpg";
import bascket from "@/assets/07-courts.jpg";
import locker from "@/assets/08-private-locker-rooms.jpg";
import EpArr from "@/assets/epaule-arr.jpg";
import devC from "@/assets/developpe-couche.jpg";
import bar from "@/assets/souleve-de-terre-315x210-c-default.jpg";
import JAavant from "@/assets/ebec1.jpg";
import JAarr from "@/assets/les-jambes-arriere.jpg";
import velo from "@/assets/vélo biking.jpg";
import machine from "@/assets/les-machine-cardio.jpg";
import pec from "@/assets/machine-guidee-pec-fly-rear-delt.jpg";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

const equipmentData = [
  {
    id: 1,
    image: machinePec,
    title: "Machine Pectoraux",
    description: "Pec deck professionnel pour un travail ciblé des pectoraux. Mouvement guidé et sécurisé.",
    category: "Pectoraux",
  },
  {
    id: 2,
    image: machineDorso,
    title: "Tirage Dorsal",
    description: "Lat pulldown pour développer la largeur du dos. Prise large et serrée disponibles.",
    category: "Dos",
  },
  {
    id: 3,
    image: machineLegs,
    title: "Presse à Cuisses",
    description: "Leg press à 45° pour un travail complet des quadriceps, ischio-jambiers et fessiers.",
    category: "Jambes",
  },
  {
    id: 4,
    image: machineEpaules,
    title: "Développé Épaules",
    description: "Machine à épaules avec mouvement convergent pour un développement optimal des deltoïdes.",
    category: "Épaules",
  },
  {
    id: 5,
    image: machineCable,
    title: "Poulie Vis-à-Vis",
    description: "Station câbles polyvalente pour chest fly, triceps, biceps et exercices fonctionnels.",
    category: "Épaules",
  },
  {
    id: 6,
    image: machineRowing,
    title: "Rowing Assis",
    description: "Rameur câble pour un travail en épaisseur du dos. Cible les rhomboïdes et trapèzes.",
    category: "Dos",
  },
  {
    id: 7,
    image: gymCardio,
    title: "Zone Cardio",
    description: "Tapis de course, vélos elliptiques, rameurs et vélos stationnaires de dernière génération.",
    category: "Cardio",
  },
  {
    id: 8,
    image: gymWeights,
    title: "Espace Poids Libres",
    description: "Haltères de 2 à 60kg, barres olympiques et racks de squat professionnels.",
    category: "Musculation",
  },
  {
    id: 9,
    image: gymHero,
    title: "Salle Principale",
    description: "Un espace moderne de 1500m² avec équipements haut de gamme.",
    category: "Général",
  },
  {
    id: 10,
    image: gymExterior,
    title: "Notre Bâtiment",
    description: "Un cadre moderne avec parking gratuit et accès facile.",
    category: "Général",
  },
  {

    id: 11,
    image: bascket,
    title: "Terrain de Basket",
    description: "Terrain de basket intérieur pour des entraînements et matchs amicaux.",
    category: "Général",
  }
  ,{
    id: 12,
    image: locker,
    title: "Vestiaires Modernes",
    description: "Vestiaires spacieux avec douches individuelles et casiers sécurisés.",
    category: "Général",
  }
  ,{
    id: 13,
    image: EpArr,
    title: "Épaulé Jeté",
    description: "Barre olympique et plateforme dédiée pour l'entraînement de l'épaulé jeté.",
    category: "Épaules",
  }
  ,{
    id: 14,
    image: devC,
    title: "Développé Couché",
    description: "Bancs de développé couché réglables avec barres et poids olympiques.",
    category: "Pectoraux",
  }
  ,{
    id: 15,
    image: bar,
    title: "Soulevé de Terre",
    description: "Barres olympiques et plateformes pour le soulevé de terre et autres exercices de force.",
    category: "Dos",
  }
  ,{
    id: 16,
    image: JAavant,
    title: "Jambes Avant",
    description: "Machine spécialisée pour cibler les quadriceps et renforcer les jambes avant.",
    category: "Jambes",
  }
  ,{
    id: 17, 
    image: JAarr,
    title: "Jambes Arrière",
    description: "Machine spécialisée pour cibler les ischio-jambiers et renforcer les jambes arrière.",
    category: "Jambes",
  }   
  ,{
    id: 18,
    image: velo,
    title: "Vélo Biking",
    description: "Vélos de biking haut de gamme pour des séances de cardio intenses.",
    category: "Cardio",
  }
  ,{
    id: 19,
    image: machine,
    title: "Machines Cardio",
    description: "Large sélection de machines cardio incluant tapis de course, elliptiques et rameurs.",
    category: "Cardio",
  } 

  ,{
    id: 20,
    image: pec,
    title: "Pec Fly & Rear Delt",
    description: "Machine guidée pour travailler les pectoraux et les deltoïdes postérieurs.",
    category: "Pectoraux",
  }     
];

const Equipment = () => {
  const [selectedImage, setSelectedImage] = useState<typeof equipmentData[0] | null>(null);
  const [filter, setFilter] = useState("Tous");

  const categories = ["Tous", ...new Set(equipmentData.map((item) => item.category))];

  const filteredEquipment = filter === "Tous" 
    ? equipmentData 
    : equipmentData.filter((item) => item.category === filter);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-gym opacity-20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-medium mb-6 animate-fade-in-up">
              Nos Équipements
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 animate-fade-in-up stagger-1">
              Des Machines <span className="text-gradient">Haut de Gamme</span>
            </h1>
            <p className="text-lg text-muted-foreground animate-fade-in-up stagger-2">
              Découvrez notre collection d'équipements de fitness professionnels pour atteindre vos objectifs.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Buttons */}
      <section className="py-8 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                  filter === category
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredEquipment.map((item, index) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl glass-card cursor-pointer animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedImage(item)}
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    {item.category}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {item.description}
                  </p>
                </div>

                {/* Zoom Icon */}
                <div className="absolute top-4 right-4 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                  <ZoomIn className="w-5 h-5 text-foreground" />
                </div>

                {/* Border Glow Effect */}
                <div className="absolute inset-0 rounded-2xl border border-primary/0 group-hover:border-primary/50 transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 w-12 h-12 bg-card rounded-full flex items-center justify-center hover:bg-card/80 transition-colors z-10"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
          
          <div
            className="max-w-5xl w-full glass-card rounded-3xl overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video">
              <img
                src={selectedImage.image}
                alt={selectedImage.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8">
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-medium rounded-full mb-3">
                {selectedImage.category}
              </span>
              <h2 className="text-3xl font-display font-bold text-foreground mb-3">
                {selectedImage.title}
              </h2>
              <p className="text-muted-foreground">
                {selectedImage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-gym opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="glass-card rounded-3xl p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Prêt à <span className="text-gradient">Commencer</span> ?
            </h2>
            <p className="text-muted-foreground mb-8">
              Venez découvrir nos équipements et commencez votre transformation dès aujourd'hui.
            </p>
            <a
              href="/pricing"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-glow hover-lift"
            >
              Voir Nos Tarifs
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Equipment;
