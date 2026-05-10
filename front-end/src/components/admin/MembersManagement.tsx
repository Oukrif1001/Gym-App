import { useState, useEffect } from "react";
import { profilesApi, userRolesApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Edit, Trash2, Loader2, Shield, User as UserIcon, GraduationCap } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
}

export function MembersManagement() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await profilesApi.getAll();
      setMembers(data || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des membres");
      console.error(error);
    }
    setLoading(false);
  };

  const handleUpdateMember = async () => {
    if (!editingMember) return;

    try {
      // 1. Update Profile Info
      console.log("Updating member profile:", editingMember);
      await profilesApi.update(editingMember.user_id, {
        firstName: editingMember.first_name,
        lastName: editingMember.last_name,
        phone: editingMember.phone,
        email: editingMember.email, // Ajout du mail si nécessaire pour le backend
      });

      // 2. Update Role if changed (backend handles admin self-edit prevention)
      if (editingMember.role) {
        setIsUpdatingRole(true);
        try {
          await userRolesApi.update(editingMember.user_id, editingMember.role);
        } catch (roleError: any) {
          toast.error("Profil mis à jour, mais erreur de rôle: " + roleError.message);
        } finally {
          setIsUpdatingRole(false);
        }
      }

      toast.success("Membre mis à jour avec succès");
      setIsEditOpen(false);
      fetchMembers();
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error.message || "Erreur lors de la mise à jour");
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500/20 text-red-400 gap-1"><Shield className="h-3 w-3" /> Admin</Badge>;
      case 'coach':
        return <Badge className="bg-blue-500/20 text-blue-400 gap-1"><GraduationCap className="h-3 w-3" /> Coach</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><UserIcon className="h-3 w-3" /> Membre</Badge>;
    }
  };

  const handleDeleteMember = async (member: Member) => {
    setDeletingId(member.user_id);
    try {
      await profilesApi.delete(member.user_id);
      toast.success("Membre supprimé avec succès");
      fetchMembers();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <CardTitle>Gestion des Membres ({members.length})</CardTitle>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  {member.first_name} {member.last_name}
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>{getRoleBadge(member.role)}</TableCell>
                <TableCell>{member.phone || "-"}</TableCell>
                <TableCell>
                  {new Date(member.created_at).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Dialog open={isEditOpen && editingMember?.id === member.id} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditingMember(member)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier le membre</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Prénom</Label>
                          <Input
                            value={editingMember?.first_name || ""}
                            onChange={(e) => setEditingMember((prev) => prev ? { ...prev, first_name: e.target.value } : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nom</Label>
                          <Input
                            value={editingMember?.last_name || ""}
                            onChange={(e) => setEditingMember((prev) => prev ? { ...prev, last_name: e.target.value } : null)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Téléphone</Label>
                          <Input
                            value={editingMember?.phone || ""}
                            onChange={(e) => setEditingMember((prev) => prev ? { ...prev, phone: e.target.value } : null)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Rôle</Label>
                          <Select
                            value={editingMember?.role || "member"}
                            onValueChange={(value) => setEditingMember((prev) => prev ? { ...prev, role: value } : null)}
                            disabled={editingMember?.user_id === user?.id}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Membre</SelectItem>
                              <SelectItem value="coach">Coach</SelectItem>
                              <SelectItem value="admin">Administrateur</SelectItem>
                            </SelectContent>
                          </Select>
                          {editingMember?.user_id === user?.id && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Vous ne pouvez pas modifier votre propre rôle.
                            </p>
                          )}
                        </div>

                        <Button onClick={handleUpdateMember} className="w-full" disabled={isUpdatingRole}>
                          {isUpdatingRole ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Enregistrer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === member.user_id || member.user_id === user?.id}
                        title={member.user_id === user?.id ? "Vous ne pouvez pas vous supprimer" : "Supprimer"}
                      >
                        {deletingId === member.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className={`h-4 w-4 ${member.user_id === user?.id ? "text-muted-foreground" : "text-destructive"}`} />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Le membre {member.first_name} {member.last_name} sera définitivement supprimé.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteMember(member)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
        {filteredMembers.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun membre trouvé</p>}
      </CardContent>
    </Card>
  );
}
