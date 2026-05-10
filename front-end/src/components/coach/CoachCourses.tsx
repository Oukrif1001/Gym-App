import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { coursesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Clock, Users, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  max_participants: number;
  difficulty_level: string | null;
  room: string | null;
  is_active: boolean;
}

const CATEGORIES = ["Cardio", "Musculation", "Yoga", "Pilates", "CrossFit", "Boxing", "Dance", "Stretching"];

export default function CoachCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: "",
    description: "",
    category: "",
    duration_minutes: 60,
    max_participants: 20,
    difficulty_level: "intermediate",
    room: "",
  });

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const data = await coursesApi.getMy();
      setCourses(data.filter((c: Course) => c.is_active));
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!newCourse.name.trim() || !newCourse.category) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      await coursesApi.create({
        name: newCourse.name.trim(),
        description: newCourse.description.trim() || null,
        category: newCourse.category,
        duration_minutes: newCourse.duration_minutes,
        max_participants: newCourse.max_participants,
        difficulty_level: newCourse.difficulty_level,
        room: newCourse.room.trim() || null,
      });

      toast.success("Cours créé avec succès");
      setDialogOpen(false);
      setNewCourse({
        name: "",
        description: "",
        category: "",
        duration_minutes: 60,
        max_participants: 20,
        difficulty_level: "intermediate",
        room: "",
      });
      fetchCourses();
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Erreur lors de la création du cours");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await coursesApi.delete(courseId);
      toast.success("Cours supprimé avec succès");
      fetchCourses();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error(error.message || "Erreur lors de la suppression du cours");
    }
  };

  const getDifficultyColor = (level: string | null) => {
    switch (level) {
      case "beginner": return "bg-green-500/20 text-green-400";
      case "intermediate": return "bg-yellow-500/20 text-yellow-400";
      case "advanced": return "bg-red-500/20 text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getDifficultyLabel = (level: string | null) => {
    switch (level) {
      case "beginner": return "Débutant";
      case "intermediate": return "Intermédiaire";
      case "advanced": return "Avancé";
      default: return level;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Mes cours ({courses.length})</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un cours
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouveau cours</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du cours *</Label>
                <Input
                  id="name"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  placeholder="Ex: HIIT Training"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={newCourse.category}
                  onValueChange={(value) => setNewCourse({ ...newCourse, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Décrivez votre cours..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={15}
                    max={180}
                    value={newCourse.duration_minutes}
                    onChange={(e) => setNewCourse({ ...newCourse, duration_minutes: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Max participants</Label>
                  <Input
                    id="max"
                    type="number"
                    min={1}
                    max={100}
                    value={newCourse.max_participants}
                    onChange={(e) => setNewCourse({ ...newCourse, max_participants: parseInt(e.target.value) || 20 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Niveau</Label>
                <Select
                  value={newCourse.difficulty_level}
                  onValueChange={(value) => setNewCourse({ ...newCourse, difficulty_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Débutant</SelectItem>
                    <SelectItem value="intermediate">Intermédiaire</SelectItem>
                    <SelectItem value="advanced">Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room">Salle</Label>
                <Input
                  id="room"
                  value={newCourse.room}
                  onChange={(e) => setNewCourse({ ...newCourse, room: e.target.value })}
                  placeholder="Ex: Salle A"
                />
              </div>

              <Button className="w-full" onClick={handleCreateCourse}>
                Créer le cours
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucun cours pour le moment. Créez votre premier cours !
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <Badge className={getDifficultyColor(course.difficulty_level)}>
                    {getDifficultyLabel(course.difficulty_level)}
                  </Badge>
                </div>
                {course.category && (
                  <Badge variant="outline" className="w-fit">{course.category}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                )}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Max {course.max_participants}
                    </span>
                    {course.room && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {course.room}
                      </span>
                    )}
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Supprimer le cours"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce cours ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Attention : cette action est irréversible. Cela supprimera également toutes les sessions planifiées pour ce cours et leurs réservations.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCourse(course.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
