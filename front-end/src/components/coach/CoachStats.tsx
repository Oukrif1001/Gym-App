import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sessionsApi, coursesApi, reservationsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock, BookOpen } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface Stats {
  todaySessions: number;
  totalStudents: number;
  weeklyHours: number;
  totalCourses: number;
}

export default function CoachStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    todaySessions: 0,
    totalStudents: 0,
    weeklyHours: 0,
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Fetch coach's courses
      const courses = await coursesApi.getMy();
      
      // Fetch coach's sessions
      const sessions = await sessionsApi.getMy();
      
      // Today's sessions
      const todaySessions = sessions.filter(
        (s: any) => s.session_date === today && s.status === "scheduled"
      ).length;

      // Weekly sessions for hours calculation
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      
      const weeklySessions = sessions.filter(
        (s: any) => s.session_date >= weekStart && s.session_date <= weekEnd
      );
      
      const weeklyMinutes = weeklySessions.reduce((acc: number, session: any) => {
        // Handle both 'courses' and 'course' property names
        const course = session.courses || session.course;
        return acc + (course?.duration_minutes || 60);
      }, 0);

      // Total unique students (from reservations)
      let uniqueStudents = 0;
      if (sessions.length > 0) {
        const allReservations: any[] = [];
        for (const session of sessions) {
          try {
            const reservations = await reservationsApi.getBySession(session.id);
            allReservations.push(...reservations.filter((r: any) => r.status === "confirmed"));
          } catch (e) {
            // Ignore errors for individual sessions
          }
        }
        const uniqueUserIds = new Set(allReservations.map((r: any) => r.user_id));
        uniqueStudents = uniqueUserIds.size;
      }

      setStats({
        todaySessions,
        totalStudents: uniqueStudents,
        weeklyHours: Math.round(weeklyMinutes / 60),
        totalCourses: courses.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: "Sessions aujourd'hui", value: stats.todaySessions, icon: Calendar, color: "text-primary" },
    { title: "Mes cours", value: stats.totalCourses, icon: BookOpen, color: "text-blue-400" },
    { title: "Étudiants uniques", value: stats.totalStudents, icon: Users, color: "text-green-400" },
    { title: "Heures cette semaine", value: stats.weeklyHours, icon: Clock, color: "text-yellow-400" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
