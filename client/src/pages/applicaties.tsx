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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, AppWindow, Shield, ExternalLink, Trash2, UserPlus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Application, AppAccess, User } from "@shared/schema";
import { useAuth } from "@/lib/auth";

const appFormSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  description: z.string().optional(),
  url: z.string().optional(),
  icon: z.string().optional(),
});

const accessFormSchema = z.object({
  userId: z.string().min(1, "Selecteer een gebruiker"),
  applicationId: z.string().min(1, "Selecteer een applicatie"),
  accessLevel: z.string().default("read"),
});

export default function ApplicatiesPage() {
  const [appOpen, setAppOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: accesses } = useQuery<(AppAccess & { userName?: string; appName?: string })[]>({
    queryKey: ["/api/app-access"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const appForm = useForm<z.infer<typeof appFormSchema>>({
    resolver: zodResolver(appFormSchema),
    defaultValues: { name: "", description: "", url: "", icon: "" },
  });

  const accessForm = useForm<z.infer<typeof accessFormSchema>>({
    resolver: zodResolver(accessFormSchema),
    defaultValues: { userId: "", applicationId: "", accessLevel: "read" },
  });

  const createAppMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appFormSchema>) => {
      await apiRequest("POST", "/api/applications", {
        ...data,
        description: data.description || null,
        url: data.url || null,
        icon: data.icon || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Applicatie aangemaakt" });
      setAppOpen(false);
      appForm.reset();
    },
    onError: () => {
      toast({ title: "Fout bij aanmaken", variant: "destructive" });
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/app-access"] });
      toast({ title: "Applicatie verwijderd" });
    },
  });

  const grantAccessMutation = useMutation({
    mutationFn: async (data: z.infer<typeof accessFormSchema>) => {
      await apiRequest("POST", "/api/app-access", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-access"] });
      toast({ title: "Toegang verleend" });
      setAccessOpen(false);
      accessForm.reset();
    },
    onError: () => {
      toast({ title: "Fout bij verlenen", variant: "destructive" });
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/app-access/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-access"] });
      toast({ title: "Toegang ingetrokken" });
    },
  });

  const accessLevelLabels: Record<string, string> = {
    read: "Lezen",
    write: "Schrijven",
    admin: "Beheerder",
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
          <h1 className="text-2xl font-bold" data-testid="text-applicaties-title">Applicaties</h1>
          <p className="text-muted-foreground text-sm">Beheer applicaties en toegangsrechten</p>
        </div>
        {user?.role === "admin" && (
          <div className="flex gap-2 flex-wrap">
            <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-grant-access">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Toegang Verlenen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Toegang Verlenen</DialogTitle>
                </DialogHeader>
                <Form {...accessForm}>
                  <form onSubmit={accessForm.handleSubmit((d) => grantAccessMutation.mutate(d))} className="space-y-4">
                    <FormField control={accessForm.control} name="userId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gebruiker</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger data-testid="select-access-user"><SelectValue placeholder="Selecteer gebruiker" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {users?.map((u) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={accessForm.control} name="applicationId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Applicatie</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger data-testid="select-access-app"><SelectValue placeholder="Selecteer applicatie" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {applications?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={accessForm.control} name="accessLevel" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Toegangsniveau</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger data-testid="select-access-level"><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="read">Lezen</SelectItem>
                            <SelectItem value="write">Schrijven</SelectItem>
                            <SelectItem value="admin">Beheerder</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={grantAccessMutation.isPending} data-testid="button-submit-access">
                      {grantAccessMutation.isPending ? "Verlenen..." : "Toegang Verlenen"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Dialog open={appOpen} onOpenChange={setAppOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-application">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Applicatie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nieuwe Applicatie</DialogTitle>
                </DialogHeader>
                <Form {...appForm}>
                  <form onSubmit={appForm.handleSubmit((d) => createAppMutation.mutate(d))} className="space-y-4">
                    <FormField control={appForm.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Naam</FormLabel>
                        <FormControl><Input {...field} data-testid="input-app-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={appForm.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschrijving</FormLabel>
                        <FormControl><Textarea {...field} data-testid="input-app-description" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={appForm.control} name="url" render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl><Input {...field} placeholder="https://..." data-testid="input-app-url" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={createAppMutation.isPending} data-testid="button-submit-application">
                      {createAppMutation.isPending ? "Opslaan..." : "Applicatie Opslaan"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Tabs defaultValue="apps">
        <TabsList>
          <TabsTrigger value="apps" data-testid="tab-apps">Applicaties</TabsTrigger>
          <TabsTrigger value="access" data-testid="tab-access">Toegangsrechten</TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="mt-4">
          {(!applications || applications.length === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <AppWindow className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen applicaties gevonden</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {applications.map((app) => {
                const appAccessCount = accesses?.filter((a) => a.applicationId === app.id).length || 0;
                return (
                  <Card key={app.id} className="hover-elevate">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <AppWindow className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm" data-testid={`text-app-${app.id}`}>{app.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Shield className="h-3 w-3" />
                              {appAccessCount} {appAccessCount === 1 ? "gebruiker" : "gebruikers"}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {app.url && (
                            <Button size="icon" variant="ghost" asChild>
                              <a href={app.url} target="_blank" rel="noopener noreferrer" data-testid={`link-app-${app.id}`}>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </a>
                            </Button>
                          )}
                          {user?.role === "admin" && (
                            <Button size="icon" variant="ghost" onClick={() => deleteAppMutation.mutate(app.id)} data-testid={`button-delete-app-${app.id}`}>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {app.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{app.description}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="access" className="mt-4">
          {(!accesses || accesses.length === 0) ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Geen toegangsrechten geconfigureerd</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gebruiker</TableHead>
                        <TableHead>Applicatie</TableHead>
                        <TableHead>Toegangsniveau</TableHead>
                        {user?.role === "admin" && <TableHead className="w-12"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accesses.map((access) => (
                        <TableRow key={access.id} data-testid={`row-access-${access.id}`}>
                          <TableCell className="font-medium text-sm">
                            {(access as any).userName || "Gebruiker"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {(access as any).appName || "Applicatie"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {accessLevelLabels[access.accessLevel] || access.accessLevel}
                            </Badge>
                          </TableCell>
                          {user?.role === "admin" && (
                            <TableCell>
                              <Button size="icon" variant="ghost" onClick={() => revokeAccessMutation.mutate(access.id)} data-testid={`button-revoke-access-${access.id}`}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
