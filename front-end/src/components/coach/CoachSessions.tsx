import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sessionsApi, coursesApi, reservationsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarIcon, Users, Clock, XCircle, CheckCircle, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Session {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  course: {
    id: string;
    name: string;
    max_participants: number;
  };
  reservation_count: number;
}

interface Course {
  id: string;
  name: string;
  duration_minutes: number;
  is_active?: boolean;
}

export default function CoachSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    course_id: "",
    session_date: new Date(),
    start_time: "09:00",
  });

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, selectedDate]);

  const fetchCourses = async () => {
    try {
      const data = await coursesApi.getMy();
      setCourses(data.filter((c: Course) => c.is_active !== false));
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const allSessions = await sessionsApi.getMy();

      const filteredSessions = allSessions.filter((s: any) => {
        const sDate = s?.session_date ? format(new Date(s.session_date), "yyyy-MM-dd") : null;
        return sDate === dateStr;
      });

      // Get reservation counts for each session and normalize data
      const sessionsWithCounts = await Promise.all(
        filteredSessions.map(async (session: any) => {
          let reservationCount = 0;
          try {
            const reservations = await reservationsApi.getBySession(session.id);
            reservationCount = reservations.filter((r: any) => r.status === "confirmed").length;
          } catch (e) {
            // Ignore errors
          }

          // Normalize the course data (backend returns 'courses' not 'course')
          const course = session.courses || session.course;

          return {
            ...session,
            course: course ? {
              id: course.id,
              name: course.name,
              max_participants: course.max_participants,
            } : { id: "", name: "Cours inconnu", max_participants: 0 },
            reservation_count: reservationCount,
          };
        })
      );

      setSessions(sessionsWithCounts);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!newSession.course_id || !newSession.start_time) {
      toast.error("Veuillez sélectionner un cours et une heure");
      return;
    }

    const selectedCourse = courses.find(c => c.id === newSession.course_id);
    if (!selectedCourse) return;

    // Calculate end time based on course duration
    const [hours, minutes] = newSession.start_time.split(":").map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + selectedCourse.duration_minutes;

    // Basic validation: we don't support sessions crossing midnight
    if (endMinutes >= 24 * 60) {
      toast.error("L'heure de fin dépasse minuit. Choisissez une heure de début plus tôt.");
      return;
    }

    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

    try {
      await sessionsApi.create({
        course_id: newSession.course_id,
        session_date: format(newSession.session_date, "yyyy-MM-dd"),
        start_time: newSession.start_time,
        end_time: endTime,
        status: "scheduled",
      });

      toast.success("Session créée avec succès");
      setDialogOpen(false);
      setNewSession({
        course_id: "",
        session_date: new Date(),
        start_time: "09:00",
      });

      // Refresh if viewing same date
      if (format(newSession.session_date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")) {
        fetchSessions();
      }
    } catch (error) {
      console.error("Error creating session:", error);
      const message = error instanceof Error ? error.message : "Erreur lors de la création de la session";
      toast.error(message);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      await sessionsApi.update(sessionId, { status });
      toast.success(`Session ${status === "cancelled" ? "annulée" : "terminée"}`);
      fetchSessions();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await sessionsApi.delete(sessionId);
      toast.success("Session supprimée avec succès");
      fetchSessions();
    } catch (error: any) {
      console.error("Error deleting session:", error);
      toast.error(error.message || "Erreur lors de la suppression de la session");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge className="bg-blue-500/20 text-blue-400">Planifiée</Badge>;
      case "cancelled": return <Badge className="bg-red-500/20 text-red-400">Annulée</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-400">Terminée</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Sessions du {format(selectedDate, "d MMMM yyyy", { locale: fr })}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={courses.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer une session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cours *</Label>
                  <Select
                    value={newSession.course_id}
                    onValueChange={(value) => setNewSession({ ...newSession, course_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un cours" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} ({course.duration_minutes} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(newSession.session_date, "d MMMM yyyy", { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newSession.session_date}
                        onSelect={(date) => date && setNewSession({ ...newSession, session_date: date })}
                        locale={fr}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Heure de début *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={newSession.start_time}
                    onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                  />
                </div>

                <Button className="w-full" onClick={handleCreateSession}>
                  Créer la session
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Changer la date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Créez d'abord un cours pour pouvoir ajouter des sessions.
          </div>
        ) : loading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune session pour cette date.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cours</TableHead>
                <TableHead>Horaire</TableHead>
                <TableHead>Inscriptions</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.course.name}</TableCell>
                  <TableCell>
                    {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {session.reservation_count}/{session.course.max_participants}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(session.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {session.status === "scheduled" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Terminer"
                          onClick={() => updateSessionStatus(session.id, "completed")}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Annuler"
                          onClick={() => updateSessionStatus(session.id, "cancelled")}
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer la session ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Toutes les réservations associées à cette session seront également supprimées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSession(session.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
