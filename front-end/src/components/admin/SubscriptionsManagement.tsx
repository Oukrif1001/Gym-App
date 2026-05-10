import { useState, useEffect } from "react";
import { subscriptionTypesApi, subscriptionsApi, paymentsApi, profilesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Loader2, CreditCard, Package } from "lucide-react";

interface SubscriptionType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
  max_classes_per_week: number | null;
  is_active: boolean;
}

interface Subscription {
  id: string;
  user_id: string;
  subscription_type_id: string;
  start_date: string;
  end_date: string;
  status: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  type?: SubscriptionType;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

export function SubscriptionsManagement() {
  const [subscriptionTypes, setSubscriptionTypes] = useState<SubscriptionType[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);
  const [newType, setNewType] = useState({
    name: "",
    description: "",
    price: 0,
    duration_months: 1,
    max_classes_per_week: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch subscription types
      const types = await subscriptionTypesApi.getAll();
      setSubscriptionTypes(types || []);

      // Fetch subscriptions
      const subs = await subscriptionsApi.getAll({});
      const profiles = await profilesApi.getAll();

      if (subs) {
        const subsWithData = subs.map((sub: any) => {
          const profile = profiles.find((p: any) => p.user_id === sub.user_id);
          const type = (types || []).find((t: any) => t.id === sub.subscription_type_id);
          return { ...sub, profile, type };
        });
        setSubscriptions(subsWithData);
      }

      // Fetch payments
      const pays = await paymentsApi.getAll({ limit: "50" });

      if (pays) {
        const paysWithProfiles = pays.map((pay: any) => {
          const profile = profiles.find((p: any) => p.user_id === pay.user_id);
          return { ...pay, profile };
        });
        setPayments(paysWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setLoading(false);
  };

  const handleAddType = async () => {
    if (!newType.name || newType.price <= 0) {
      toast.error("Nom et prix requis");
      return;
    }

    try {
      await subscriptionTypesApi.create({
        name: newType.name,
        description: newType.description,
        price: newType.price,
        duration_months: newType.duration_months,
        max_classes_per_week: newType.max_classes_per_week || null,
      });

      toast.success("Type d'abonnement créé");
      setIsAddTypeOpen(false);
      setNewType({ name: "", description: "", price: 0, duration_months: 1, max_classes_per_week: 0 });
      fetchData();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRevenue.toFixed(2)}€</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abonnements actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeSubscriptions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paiements ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="types">
        <TabsList>
          <TabsTrigger value="types">
            <Package className="h-4 w-4 mr-2" />
            Types d'abonnements
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <CreditCard className="h-4 w-4 mr-2" />
            Abonnements
          </TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Types d'abonnements</CardTitle>
                <Dialog open={isAddTypeOpen} onOpenChange={setIsAddTypeOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau type
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer un type d'abonnement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          value={newType.name}
                          onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                          placeholder="Premium, Basic..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Prix (€)</Label>
                          <Input
                            type="number"
                            value={newType.price}
                            onChange={(e) => setNewType({ ...newType, price: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Durée (mois)</Label>
                          <Input
                            type="number"
                            value={newType.duration_months}
                            onChange={(e) => setNewType({ ...newType, duration_months: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cours max/semaine (0 = illimité)</Label>
                        <Input
                          type="number"
                          value={newType.max_classes_per_week}
                          onChange={(e) => setNewType({ ...newType, max_classes_per_week: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newType.description}
                          onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleAddType} className="w-full">
                        Créer
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
                    <TableHead>Prix</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Cours/semaine</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.price}€</TableCell>
                      <TableCell>{type.duration_months} mois</TableCell>
                      <TableCell>{type.max_classes_per_week || "Illimité"}</TableCell>
                      <TableCell>
                        <Badge variant={type.is_active ? "default" : "secondary"}>
                          {type.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Abonnements ({subscriptions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        {sub.profile?.first_name} {sub.profile?.last_name}
                      </TableCell>
                      <TableCell>{sub.type?.name || "-"}</TableCell>
                      <TableCell>{new Date(sub.start_date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{new Date(sub.end_date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>
                        <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {subscriptions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Aucun abonnement</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Derniers paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.profile?.first_name} {payment.profile?.last_name}
                      </TableCell>
                      <TableCell className="font-medium">{Number(payment.amount).toFixed(2)}€</TableCell>
                      <TableCell>{payment.payment_method || "-"}</TableCell>
                      <TableCell>{new Date(payment.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {payments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Aucun paiement</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
