import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { reservationsApi, subscriptionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Dumbbell, CreditCard, User, LogOut, Clock, TrendingUp, X, Download } from "lucide-react";
import { EditProfileDialog } from "@/components/member/EditProfileDialog";
import { PaymentsDialog } from "@/components/member/PaymentsDialog";
import { BookClassDialog } from "@/components/member/BookClassDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { exportApi } from "@/lib/api";
import { exportMultipleDatasets, generateFilename } from "@/lib/exportUtils";

interface Reservation {
  id: string;
  status: string | null;
  course_sessions: {
    session_date: string;
    start_time: string;
    end_time: string;
    courses: {
      name: string;
    };
  };
}

interface Subscription {
  id: string;
  end_date: string;
  status: string;
  subscription_types: {
    name: string;
  };
}

export default function MemberDashboard() {
  const { profile, user, signOut } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [bookClassOpen, setBookClassOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [attendedCount, setAttendedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch upcoming reservations
      const reservationsData = await reservationsApi.getMy();

      // Filter upcoming confirmed reservations
      const today = new Date().toISOString().split('T')[0];
      const upcomingReservations = reservationsData
        .filter((r: any) =>
          r.status === 'confirmed' &&
          r.course_sessions?.session_date >= today
        )
        .slice(0, 5);

      setReservations(upcomingReservations);
      setAttendedCount(reservationsData.filter((r: any) => r.status === 'confirmed').length);

      // Fetch current subscription
      try {
        const subData = await subscriptionsApi.getMyActive();
        if (subData) {
          setSubscription(subData);
        }
      } catch {
        // No active subscription
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      await reservationsApi.cancel(reservationId);
      toast.success("Réservation annulée");
      fetchData();
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  const getDaysRemaining = () => {
    if (!subscription) return 0;
    const endDate = new Date(subscription.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportMyData = async () => {
    setIsExporting(true);
    try {
      toast.info("Préparation de l'export...");

      const datasets = [];

      try {
        console.log("Fetching my reservations...");
        const reservations = await exportApi.getMyReservations();
        console.log("Reservations fetched:", reservations?.length);
        if (reservations && reservations.length > 0) {
          datasets.push({
            data: reservations,
            filename: generateFilename('mes_reservations'),
          });
        }
      } catch (error: any) {
        console.error("Error fetching my reservations:", error);
        toast.error("Erreur lors de l'export des réservations: " + error.message);
      }

      try {
        console.log("Fetching my payments...");
        const payments = await exportApi.getMyPayments();
        console.log("Payments fetched:", payments?.length);
        if (payments && payments.length > 0) {
          datasets.push({
            data: payments,
            filename: generateFilename('mes_paiements'),
          });
        }
      } catch (error: any) {
        console.error("Error fetching my payments:", error);
        toast.error("Erreur lors de l'export des paiements: " + error.message);
      }

      if (datasets.length > 0) {
        await exportMultipleDatasets(datasets);
        toast.success(`Export terminé ! ${datasets.length} fichier(s) téléchargé(s).`);
      } else {
        toast.info("Aucune donnée à exporter pour le moment.");
      }
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const nextReservation = reservations[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">POWER GYM</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Bienvenue, {profile?.first_name || "Membre"}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tableau de bord</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Prochain cours</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {nextReservation ? (
                <>
                  <p className="text-2xl font-bold">
                    {format(new Date(nextReservation.course_sessions.session_date), "dd MMM", { locale: fr })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nextReservation.course_sessions.courses.name} à {nextReservation.course_sessions.start_time.slice(0, 5)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">Aucun cours prévu</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Réservations</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{reservations.length}</p>
              <p className="text-xs text-muted-foreground">cours à venir</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Abonnement</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {subscription ? (
                <>
                  <p className="text-2xl font-bold">{subscription.subscription_types?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Expire dans {getDaysRemaining()} jours
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold">Aucun</p>
                  <p className="text-xs text-muted-foreground">Pas d'abonnement actif</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Progression</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{attendedCount}</p>
              <p className="text-xs text-muted-foreground">cours réservés</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setBookClassOpen(true)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Réserver un cours
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setEditProfileOpen(true)}
              >
                <User className="h-4 w-4 mr-2" />
                Modifier mon profil
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setPaymentsOpen(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Voir mes paiements
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleExportMyData}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Export..." : "Exporter mes données"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Cours à venir</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : reservations.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  Aucune réservation à venir
                </p>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <p className="font-medium">{reservation.course_sessions.courses.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(reservation.course_sessions.session_date), "EEEE dd MMMM", { locale: fr })},{" "}
                          {reservation.course_sessions.start_time.slice(0, 5)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelReservation(reservation.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Dialogs */}
      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      <PaymentsDialog open={paymentsOpen} onOpenChange={setPaymentsOpen} />
      <BookClassDialog
        open={bookClassOpen}
        onOpenChange={setBookClassOpen}
        onBooked={fetchData}
      />
    </div>
  );
}
