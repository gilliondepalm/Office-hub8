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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Absence } from "@shared/schema";
import { useAuth } from "@/lib/auth";

const absenceFormSchema = z.object({
  type: z.enum(["sick", "vacation", "personal", "other"]),
  startDate: z.string().min(1, "Startdatum is verplicht"),
  endDate: z.string().min(1, "Einddatum is verplicht"),
  reason: z.string().optional(),
});

export default function VerzuimPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: absences, isLoading } = useQuery<(Absence & { userName?: string })[]>({
    queryKey: ["/api/absences"],
  });

  const form = useForm<z.infer<typeof absenceFormSchema>>({
    resolver: zodResolver(absenceFormSchema),
    defaultValues: { type: "sick", startDate: "", endDate: "", reason: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof absenceFormSchema>) => {
      await apiRequest("POST", "/api/absences", {
        ...data,
        userId: user?.id,
        reason: data.reason || null,
        status: "pending",
        approvedBy: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/absences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Verzuimmelding ingediend" });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Fout bij indienen", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/absences/${id}`, { status, approvedBy: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/absences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Status bijgewerkt" });
    },
  });

  const typeLabels: Record<string, string> = {
    sick: "Ziekte",
    vacation: "Vakantie",
    personal: "Persoonlijk",
    other: "Overig",
  };

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
    pending: { label: "In afwachting", variant: "outline", icon: AlertCircle },
    approved: { label: "Goedgekeurd", variant: "default", icon: CheckCircle },
    rejected: { label: "Afgewezen", variant: "destructive", icon: XCircle },
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-verzuim-title">Verzuim</h1>
          <p className="text-muted-foreground text-sm">Beheer verlof- en ziekmeldingen</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-absence">
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Verzoek
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verzuimmelding</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-absence-type"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sick">Ziekte</SelectItem>
                        <SelectItem value="vacation">Vakantie</SelectItem>
                        <SelectItem value="personal">Persoonlijk</SelectItem>
                        <SelectItem value="other">Overig</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Startdatum</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-absence-startdate" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Einddatum</FormLabel>
                      <FormControl><Input type="date" {...field} data-testid="input-absence-enddate" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="reason" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reden</FormLabel>
                    <FormControl><Textarea {...field} data-testid="input-absence-reason" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit-absence">
                  {createMutation.isPending ? "Indienen..." : "Verzoek Indienen"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {(!absences || absences.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Geen verzuimmeldingen</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medewerker</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Reden</TableHead>
                    <TableHead>Status</TableHead>
                    {(user?.role === "admin" || user?.role === "manager") && <TableHead>Actie</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {absences.map((absence) => {
                    const sc = statusConfig[absence.status] || statusConfig.pending;
                    const StatusIcon = sc.icon;
                    return (
                      <TableRow key={absence.id} data-testid={`row-absence-${absence.id}`}>
                        <TableCell className="font-medium text-sm">
                          {(absence as any).userName || "Medewerker"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{typeLabels[absence.type]}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(absence.startDate), "d MMM", { locale: nl })} - {format(new Date(absence.endDate), "d MMM yyyy", { locale: nl })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                          {absence.reason || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sc.variant} className="text-xs gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        {(user?.role === "admin" || user?.role === "manager") && (
                          <TableCell>
                            {absence.status === "pending" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatusMutation.mutate({ id: absence.id, status: "approved" })}
                                  data-testid={`button-approve-absence-${absence.id}`}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Goed
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStatusMutation.mutate({ id: absence.id, status: "rejected" })}
                                  data-testid={`button-reject-absence-${absence.id}`}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Afwijzen
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
