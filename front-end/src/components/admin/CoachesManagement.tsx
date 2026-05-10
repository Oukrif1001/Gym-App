import { useState, useEffect } from "react";
import { coachesApi, profilesApi, userRolesApi } from "@/lib/api";
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
import { UserPlus, Edit, Loader2 } from "lucide-react";

interface Coach {
  id: string;
  user_id: string;
  hourly_rate: number | null;
  is_active: boolean;
  bio: string | null;
  specializations: string[] | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface Member {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export function CoachesManagement() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [newCoach, setNewCoach] = useState({
    hourly_rate: 50,
    bio: "",
    specializations: "",
  });

  useEffect(() => {
    fetchCoaches();
    fetchMembers();
  }, []);

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const coachesData = await coachesApi.getAll();
      const profilesData = await profilesApi.getAll();
      
      const coachesWithProfiles = coachesData.map((coach: any) => {
        const profile = profilesData.find((p: any) => p.user_id === coach.user_id);
        return { ...coach, profile };
      });
      
      setCoaches(coachesWithProfiles);
    } catch (error) {
      toast.error("Erreur lors du chargement des coachs");
    }
    setLoading(false);
  };

  const fetchMembers = async () => {
    try {
      const data = await profilesApi.getAll();
      setMembers(data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const handleAddCoach = async () => {
    if (!selectedMember) {
      toast.error("Sélectionnez un membre");
      return;
    }

    // Check if already a coach
    const existingCoach = coaches.find(c => c.user_id === selectedMember);
    if (existingCoach) {
      toast.error("Ce membre est déjà coach");
      return;
    }

    try {
      await coachesApi.create({
        user_id: selectedMember,
        hourly_rate: newCoach.hourly_rate,
        bio: newCoach.bio,
        specializations: newCoach.specializations.split(",").map((s) => s.trim()).filter(Boolean),
      });

      // Update user role to coach
      await userRolesApi.update(selectedMember, "coach");

      toast.success("Coach ajouté avec succès");
      setIsAddOpen(false);
      setSelectedMember("");
      setNewCoach({ hourly_rate: 50, bio: "", specializations: "" });
      fetchCoaches();
    } catch (error) {
      toast.error("Erreur lors de la création du coach");
    }
  };

  const handleUpdateCoach = async () => {
    if (!editingCoach) return;

    try {
      await coachesApi.update(editingCoach.id, {
        hourly_rate: editingCoach.hourly_rate,
        bio: editingCoach.bio,
        is_active: editingCoach.is_active,
        specializations: editingCoach.specializations,
      });

      toast.success("Coach mis à jour avec succès");
      setIsEditOpen(false);
      fetchCoaches();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
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
          <CardTitle>Gestion des Coachs ({coaches.length})</CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter un coach
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un coach</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Sélectionner un membre</Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un membre" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.first_name} {member.last_name} ({member.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Taux horaire (€)</Label>
                  <Input
                    type="number"
                    value={newCoach.hourly_rate}
                    onChange={(e) =>
                      setNewCoach({ ...newCoach, hourly_rate: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spécialisations (séparées par virgule)</Label>
                  <Input
                    value={newCoach.specializations}
                    onChange={(e) =>
                      setNewCoach({ ...newCoach, specializations: e.target.value })
                    }
                    placeholder="Musculation, Cardio, Yoga"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={newCoach.bio}
                    onChange={(e) => setNewCoach({ ...newCoach, bio: e.target.value })}
                    placeholder="Description du coach..."
                  />
                </div>
                <Button onClick={handleAddCoach} className="w-full">
                  Ajouter
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
              <TableHead>Email</TableHead>
              <TableHead>Spécialisations</TableHead>
              <TableHead>Taux horaire</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coaches.map((coach) => (
              <TableRow key={coach.id}>
                <TableCell className="font-medium">
                  {coach.profile?.first_name} {coach.profile?.last_name}
                </TableCell>
                <TableCell>{coach.profile?.email}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {coach.specializations?.map((spec, i) => (
                      <Badge key={i} variant="secondary">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{coach.hourly_rate}€/h</TableCell>
                <TableCell>
                  <Badge variant={coach.is_active ? "default" : "secondary"}>
                    {coach.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Dialog open={isEditOpen && editingCoach?.id === coach.id} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingCoach(coach)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier le coach</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Taux horaire (€)</Label>
                          <Input
                            type="number"
                            value={editingCoach?.hourly_rate || 0}
                            onChange={(e) =>
                              setEditingCoach((prev) =>
                                prev ? { ...prev, hourly_rate: Number(e.target.value) } : null
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Bio</Label>
                          <Textarea
                            value={editingCoach?.bio || ""}
                            onChange={(e) =>
                              setEditingCoach((prev) =>
                                prev ? { ...prev, bio: e.target.value } : null
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Actif</Label>
                          <Switch
                            checked={editingCoach?.is_active || false}
                            onCheckedChange={(checked) =>
                              setEditingCoach((prev) =>
                                prev ? { ...prev, is_active: checked } : null
                              )
                            }
                          />
                        </div>
                        <Button onClick={handleUpdateCoach} className="w-full">
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
        {coaches.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aucun coach trouvé
          </p>
        )}
      </CardContent>
    </Card>
  );
}
