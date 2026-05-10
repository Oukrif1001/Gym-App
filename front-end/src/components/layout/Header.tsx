import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Dumbbell, Flame } from "lucide-react";

const navigation = [
  { name: "Accueil", href: "/" },
  { name: "Équipements", href: "/equipements" },
  { name: "Services", href: "/services" },
  { name: "Tarifs", href: "/pricing" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
      ? 'bg-background/90 backdrop-blur-xl border-b-2 border-border/50 shadow-elevated'
      : 'bg-transparent'
      }`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
        {/* Left Section: Logo & Name */}
        <div className="flex lg:flex-1">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-primary rounded-lg p-1.5 h-10 w-10 flex items-center justify-center transition-transform group-hover:scale-105">
              <img
                src="/logo.png"
                alt="POWER GYM Logo"
                className="h-full w-full object-contain brightness-0 invert"
              />
            </div>
            <span className="text-xl font-display font-bold tracking-wider">POWER GYM</span>
          </Link>
        </div>

        {/* Mobile Menu Button (Right on Mobile) */}
        <div className="flex lg:hidden">
          <button
            title="ouvrir le menu"
            type="button"
            className="inline-flex items-center justify-center rounded-xl p-2.5 text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Center Section: Navigation */}
        <div className="hidden lg:flex lg:gap-x-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`relative px-4 py-2 text-sm font-medium transition-all rounded-lg hover:bg-muted/50 ${location.pathname === item.href
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {item.name}
              {location.pathname === item.href && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </div>

        {/* Right Section: Actions */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3">
          <Button variant="ghost" className="rounded-xl" asChild>
            <Link to="/auth">Connexion</Link>
          </Button>
          <Button asChild className="bg-gradient-primary hover:opacity-90 shadow-glow-sm rounded-xl group">
            <Link to="/auth?mode=signup">
              <Flame className="mr-2 h-4 w-4 group-hover:animate-pulse" />
              Rejoindre
            </Link>
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xl"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-card px-6 py-6 sm:max-w-sm border-l border-border/50 animate-slide-in-right">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                <div className="bg-gradient-primary rounded-lg p-1.5 h-10 w-10 flex items-center justify-center">
                  <img src="/logo.png" alt="POWER GYM Logo" className="h-full w-full object-contain brightness-0 invert" />
                </div>
                <span className="text-xl font-display font-bold tracking-wider">POWER GYM</span>
              </Link>
              <button
                type="button"
                className="rounded-xl p-2.5 text-foreground hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
                title="Fermer le menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mt-8 flow-root">
              <div className="space-y-1 py-6">
                {navigation.map((item, index) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block rounded-xl px-4 py-3 text-base font-medium transition-all hover:bg-muted ${location.pathname === item.href
                      ? "text-primary bg-primary/10"
                      : "text-foreground"
                      }`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="space-y-3 py-6 border-t border-border/50">
                <Button variant="outline" className="w-full justify-center rounded-xl py-6" asChild>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button className="w-full bg-gradient-primary hover:opacity-90 shadow-glow rounded-xl py-6" asChild>
                  <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                    <Flame className="mr-2 h-4 w-4" />
                    Rejoindre Maintenant
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
