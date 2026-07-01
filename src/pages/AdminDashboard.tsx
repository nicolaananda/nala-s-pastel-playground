import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AccessRecord, adminApi, ContentItem, ContentType } from "@/lib/cms";

const emptyItem: ContentItem = {
  type: "book",
  slug: "",
  title: "",
  description: "",
  price: null,
  imageUrl: "",
  fileUrl: "",
  metadata: {},
  status: "draft",
  sortOrder: 0,
};

const contentTypes: Array<{ value: ContentType; label: string }> = [
  { value: "book", label: "Books" },
  { value: "article", label: "Tulisan" },
  { value: "grasp_asset", label: "Grasp Premium" },
  { value: "premium_product", label: "Premium Product" },
  { value: "merchandise", label: "Baju" },
];

type EditorMode = "plain" | "html" | "preview";

const typeHelp: Record<ContentType, string> = {
  book: "Buku otomatis muncul di section Best Seller dan halaman detail. Harga dipakai checkout.",
  article: "Tulisan muncul di halaman Berita/Tulisan. Isi body bisa plain text atau HTML sederhana.",
  grasp_asset: "Asset premium untuk halaman Grasp. Isi File URL dengan link PDF/gambar/video.",
  premium_product: "Produk digital premium. Untuk checkout custom masih perlu wiring jika tipe produk baru.",
  merchandise: "Baju/merchandise. Saat ini homepage menampilkan item pertama sebagai produk baju utama.",
};

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const clampExcerpt = (value: string) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 240);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminEmail, setAdminEmail] = useState("");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [transactions, setTransactions] = useState<AccessRecord[]>([]);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [selectedType, setSelectedType] = useState<ContentType>("book");
  const [formItem, setFormItem] = useState<ContentItem>(emptyItem);
  const [metadataText, setMetadataText] = useState("{}");
  const [editorMode, setEditorMode] = useState<EditorMode>("plain");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualOrderId, setManualOrderId] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");

  const visibleItems = useMemo(() => items.filter((item) => item.type === selectedType), [items, selectedType]);

  const loadAll = async () => {
    const [me, content, transactionData, auditData] = await Promise.all([
      adminApi.me(),
      adminApi.listContent(),
      adminApi.transactions(),
      adminApi.auditLogs(),
    ]);
    setAdminEmail(me.admin.email);
    setItems(content.items);
    setTransactions(transactionData.transactions);
    setLogs(auditData.logs);
  };

  useEffect(() => {
    loadAll().catch(() => navigate("/admin/login"));
  }, [navigate]);

  const resetForm = (type = selectedType) => {
    setFormItem({ ...emptyItem, type });
    setMetadataText("{}");
    setEditorMode("plain");
    setShowAdvanced(false);
  };

  const editItem = (item: ContentItem) => {
    setFormItem(item);
    setSelectedType(item.type);
    setMetadataText(JSON.stringify(item.metadata || {}, null, 2));
    setEditorMode(String(item.metadata?.editorMode || "plain") === "html" ? "html" : "plain");
  };

  const updateMetadata = (key: string, value: unknown) => {
    const current = JSON.parse(metadataText || "{}");
    const next = { ...current, [key]: value };
    setMetadataText(JSON.stringify(next, null, 2));
  };

  const metadataValue = (key: string) => {
    try {
      const metadata = JSON.parse(metadataText || "{}");
      return metadata[key] ?? "";
    } catch {
      return "";
    }
  };

  const insertMarkup = (before: string, after = "") => {
    setFormItem((item) => ({ ...item, description: `${item.description}${before}${after}` }));
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const metadata = {
        ...JSON.parse(metadataText || "{}"),
        editorMode,
        shortDescription: metadataValue("shortDescription") || clampExcerpt(formItem.description),
      };
      await adminApi.saveContent({ ...formItem, metadata });
      toast.success("Konten tersimpan");
      resetForm(formItem.type);
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal simpan konten");
    }
  };

  const archiveItem = async (item: ContentItem) => {
    if (!item.id || !window.confirm(`Archive ${item.title}?`)) return;
    await adminApi.archiveContent(item.id);
    toast.success("Konten diarsipkan");
    await loadAll();
  };

  const generateCode = async () => {
    if (!manualOrderId) return;
    const result = await adminApi.generateCode(manualOrderId);
    toast.success(`Kode dibuat: ${result.code}`);
    setManualOrderId("");
    await loadAll();
  };

  const registerUpload = async () => {
    if (!uploadUrl) return;
    await adminApi.registerUpload(uploadUrl, "Admin upload URL", "external-url");
    toast.success("URL asset tercatat di audit log");
    setUploadUrl("");
    await loadAll();
  };

  const logout = async () => {
    await adminApi.logout();
    navigate("/admin/login");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/20 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin CMS Nala</h1>
            <p className="text-muted-foreground">Login: {adminEmail}</p>
          </div>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>

        <Tabs defaultValue="content">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="content">Konten</TabsTrigger>
            <TabsTrigger value="access">Premium Access</TabsTrigger>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="grid gap-6 lg:grid-cols-[minmax(420px,520px)_1fr]">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5 shadow-hover">
              <CardHeader>
                <CardTitle>{formItem.id ? "Edit" : "Tambah"} Konten</CardTitle>
                <p className="text-sm text-muted-foreground">Isi field utama saja. Bagian teknis disimpan otomatis.</p>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={saveItem}>
                  <div className="space-y-2">
                    <Label>Jenis konten</Label>
                    <Select value={formItem.type} onValueChange={(value: ContentType) => setFormItem({ ...formItem, type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{contentTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <p className="rounded-xl bg-primary/10 px-3 py-2 text-xs text-muted-foreground">{typeHelp[formItem.type]}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Judul</Label>
                    <Input value={formItem.title} onChange={(event) => setFormItem({ ...formItem, title: event.target.value, slug: formItem.slug || slugify(event.target.value) })} required placeholder="Contoh: Buku Mewarnai Baru" />
                  </div>

                  <div className="space-y-2">
                    <Label>Link slug</Label>
                    <div className="flex gap-2">
                      <Input value={formItem.slug} onChange={(event) => setFormItem({ ...formItem, slug: slugify(event.target.value) })} required placeholder="buku-mewarnai-baru" />
                      <Button type="button" variant="outline" onClick={() => setFormItem({ ...formItem, slug: slugify(formItem.title) })}>Auto</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Deskripsi pendek untuk kartu</Label>
                    <Textarea className="min-h-20" value={String(metadataValue("shortDescription"))} onChange={(event) => updateMetadata("shortDescription", event.target.value)} placeholder="Ringkasan 1-2 kalimat. Ini tampil di homepage/list." />
                  </div>

                  <div className="space-y-2 rounded-2xl border border-primary/20 bg-background/80 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Label>Isi konten</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant={editorMode === "plain" ? "default" : "outline"} onClick={() => { setEditorMode("plain"); updateMetadata("editorMode", "plain"); }}>Plain</Button>
                        <Button type="button" size="sm" variant={editorMode === "html" ? "default" : "outline"} onClick={() => { setEditorMode("html"); updateMetadata("editorMode", "html"); }}>HTML</Button>
                        <Button type="button" size="sm" variant={editorMode === "preview" ? "default" : "outline"} onClick={() => setEditorMode("preview")}>Preview</Button>
                      </div>
                    </div>
                    {editorMode !== "preview" ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertMarkup(editorMode === "html" ? "<h3>Subjudul</h3>" : "\n\n**Subjudul**\n\n")}>Subjudul</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertMarkup(editorMode === "html" ? "<strong>Tebal</strong>" : "**Tebal**")}>Bold</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertMarkup(editorMode === "html" ? "<ul><li>Poin</li></ul>" : "\n- Poin")}>List</Button>
                        </div>
                        <Textarea className="min-h-56 font-serif text-base leading-7" value={formItem.description} onChange={(event) => setFormItem({ ...formItem, description: event.target.value })} placeholder={editorMode === "html" ? "<p>Tulis konten HTML di sini...</p>" : "Tulis konten seperti artikel biasa. Pisahkan paragraf dengan enter dua kali."} />
                      </>
                    ) : (
                      <div className="prose max-w-none rounded-xl bg-white p-4 text-sm leading-7">
                        {editorMode === "preview" && String(metadataValue("editorMode")) === "html" ? <div dangerouslySetInnerHTML={{ __html: formItem.description }} /> : formItem.description.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Harga</Label><Input type="number" value={formItem.price ?? ""} onChange={(event) => setFormItem({ ...formItem, price: event.target.value ? Number(event.target.value) : null })} placeholder="85000" /></div>
                    <div className="space-y-2"><Label>Urutan</Label><Input type="number" value={formItem.sortOrder} onChange={(event) => setFormItem({ ...formItem, sortOrder: Number(event.target.value) })} /></div>
                  </div>
                  <div className="space-y-2"><Label>URL gambar cover</Label><Input value={formItem.imageUrl || ""} onChange={(event) => setFormItem({ ...formItem, imageUrl: event.target.value })} placeholder="https://...jpg" /></div>
                  <div className="space-y-2"><Label>URL file/PDF/video</Label><Input value={formItem.fileUrl || ""} onChange={(event) => setFormItem({ ...formItem, fileUrl: event.target.value })} placeholder="Kosongkan jika tidak ada" /></div>

                  {formItem.type === "book" ? (
                    <div className="space-y-2"><Label>Warna kartu buku</Label><Select value={String(metadataValue("gradient") || "gradient-pink")} onValueChange={(value) => updateMetadata("gradient", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gradient-pink">Pink Kuning</SelectItem><SelectItem value="gradient-pink-blue">Pink Biru</SelectItem><SelectItem value="gradient-blue">Biru</SelectItem></SelectContent></Select></div>
                  ) : null}

                  {formItem.type === "merchandise" ? (
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border p-3"><div className="space-y-2"><Label>Harga anak</Label><Input type="number" value={String(metadataValue("priceAnak") || "")} onChange={(event) => updateMetadata("priceAnak", Number(event.target.value || 0))} /></div><div className="space-y-2"><Label>Harga dewasa</Label><Input type="number" value={String(metadataValue("priceDewasa") || "")} onChange={(event) => updateMetadata("priceDewasa", Number(event.target.value || 0))} /></div></div>
                  ) : null}

                  {formItem.type === "grasp_asset" ? (
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border p-3"><div className="space-y-2"><Label>Group akses</Label><Input value={String(metadataValue("accessGroup") || "grasp-60-color")} onChange={(event) => updateMetadata("accessGroup", event.target.value)} /></div><div className="space-y-2"><Label>Tipe asset</Label><Select value={String(metadataValue("assetType") || "image")} onValueChange={(value) => updateMetadata("assetType", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="image">Image</SelectItem><SelectItem value="pdf">PDF</SelectItem><SelectItem value="video">Video</SelectItem></SelectContent></Select></div></div>
                  ) : null}

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formItem.status} onValueChange={(value: ContentItem["status"]) => setFormItem({ ...formItem, status: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border border-dashed p-3">
                    <Button type="button" variant="ghost" onClick={() => setShowAdvanced(!showAdvanced)}>{showAdvanced ? "Sembunyikan" : "Tampilkan"} Advanced JSON</Button>
                    {showAdvanced ? <div className="mt-3 space-y-2"><Label>Metadata JSON</Label><Textarea className="min-h-40 font-mono text-xs" value={metadataText} onChange={(event) => setMetadataText(event.target.value)} /></div> : null}
                  </div>

                  <div className="flex gap-2"><Button type="submit" className="flex-1">Simpan Konten</Button><Button type="button" variant="outline" onClick={() => resetForm()}>Reset</Button></div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daftar Konten</CardTitle>
                <Select value={selectedType} onValueChange={(value: ContentType) => { setSelectedType(value); resetForm(value); }}>
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{contentTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div><h3 className="font-bold">{item.title}</h3><p className="text-sm text-muted-foreground">/{item.slug} · {item.status} · sort {item.sortOrder}</p></div>
                      <div className="flex gap-2"><Button size="sm" onClick={() => editItem(item)}>Edit</Button><Button size="sm" variant="destructive" onClick={() => archiveItem(item)}>Archive</Button></div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm">{item.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <Card><CardHeader><CardTitle>Generate Kode Manual</CardTitle></CardHeader><CardContent className="flex gap-2"><Input placeholder="Order ID" value={manualOrderId} onChange={(event) => setManualOrderId(event.target.value)} /><Button onClick={generateCode}>Generate</Button></CardContent></Card>
            <Card><CardHeader><CardTitle>Premium Access Codes</CardTitle></CardHeader><CardContent className="space-y-3">{transactions.map((record) => <div key={`${record.transactionId}-${record.code}`} className="rounded-xl border p-3 text-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><b>{record.code}</b> · {record.orderId} · {record.customer?.email || "no email"}{record.revokedAt ? <span className="ml-2 text-destructive">revoked</span> : null}</div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => adminApi.restoreCode(record.code).then(loadAll)}>Restore</Button><Button size="sm" variant="destructive" onClick={() => adminApi.revokeCode(record.code, "Admin revoke").then(loadAll)}>Revoke</Button></div></div></div>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="uploads"><Card><CardHeader><CardTitle>Upload / Asset URL</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">R2 direct upload butuh credential server. Untuk sekarang admin bisa register URL asset eksternal/R2 dan pakai URL itu di konten.</p><div className="flex gap-2"><Input placeholder="https://..." value={uploadUrl} onChange={(event) => setUploadUrl(event.target.value)} /><Button onClick={registerUpload}>Catat URL</Button></div></CardContent></Card></TabsContent>

          <TabsContent value="audit"><Card><CardHeader><CardTitle>Audit Log</CardTitle></CardHeader><CardContent className="space-y-2">{logs.map((log) => <pre key={String(log.id)} className="overflow-auto rounded-xl bg-muted p-3 text-xs">{JSON.stringify(log, null, 2)}</pre>)}</CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default AdminDashboard;
