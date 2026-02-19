import { useState, useRef } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Plus, Megaphone, Pin, Trash2, AlertCircle, Pencil, FileText, Upload, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import type { Announcement } from "@shared/schema";
import { useAuth } from "@/lib/auth";

const announcementFormSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  content: z.string().min(1, "Inhoud is verplicht"),
  priority: z.string().default("normal"),
  pinned: z.boolean().default(false),
});

function AnnouncementFormDialog({
  open,
  onOpenChange,
  editAnn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editAnn?: Announcement | null;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfRemoved, setPdfRemoved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const existingPdf = !pdfRemoved && !pdfFile ? (editAnn?.pdfUrl || null) : null;

  const form = useForm<z.infer<typeof announcementFormSchema>>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: editAnn?.title || "",
      content: editAnn?.content || "",
      priority: editAnn?.priority || "normal",
      pinned: editAnn?.pinned || false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof announcementFormSchema>) => {
      let pdfUrl: string | null = existingPdf;

      if (pdfFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        const uploadRes = await fetch("/api/upload/pdf", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!uploadRes.ok) {
          throw new Error("PDF upload mislukt");
        }
        const uploadData = await uploadRes.json();
        pdfUrl = uploadData.pdfUrl;
        setUploading(false);
      }

      const payload = { ...data, pdfUrl };

      if (editAnn) {
        await apiRequest("PATCH", `/api/announcements/${editAnn.id}`, payload);
      } else {
        await apiRequest("POST", "/api/announcements", {
          ...payload,
          createdBy: user?.id || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: editAnn ? "Aankondiging bijgewerkt" : "Aankondiging geplaatst" });
      onOpenChange(false);
      form.reset();
      setPdfFile(null);
      setPdfRemoved(false);
    },
    onError: () => {
      setUploading(false);
      toast({ title: "Fout bij opslaan", variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ title: "Alleen PDF-bestanden zijn toegestaan", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Bestand is te groot (max 10 MB)", variant: "destructive" });
        return;
      }
      setPdfFile(file);
      setPdfRemoved(false);
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) {
        setPdfFile(null);
        setPdfRemoved(false);
      }
      onOpenChange(o);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editAnn ? "Aankondiging Bewerken" : "Nieuwe Aankondiging"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Titel</FormLabel>
                <FormControl><Input {...field} data-testid="input-announcement-title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Inhoud</FormLabel>
                <FormControl><Textarea {...field} rows={4} data-testid="input-announcement-content" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem>
                <FormLabel>Prioriteit</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-announcement-priority"><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Laag</SelectItem>
                    <SelectItem value="normal">Normaal</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">Hoog</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="pinned" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormLabel className="mt-0">Vastzetten</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-announcement-pinned" />
                </FormControl>
              </FormItem>
            )} />

            <div>
              <p className="text-sm font-medium mb-2">PDF-bijlage</p>
              {pdfFile ? (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{pdfFile.name}</span>
                  <Button type="button" size="icon" variant="ghost" onClick={removePdf} data-testid="button-remove-pdf">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : existingPdf ? (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">Bestaand PDF-bestand</span>
                  <Button type="button" size="icon" variant="ghost" onClick={removePdf} data-testid="button-remove-pdf">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-pdf"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  PDF uploaden
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-pdf-file"
              />
              <p className="text-xs text-muted-foreground mt-1">Max 10 MB, alleen PDF-bestanden</p>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending || uploading} data-testid="button-submit-announcement">
              {uploading ? "PDF uploaden..." : mutation.isPending ? "Opslaan..." : editAnn ? "Bijwerken" : "Aankondiging Plaatsen"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AankondigingenPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editAnn, setEditAnn] = useState<Announcement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Aankondiging verwijderd" });
    },
  });

  const sorted = [...(announcements || [])].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-announcements-title">Aankondigingen</h1>
          <p className="text-muted-foreground text-sm">Belangrijke mededelingen voor het team</p>
        </div>
        {(user?.role === "admin" || user?.role === "manager") && (
          <Button onClick={() => setCreateOpen(true)} data-testid="button-add-announcement">
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Aankondiging
          </Button>
        )}
      </div>

      <AnnouncementFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editAnn && (
        <AnnouncementFormDialog open={!!editAnn} onOpenChange={(open) => { if (!open) setEditAnn(null); }} editAnn={editAnn} />
      )}

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Geen aankondigingen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {sorted.map((ann) => (
            <Card key={ann.id} className={ann.pinned ? "border-primary/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${
                    ann.priority === "high"
                      ? "bg-destructive/10 text-destructive"
                      : ann.priority === "medium"
                      ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {ann.priority === "high" ? <AlertCircle className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm" data-testid={`text-announcement-${ann.id}`}>{ann.title}</h3>
                      {ann.pinned && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Pin className="h-3 w-3" /> Vastgezet
                        </Badge>
                      )}
                      <Badge variant={ann.priority === "high" ? "destructive" : "outline"} className="text-xs">
                        {ann.priority === "high" ? "Hoog" : ann.priority === "medium" ? "Medium" : ann.priority === "low" ? "Laag" : "Normaal"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{ann.content}</p>
                    {ann.pdfUrl && (
                      <a
                        href={ann.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary hover:underline"
                        data-testid={`link-pdf-${ann.id}`}
                      >
                        <FileText className="h-4 w-4" />
                        PDF-bijlage bekijken
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(ann.createdAt), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                    </p>
                  </div>
                  {(user?.role === "admin" || user?.role === "manager") && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditAnn(ann)} data-testid={`button-edit-announcement-${ann.id}`}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(ann.id)} data-testid={`button-delete-announcement-${ann.id}`}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
