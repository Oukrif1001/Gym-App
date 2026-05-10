import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { profilesApi, coursesApi, paymentsApi, subscriptionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Dumbbell,
  DollarSign,
  LogOut,
  Calendar,
  TrendingUp,
  UserCog,
  BookOpen,
  CreditCard,
  Mail,
  Download
} from "lucide-react";
import { MembersManagement } from "@/components/admin/MembersManagement";
import { CoachesManagement } from "@/components/admin/CoachesManagement";
import { CoursesManagement } from "@/components/admin/CoursesManagement";
import { SubscriptionsManagement } from "@/components/admin/SubscriptionsManagement";
import { ContactMessagesManagement } from "@/components/admin/ContactMessagesManagement";
import { exportApi } from "@/lib/api";
import { exportMultipleDatasets, generateFilename } from "@/lib/exportUtils";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Count members
      const members = await profilesApi.getAll();

      // Count active courses
      const courses = await coursesApi.getAll();

      // Get payment stats
      const paymentStats = await paymentsApi.getStats();

      // Count active subscriptions
      const subscriptions = await subscriptionsApi.getAll({ status: 'active' });

      setStats({
        totalMembers: members?.length || 0,
        totalCourses: courses?.filter((c: any) => c.is_active)?.length || 0,
        totalRevenue: paymentStats?.totalRevenue || 0,
        activeSubscriptions: subscriptions?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportAllData = async () => {
    setIsExporting(true);
    try {
      toast.info("Préparation de l'export des données...");

      // Export individuellement pour mieux gérer les erreurs
      const datasets = [];

      try {
        console.log("Fetching members...");
        const members = await exportApi.getMembers();
        console.log("Members fetched:", members?.length);
        datasets.push({ data: members, filename: generateFilename('membres') });
      } catch (error: any) {
        console.error("Error fetching members:", error);
        toast.error("Erreur lors de l'export des membres: " + error.message);
      }

      try {
        console.log("Fetching courses...");
        const courses = await exportApi.getCourses();
        console.log("Courses fetched:", courses?.length);
        datasets.push({ data: courses, filename: generateFilename('cours') });
      } catch (error: any) {
        console.error("Error fetching courses:", error);
        toast.error("Erreur lors de l'export des cours: " + error.message);
      }

      try {
        console.log("Fetching subscriptions...");
        const subscriptions = await exportApi.getSubscriptions();
        console.log("Subscriptions fetched:", subscriptions?.length);
        datasets.push({ data: subscriptions, filename: generateFilename('abonnements') });
      } catch (error: any) {
        console.error("Error fetching subscriptions:", error);
        toast.error("Erreur lors de l'export des abonnements: " + error.message);
      }

      try {
        console.log("Fetching reservations...");
        const reservations = await exportApi.getReservations();
        console.log("Reservations fetched:", reservations?.length);
        datasets.push({ data: reservations, filename: generateFilename('reservations') });
      } catch (error: any) {
        console.error("Error fetching reservations:", error);
        toast.error("Erreur lors de l'export des réservations: " + error.message);
      }

      try {
        console.log("Fetching payments...");
        const payments = await exportApi.getPayments();
        console.log("Payments fetched:", payments?.length);
        datasets.push({ data: payments, filename: generateFilename('paiements') });
      } catch (error: any) {
        console.error("Error fetching payments:", error);
        toast.error("Erreur lors de l'export des paiements: " + error.message);
      }

      if (datasets.length > 0) {
        await exportMultipleDatasets(datasets);
        toast.success(`Export terminé ! ${datasets.length} fichier(s) téléchargé(s).`);
      } else {
        toast.warning("Aucune donnée n'a pu être exportée.");
      }
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Erreur générale lors de l'export: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">POWER GYM</span>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.first_name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAllData}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Export..." : "Exporter les données"}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tableau de bord Admin</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cours actifs</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenus</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}€</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Abonnements actifs</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Membres</span>
            </TabsTrigger>
            <TabsTrigger value="coaches" className="gap-2">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Coachs</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Cours</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Abonnements</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <MembersManagement />
          </TabsContent>

          <TabsContent value="coaches">
            <CoachesManagement />
          </TabsContent>

          <TabsContent value="courses">
            <CoursesManagement />
          </TabsContent>

          <TabsContent value="subscriptions">
            <SubscriptionsManagement />
          </TabsContent>

          <TabsContent value="messages">
            <ContactMessagesManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
