import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { paymentsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CreditCard, Receipt } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  status: string | null;
  payment_method: string | null;
  created_at: string;
  invoice_number: string | null;
}

interface PaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentsDialog({ open, onOpenChange }: PaymentsDialogProps) {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchPayments();
    }
  }, [open, user]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.getMy();
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-500">Complété</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500">En attente</Badge>;
      case "failed":
        return <Badge className="bg-red-500/20 text-red-500">Échoué</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Historique des paiements
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun paiement trouvé</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted"
              >
                <div>
                  <p className="font-medium">{payment.amount.toFixed(2)} €</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payment.created_at), "dd MMMM yyyy", { locale: fr })}
                  </p>
                  {payment.invoice_number && (
                    <p className="text-xs text-muted-foreground">
                      Facture: {payment.invoice_number}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {getStatusBadge(payment.status)}
                  {payment.payment_method && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {payment.payment_method}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
