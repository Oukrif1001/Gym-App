import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dumbbell, LogOut, BookOpen, Calendar, ClipboardCheck, Download } from "lucide-react";
import CoachStats from "@/components/coach/CoachStats";
import CoachCourses from "@/components/coach/CoachCourses";
import CoachSessions from "@/components/coach/CoachSessions";
import CoachAttendance from "@/components/coach/CoachAttendance";
import { exportApi } from "@/lib/api";
import { exportData, generateFilename } from "@/lib/exportUtils";
import { toast } from "sonner";
import { useState } from "react";

export default function CoachDashboard() {
  const { profile, signOut } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      toast.info("Préparation de l'export...");
      const sessions = await exportApi.getMySessions();
      exportData(sessions, generateFilename('mes_sessions'));
      toast.success("Export terminé !");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">POWER GYM</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Coach {profile?.first_name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Export..." : "Exporter mes données"}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tableau de bord Coach</h1>

        <div className="mb-8">
          <CoachStats />
        </div>

        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Mes cours
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Présences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <CoachSessions />
          </TabsContent>

          <TabsContent value="courses">
            <CoachCourses />
          </TabsContent>

          <TabsContent value="attendance">
            <CoachAttendance />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
