import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sessionsApi, reservationsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, Users } from "lucide-react";
import { toast } from "sonner";

interface CourseSession {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  courses: {
    id: string;
    name: string;
    category: string;
    duration_minutes: number;
    max_participants: number;
    difficulty_level: string | null;
  };
}

interface BookClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBooked?: () => void;
}

export function BookClassDialog({ open, onOpenChange, onBooked }: BookClassDialogProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  useEffect(() => {
    if (open) {
      fetchSessions();
    }
  }, [open, selectedDate]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const data = await sessionsApi.getAll({ date: dateStr, status: 'scheduled' });
      setSessions(data || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (sessionId: string) => {
    if (!user) {
      toast.error("Vous devez être connecté pour réserver");
      return;
    }

    setBookingId(sessionId);
    try {
      await reservationsApi.create(sessionId);
      toast.success("Réservation confirmée !");
      fetchSessions();
      onBooked?.();
    } catch (error: any) {
      toast.error("Erreur lors de la réservation: " + error.message);
    } finally {
      setBookingId(null);
    }
  };

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case "beginner":
        return "bg-green-500/20 text-green-500";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-500";
      case "advanced":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Réserver un cours
          </DialogTitle>
        </DialogHeader>

        {/* Date selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {nextDays.map((date) => (
            <Button
              key={date.toISOString()}
              variant={isSameDay(date, selectedDate) ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setSelectedDate(date)}
            >
              <div className="text-center">
                <div className="text-xs">{format(date, "EEE", { locale: fr })}</div>
                <div className="font-bold">{format(date, "dd")}</div>
              </div>
            </Button>
          ))}
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun cours disponible ce jour</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sessions.map((session) => {
              const maxParticipants = session.courses?.max_participants || 20;

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{session.courses?.name}</p>
                      <Badge className={getDifficultyColor(session.courses?.difficulty_level)}>
                        {session.courses?.difficulty_level || "Tous niveaux"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {maxParticipants} places max
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {session.courses?.category}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    disabled={bookingId === session.id}
                    onClick={() => handleBook(session.id)}
                  >
                    {bookingId === session.id ? "Réservation..." : "Réserver"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
