import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sessionsApi, reservationsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck, Check, X, User } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Reservation {
  id: string;
  status: string;
  booked_at: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface Session {
  id: string;
  session_date: string;
  start_time: string;
  course: {
    name: string;
  };
}

export default function CoachAttendance() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTodaySessions();
    }
  }, [user]);

  useEffect(() => {
    if (selectedSession) {
      fetchReservations();
    }
  }, [selectedSession]);

  const fetchTodaySessions = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const allSessions = await sessionsApi.getMy();

      const todaySessions = allSessions
        .filter((s: any) => s.session_date === today && s.status === "scheduled")
        .map((s: any) => {
          // Normalize course data (backend returns 'courses' not 'course')
          const course = s.courses || s.course;
          return {
            ...s,
            course: course ? { name: course.name } : { name: "Cours inconnu" }
          };
        });

      setSessions(todaySessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const data = await reservationsApi.getBySession(selectedSession);

      const filteredReservations = data.filter(
        (r: any) => ["confirmed", "attended", "no_show"].includes(r.status)
      );

      setReservations(filteredReservations.map((r: any) => ({
        id: r.id,
        status: r.status,
        booked_at: r.booked_at,
        // Backend returns 'profiles' not 'profile'
        profile: r.profiles || r.profile || { first_name: null, last_name: null, email: "" }
      })));
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  const updateAttendance = async (reservationId: string, status: "attended" | "no_show") => {
    try {
      await reservationsApi.update(reservationId, { status });
      toast.success(status === "attended" ? "Présence confirmée" : "Absence notée");
      fetchReservations();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed": return <Badge variant="outline">En attente</Badge>;
      case "attended": return <Badge className="bg-green-500/20 text-green-400">Présent</Badge>;
      case "no_show": return <Badge className="bg-red-500/20 text-red-400">Absent</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Gestion des présences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune session aujourd'hui.
          </div>
        ) : (
          <>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.course.name} - {session.start_time.slice(0, 5)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSession && (
              reservations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune réservation pour cette session.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {reservation.profile.first_name || reservation.profile.last_name
                              ? `${reservation.profile.first_name || ""} ${reservation.profile.last_name || ""}`.trim()
                              : "Membre sans nom"}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {reservation.profile.email || "Pas d'email"}
                        </TableCell>
                        <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant={reservation.status === "attended" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => updateAttendance(reservation.id, "attended")}
                            className={reservation.status === "attended" ? "bg-green-500 hover:bg-green-600" : "hover:text-green-500"}
                            title="Marquer présent"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={reservation.status === "no_show" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => updateAttendance(reservation.id, "no_show")}
                            className={reservation.status === "no_show" ? "bg-red-500 hover:bg-red-600" : "hover:text-red-500"}
                            title="Marquer absent"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
