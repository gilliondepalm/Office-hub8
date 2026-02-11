import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Plus, CalendarDays, MapPin, Clock, Trash2, Pencil } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Event } from "@shared/schema";
import { useAuth } from "@/lib/auth";

const eventFormSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  description: z.string().optional(),
  date: z.string().min(1, "Datum is verplicht"),
  endDate: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
});

function EventFormDialog({
  open,
  onOpenChange,
  editEvent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEvent?: Event | null;
}) {
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: editEvent?.title || "",
      description: editEvent?.description || "",
      date: editEvent?.date || "",
      endDate: editEvent?.endDate || "",
      time: editEvent?.time || "",
      location: editEvent?.location || "",
      category: editEvent?.category || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof eventFormSchema>) => {
      const payload = {
        ...data,
        description: data.description || null,
        endDate: data.endDate || null,
        time: data.time || null,
        location: data.location || null,
        category: data.category || null,
        createdBy: user?.id || null,
      };
      if (editEvent) {
        await apiRequest("PATCH", `/api/events/${editEvent.id}`, payload);
      } else {
        await apiRequest("POST", "/api/events", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: editEvent ? "Evenement bijgewerkt" : "Evenement aangemaakt" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Fout bij opslaan", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editEvent ? "Evenement Bewerken" : "Nieuw Evenement"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Titel</FormLabel>
                <FormControl><Input {...field} data-testid="input-event-title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Beschrijving</FormLabel>
                <FormControl><Textarea {...field} data-testid="input-event-description" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Startdatum</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-event-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Einddatum</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-event-enddate" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tijd</FormLabel>
                  <FormControl><Input type="time" {...field} data-testid="input-event-time" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Locatie</FormLabel>
                  <FormControl><Input {...field} data-testid="input-event-location" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Categorie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-event-category"><SelectValue placeholder="Selecteer categorie" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="vergadering">Vergadering</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="sociaal">Sociaal</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-event">
              {mutation.isPending ? "Opslaan..." : editEvent ? "Bijwerken" : "Evenement Opslaan"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function KalenderPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Evenement verwijderd" });
    },
  });

  const sortedEvents = events?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const categoryColors: Record<string, string> = {
    vergadering: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    training: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    sociaal: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    deadline: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-kalender-title">Evenementen Kalender</h1>
          <p className="text-muted-foreground text-sm">Beheer uw evenementen en vergaderingen</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="button-add-event">
          <Plus className="h-4 w-4 mr-2" />
          Nieuw Evenement
        </Button>
      </div>

      <EventFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EventFormDialog open={!!editEvent} onOpenChange={(open) => { if (!open) setEditEvent(null); }} editEvent={editEvent} />

      {sortedEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Geen evenementen gevonden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sortedEvents.map((event) => {
            const isPast = new Date(event.date) < new Date();
            return (
              <Card key={event.id} className={isPast ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                      <span className="text-xs font-medium uppercase">
                        {format(new Date(event.date), "MMM", { locale: nl })}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {format(new Date(event.date), "dd")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm" data-testid={`text-event-title-${event.id}`}>{event.title}</h3>
                        {event.category && (
                          <Badge variant="secondary" className={`text-xs ${categoryColors[event.category] || ""}`}>
                            {event.category}
                          </Badge>
                        )}
                        {isPast && <Badge variant="outline" className="text-xs">Afgelopen</Badge>}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(event.date), "EEEE d MMMM yyyy", { locale: nl })}
                        </span>
                        {event.time && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {(user?.role === "admin" || user?.role === "manager") && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditEvent(event)}
                          data-testid={`button-edit-event-${event.id}`}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(event.id)}
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
