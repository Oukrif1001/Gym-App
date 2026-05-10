import { useState, useEffect } from "react";
import { coursesApi, coachesApi, profilesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Loader2 } from "lucide-react";

interface Course {
  id: string;
  name: string;
  description: string | null;
  category: string;
  coach_id: string | null;
  duration_minutes: number;
  max_participants: number;
  difficulty_level: string | null;
  room: string | null;
  is_active: boolean;
}

interface Coach {
  id: string;
  user_id: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

export function CoursesManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    name: "",
    description: "",
    category: "Musculation",
    coach_id: "",
    duration_minutes: 60,
    max_participants: 20,
    difficulty_level: "intermediate",
    room: "",
  });

  const categories = ["Musculation", "Cardio", "Yoga", "Pilates", "CrossFit", "Boxing", "Dance"];

  useEffect(() => {
    fetchCourses();
    fetchCoaches();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const data = await coursesApi.getAll();
      setCourses(data || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des cours");
    }
    setLoading(false);
  };

  const fetchCoaches = async () => {
    try {
      const coachesData = await coachesApi.getAll();
      const profilesData = await profilesApi.getAll();
      
      const coachesWithProfiles = coachesData.map((coach: any) => {
        const profile = profilesData.find((p: any) => p.user_id === coach.user_id);
        return { ...coach, profile };
      });
      
      setCoaches(coachesWithProfiles);
    } catch (error) {
      console.error("Error fetching coaches:", error);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.name) {
      toast.error("Le nom est requis");
      return;
    }

    try {
      await coursesApi.create({
        name: newCourse.name,
        description: newCourse.description,
        category: newCourse.category,
        coach_id: newCourse.coach_id || null,
        duration_minutes: newCourse.duration_minutes,
        max_participants: newCourse.max_participants,
        difficulty_level: newCourse.difficulty_level,
        room: newCourse.room,
      });

      toast.success("Cours créé avec succès");
      setIsAddOpen(false);
      setNewCourse({
        name: "",
        description: "",
        category: "Musculation",
        coach_id: "",
        duration_minutes: 60,
        max_participants: 20,
        difficulty_level: "intermediate",
        room: "",
      });
      fetchCourses();
    } catch (error) {
      toast.error("Erreur lors de la création du cours");
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse) return;

    try {
      await coursesApi.update(editingCourse.id, {
        name: editingCourse.name,
        description: editingCourse.description,
        category: editingCourse.category,
        coach_id: editingCourse.coach_id,
        duration_minutes: editingCourse.duration_minutes,
        max_participants: editingCourse.max_participants,
        difficulty_level: editingCourse.difficulty_level,
        room: editingCourse.room,
        is_active: editingCourse.is_active,
      });

      toast.success("Cours mis à jour avec succès");
      setIsEditOpen(false);
      fetchCourses();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getCoachName = (coachId: string | null) => {
    if (!coachId) return "-";
    const coach = coaches.find((c) => c.id === coachId);
    return coach?.profile ? `${coach.profile.first_name} ${coach.profile.last_name}` : "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gestion des Cours ({courses.length})</CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un cours
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter un cours</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nom du cours</Label>
                  <Input
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={newCourse.category}
                    onValueChange={(value) => setNewCourse({ ...newCourse, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Coach</Label>
                  <Select
                    value={newCourse.coach_id}
                    onValueChange={(value) => setNewCourse({ ...newCourse, coach_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un coach" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches.map((coach) => (
                        <SelectItem key={coach.id} value={coach.id}>
                          {coach.profile?.first_name} {coach.profile?.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Durée (min)</Label>
                    <Input
                      type="number"
                      value={newCourse.duration_minutes}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, duration_minutes: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max participants</Label>
                    <Input
                      type="number"
                      value={newCourse.max_participants}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, max_participants: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Niveau</Label>
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
                  <Label>Salle</Label>
                  <Input
                    value={newCourse.room}
                    onChange={(e) => setNewCourse({ ...newCourse, room: e.target.value })}
                    placeholder="Salle A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddCourse} className="w-full">
                  Créer le cours
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Niveau</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{course.category}</Badge>
                </TableCell>
                <TableCell>{getCoachName(course.coach_id)}</TableCell>
                <TableCell>{course.duration_minutes} min</TableCell>
                <TableCell>
                  <Badge variant="secondary">{course.difficulty_level}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={course.is_active ? "default" : "secondary"}>
                    {course.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog open={isEditOpen && editingCourse?.id === course.id} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCourse(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Modifier le cours</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-2">
                          <Label>Nom</Label>
                          <Input
                            value={editingCourse?.name || ""}
                            onChange={(e) =>
                              setEditingCourse((prev) =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Actif</Label>
                          <Switch
                            checked={editingCourse?.is_active || false}
                            onCheckedChange={(checked) =>
                              setEditingCourse((prev) =>
                                prev ? { ...prev, is_active: checked } : null
                              )
                            }
                          />
                        </div>
                        <Button onClick={handleUpdateCourse} className="w-full">
                          Enregistrer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {courses.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aucun cours trouvé
          </p>
        )}
      </CardContent>
    </Card>
  );
}
