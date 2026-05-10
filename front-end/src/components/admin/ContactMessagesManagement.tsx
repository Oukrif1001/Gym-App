import { useState, useEffect } from "react";
import { contactMessagesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, MailOpen, Phone, Calendar, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  read_at: string | null;
}

export function ContactMessagesManagement() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await contactMessagesApi.getAll();
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (message: ContactMessage) => {
    if (message.status === "read") return;

    try {
      await contactMessagesApi.markAsRead(message.id);

      setMessages(
        messages.map((m) =>
          m.id === message.id
            ? { ...m, status: "read", read_at: new Date().toISOString() }
            : m
        )
      );
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    await markAsRead(message);
  };

  const handleDelete = async (id: string) => {
    try {
      await contactMessagesApi.delete(id);

      setMessages(messages.filter((m) => m.id !== id));
      toast({
        title: "Message supprimé",
        description: "Le message a été supprimé avec succès",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le message",
        variant: "destructive",
      });
    }
  };

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Messages de contact
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} non lu(s)</Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun message de contact
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    message.status === "unread"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {message.status === "unread" ? (
                          <Mail className="h-4 w-4 text-primary" />
                        ) : (
                          <MailOpen className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-semibold truncate">
                          {message.name}
                        </span>
                        {message.status === "unread" && (
                          <Badge variant="secondary" className="text-xs">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">
                        {message.subject}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {message.email}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(message.created_at), "dd MMM yyyy à HH:mm", {
                            locale: fr,
                          })}
                        </span>
                        {message.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {message.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMessage(message)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le message ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. Le message sera définitivement supprimé.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(message.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Message Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">De :</span>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email :</span>
                  <p className="font-medium">{selectedMessage.email}</p>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <span className="text-muted-foreground">Téléphone :</span>
                    <p className="font-medium">{selectedMessage.phone}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Date :</span>
                  <p className="font-medium">
                    {format(new Date(selectedMessage.created_at), "dd MMMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <span className="text-sm text-muted-foreground">Message :</span>
                <p className="mt-2 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" asChild>
                  <a href={`mailto:${selectedMessage.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Répondre par email
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
