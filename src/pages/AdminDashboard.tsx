import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AccessRecord, adminApi, CompetitionRegistration, ContentItem, ContentType, MediaItem } from "@/lib/cms";
import SimpleContent from "@/components/SimpleContent";
import BookVideoEditor from "@/components/BookVideoEditor";
import { normalizeVideoMetadata } from "../../shared/book-videos.js";

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
  { value: "competition", label: "Lomba" },
];

type ContentFormat = "plain" | "html";
type EditorView = "visual" | "write" | "preview";

const typeHelp: Record<ContentType, string> = {
  book: "Buku otomatis muncul di section Best Seller dan halaman detail. Harga dipakai checkout.",
  article: "Tulisan muncul di halaman Berita/Tulisan. Isi body bisa plain text atau HTML sederhana.",
  grasp_asset: "Asset premium untuk halaman Grasp. Isi File URL dengan link PDF/gambar/video.",
  premium_product: "Produk digital premium. Untuk checkout custom masih perlu wiring jika tipe produk baru.",
  merchandise: "Baju/merchandise. Saat ini homepage menampilkan item pertama sebagai produk baju utama.",
  competition: "Lomba tampil di /lomba. Harga dipakai server untuk QRIS.",
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
  const [registrations,setRegistrations]=useState<CompetitionRegistration[]>([]);
  const [registrationSearch,setRegistrationSearch]=useState("");
  const [selectedType, setSelectedType] = useState<ContentType>("book");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContentItem["status"]>("all");
  const [formItem, setFormItem] = useState<ContentItem>(emptyItem);
  const [metadataText, setMetadataText] = useState("{}");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [contentFormat, setContentFormat] = useState<ContentFormat>("plain");
  const [editorView, setEditorView] = useState<EditorView>("write");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualOrderId, setManualOrderId] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaSearch, setMediaSearch] = useState("");
  const visualEditorRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesType = item.type === selectedType;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const searchText = `${item.title} ${item.slug} ${item.description}`.toLowerCase();
    const matchesSearch = !searchQuery || searchText.includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  }), [items, searchQuery, selectedType, statusFilter]);
  const publishedCount = useMemo(() => items.filter((item) => item.status === "published").length, [items]);
  const draftCount = useMemo(() => items.filter((item) => item.status === "draft").length, [items]);

  const loadAll = async () => {
    const [me, content, transactionData, auditData, mediaData, registrationData] = await Promise.all([
      adminApi.me(),
      adminApi.listContent(),
      adminApi.transactions(),
      adminApi.auditLogs(),
      adminApi.media(),
      adminApi.competitionRegistrations(),
    ]);
    setAdminEmail(me.admin.email);
    setItems(content.items);
    setTransactions(transactionData.transactions);
    setLogs(auditData.logs);
    setMedia(mediaData.media);
    setRegistrations(registrationData.registrations);
  };

  useEffect(() => {
    loadAll().catch(() => navigate("/admin/login"));
  }, [navigate]);

  const resetForm = (type = selectedType) => {
    setSaveError("");
    setFormItem({ ...emptyItem, type });
    setMetadataText("{}");
    setContentFormat("plain");
    setEditorView("visual");
    setShowAdvanced(false);
  };

  const editItem = (item: ContentItem) => {
    setSaveError("");
    setFormItem(item);
    setSelectedType(item.type);
    setMetadataText(JSON.stringify(item.metadata || {}, null, 2));
    setContentFormat(String(item.metadata?.contentFormat || item.metadata?.editorMode || "plain") === "html" ? "html" : "plain");
    setEditorView(String(item.metadata?.contentFormat || item.metadata?.editorMode || "plain") === "html" ? "visual" : "write");
  };

  const updateMetadata = (key: string, value: unknown) => {
    try {
      const current = JSON.parse(metadataText || "{}");
      if (!current || typeof current !== "object" || Array.isArray(current)) throw new Error();
      const next = { ...current, [key]: value };
      setMetadataText(JSON.stringify(next, null, 2));
    } catch {
      setSaveError("Metadata JSON tidak valid. Perbaiki Advanced JSON; data editor tidak dihapus.");
    }
  };

  const metadataValue = (key: string) => {
    try {
      const metadata = JSON.parse(metadataText || "{}");
      return metadata[key] ?? "";
    } catch {
      return "";
    }
  };

  const insertSnippet = (plainSnippet: string, htmlSnippet: string) => {
    const snippet = contentFormat === "html" ? htmlSnippet : plainSnippet;
    setFormItem((item) => ({ ...item, description: `${item.description}${item.description ? "\n\n" : ""}${snippet}` }));
  };

  const runEditorCommand = (command: string, value?: string) => {
    setContentFormat("html");
    updateMetadata("contentFormat", "html");
    updateMetadata("editorMode", "html");
    visualEditorRef.current?.focus();
    document.execCommand(command, false, value);
    if (visualEditorRef.current) {
      setFormItem((item) => ({ ...item, description: visualEditorRef.current?.innerHTML || item.description }));
    }
  };

  const promptLink = () => {
    const url = window.prompt("Masukkan URL link");
    if (url) runEditorCommand("createLink", url);
  };

  const promptImage = () => {
    const url = window.prompt("Masukkan URL gambar");
    if (url) runEditorCommand("insertImage", url);
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const metadata = {
        ...normalizeVideoMetadata(metadataText || "{}"),
        contentFormat,
        editorMode: contentFormat,
        shortDescription: metadataValue("shortDescription") || clampExcerpt(formItem.description),
      };
      const result = await adminApi.saveContent({ ...formItem, metadata });
      if (result.seo?.ok === false) toast.warning(result.seo.message);
      else toast.success("Konten tersimpan");
      editItem(result.item);
      await loadAll().catch(() => toast.error("Konten tersimpan, tetapi daftar gagal dimuat ulang. Muat ulang halaman untuk memperbarui daftar."));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal simpan konten";
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const archiveItem = async (item: ContentItem) => {
    if (!item.id || !window.confirm(`Archive ${item.title}?`)) return;
    const result = await adminApi.archiveContent(item.id);
    if (result.seo?.ok === false) toast.warning(result.seo.message);
    else toast.success("Konten diarsipkan");
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

  const uploadFile = async (file: File, target: "image" | "file" = "image") => {
    setUploading(true);
    try {
      const result = await adminApi.uploadFile(file);
      if (target === "image") {
        setFormItem((item) => ({ ...item, imageUrl: result.upload.url }));
      } else {
        setFormItem((item) => ({ ...item, fileUrl: result.upload.url }));
      }
      setUploadUrl(result.upload.url);
      toast.success("File berhasil diupload");
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (item: MediaItem) => {
    if (item.usedBy.length || !window.confirm(`Hapus ${item.title} dari R2? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await adminApi.deleteMedia(item.id);
      toast.success("Media dihapus");
      await loadAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus media");
    }
  };

  const logout = async () => {
    await adminApi.logout();
    navigate("/admin/login");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff8ef] px-4 py-6 text-[#2b2118] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#ff8db3]/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-40 h-96 w-96 rounded-full bg-[#ffd36e]/35 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-80 w-80 rounded-full bg-[#7dd3fc]/25 blur-3xl" />
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-[#2b2118] bg-[#fffdf8]/90 shadow-[10px_10px_0_#2b2118] backdrop-blur">
          <div className="absolute right-8 top-8 hidden rotate-6 rounded-full border-2 border-[#2b2118] bg-[#ffd36e] px-5 py-2 text-sm font-black uppercase tracking-widest text-[#2b2118] md:block">Studio OS</div>
          <div className="flex flex-col gap-5 border-b-2 border-[#2b2118] bg-[linear-gradient(135deg,#ff8db3,#ffd36e_48%,#93e7d4)] px-6 py-8 text-[#2b2118] lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[#2b2118]/70">Nala Studio Control Room</p>
              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">Content Playground</h1>
              <p className="max-w-2xl text-base font-semibold text-[#2b2118]/75">Kelola buku, tulisan, premium asset, dan baju seperti meja kerja kreatif—lebih studio, bukan panel admin template.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-3xl border-2 border-[#2b2118] bg-white/70 px-4 py-3 text-sm shadow-[4px_4px_0_#2b2118] backdrop-blur">
                <p className="text-[#2b2118]/60">Login sebagai</p>
                <p className="font-semibold">{adminEmail}</p>
              </div>
              <Button className="rounded-full border-2 border-[#2b2118] bg-[#2b2118] text-white hover:bg-[#2b2118]/90" onClick={logout}>Logout</Button>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.75rem] border-2 border-[#2b2118] bg-white p-5 shadow-[5px_5px_0_#2b2118]"><p className="text-sm font-bold text-[#2b2118]/60">Total Konten</p><p className="mt-2 text-4xl font-black">{items.length}</p></div>
            <div className="rounded-[1.75rem] border-2 border-[#2b2118] bg-[#b7f7d1] p-5 shadow-[5px_5px_0_#2b2118]"><p className="text-sm font-bold text-[#2b2118]/60">Published</p><p className="mt-2 text-4xl font-black">{publishedCount}</p></div>
            <div className="rounded-[1.75rem] border-2 border-[#2b2118] bg-[#ffe29a] p-5 shadow-[5px_5px_0_#2b2118]"><p className="text-sm font-bold text-[#2b2118]/60">Draft</p><p className="mt-2 text-4xl font-black">{draftCount}</p></div>
            <div className="rounded-[1.75rem] border-2 border-[#2b2118] bg-[#ffc1d6] p-5 shadow-[5px_5px_0_#2b2118]"><p className="text-sm font-bold text-[#2b2118]/60">Premium Codes</p><p className="mt-2 text-4xl font-black">{transactions.length}</p></div>
          </div>
        </div>

        <Tabs defaultValue="content">
          <TabsList className="sticky top-3 z-10 flex h-auto flex-wrap justify-start rounded-full border-2 border-[#2b2118] bg-white/90 p-2 shadow-[6px_6px_0_#2b2118] backdrop-blur">
            <TabsTrigger value="content">Konten</TabsTrigger>
            <TabsTrigger value="access">Premium Access</TabsTrigger>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
            <TabsTrigger value="competitions">Peserta Lomba</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6 grid gap-6 xl:grid-cols-[minmax(460px,560px)_1fr]">
            <Card className="overflow-hidden rounded-[2rem] border-2 border-[#2b2118] bg-[#fffdf8] shadow-[8px_8px_0_#2b2118]">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{formItem.id ? "Edit" : "Tambah"} Konten</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Isi field utama saja. Bagian teknis disimpan otomatis.</p>
                  </div>
                  <span className="rounded-full border-2 border-[#2b2118] bg-[#ffd36e] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#2b2118]">Editor</span>
                </div>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={saveItem}>
                  <fieldset disabled={saving} className="min-w-0 space-y-4">
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
                        <Button type="button" size="sm" variant={editorView === "visual" ? "default" : "outline"} onClick={() => { setEditorView("visual"); setContentFormat("html"); updateMetadata("contentFormat", "html"); updateMetadata("editorMode", "html"); }}>Visual</Button>
                        <Button type="button" size="sm" variant={editorView === "write" && contentFormat === "plain" ? "default" : "outline"} onClick={() => { setEditorView("write"); setContentFormat("plain"); updateMetadata("contentFormat", "plain"); updateMetadata("editorMode", "plain"); }}>Plain</Button>
                        <Button type="button" size="sm" variant={editorView === "write" && contentFormat === "html" ? "default" : "outline"} onClick={() => { setEditorView("write"); setContentFormat("html"); updateMetadata("contentFormat", "html"); updateMetadata("editorMode", "html"); }}>HTML</Button>
                        <Button type="button" size="sm" variant={editorView === "preview" ? "secondary" : "outline"} onClick={() => setEditorView("preview")}>Preview</Button>
                      </div>
                    </div>
                    {editorView === "visual" ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                          <Button type="button" size="sm" variant="secondary" onClick={() => runEditorCommand("formatBlock", "h2")}>H2</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => runEditorCommand("formatBlock", "h3")}>H3</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => runEditorCommand("bold")}>Bold</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => runEditorCommand("italic")}>Italic</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => runEditorCommand("underline")}>Underline</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => runEditorCommand("insertUnorderedList")}>Bullet</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => runEditorCommand("insertOrderedList")}>Number</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={promptLink}>Link</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={promptImage}>Image</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => runEditorCommand("removeFormat")}>Clear</Button>
                        </div>
                        <div
                          ref={visualEditorRef}
                          contentEditable
                          suppressContentEditableWarning
                          className="min-h-72 rounded-xl border bg-white p-5 font-serif text-base leading-8 shadow-inner outline-none focus:ring-2 focus:ring-primary/40"
                          dangerouslySetInnerHTML={{ __html: formItem.description }}
                          onInput={(event) => setFormItem({ ...formItem, description: event.currentTarget.innerHTML })}
                        />
                      </>
                    ) : editorView === "write" ? (
                      <>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertSnippet("**Subjudul**", "<h3>Subjudul</h3>")}>Subjudul</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertSnippet("**Teks tebal**", "<strong>Teks tebal</strong>")}>Bold</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertSnippet("- Poin pertama\n- Poin kedua", "<ul><li>Poin pertama</li><li>Poin kedua</li></ul>")}>Bullet</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertSnippet("1. Langkah pertama\n2. Langkah kedua", "<ol><li>Langkah pertama</li><li>Langkah kedua</li></ol>")}>Number</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertSnippet("> Catatan penting", "<blockquote>Catatan penting</blockquote>")}>Quote</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertSnippet("[Teks link](https://contoh.com)", '<a href="https://contoh.com" target="_blank" rel="noreferrer">Teks link</a>')}>Link</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertSnippet("---", "<hr />")}>Divider</Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => insertSnippet("![Alt gambar](https://contoh.com/gambar.jpg)", '<img src="https://contoh.com/gambar.jpg" alt="Alt gambar" />')}>Image</Button>
                        </div>
                        <Textarea className="min-h-64 font-serif text-base leading-7" value={formItem.description} onChange={(event) => setFormItem({ ...formItem, description: event.target.value })} placeholder={contentFormat === "html" ? "<p>Tulis konten HTML di sini...</p>" : "Tulis konten seperti artikel biasa. Pisahkan paragraf dengan enter dua kali."} />
                      </>
                    ) : (
                      <SimpleContent content={formItem.description} className="prose max-w-none rounded-xl bg-white p-4 text-sm leading-7 shadow-inner" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Harga</Label><Input type="number" value={formItem.price ?? ""} onChange={(event) => setFormItem({ ...formItem, price: event.target.value ? Number(event.target.value) : null })} placeholder="85000" /></div>
                    <div className="space-y-2"><Label>Urutan</Label><Input type="number" value={formItem.sortOrder} onChange={(event) => setFormItem({ ...formItem, sortOrder: Number(event.target.value) })} /></div>
                  </div>
                  <div className="space-y-2 rounded-2xl border p-3">
                    <Label>Gambar cover</Label>
                    <Input value={formItem.imageUrl || ""} onChange={(event) => setFormItem({ ...formItem, imageUrl: event.target.value })} placeholder="https://...jpg" />
                    <Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0], "image")} />
                    {uploading ? <p className="text-sm font-medium text-primary">Mengupload dan mengoptimalkan gambar…</p> : null}
                    {formItem.imageUrl ? <img src={formItem.imageUrl} alt="Preview cover" className="max-h-52 rounded-xl border object-contain" /> : null}
                    <p className="text-xs text-muted-foreground">Upload akan masuk ke Cloudflare R2 jika env R2 aktif; paste URL manual juga bisa.</p>
                  </div>
                  <div className="space-y-2 rounded-2xl border p-3">
                    <Label>File / PDF / Video</Label>
                    <Input value={formItem.fileUrl || ""} onChange={(event) => setFormItem({ ...formItem, fileUrl: event.target.value })} placeholder="Kosongkan jika tidak ada" />
                    <Input type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4" disabled={uploading} onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0], "file")} />
                    <p className="text-xs text-muted-foreground">Cocok untuk PDF premium, swatch, atau gambar tambahan. Maks 10MB.</p>
                  </div>

                  {formItem.type === "book" ? (
                    <BookVideoEditor metadataText={metadataText} onChange={setMetadataText} />
                  ) : null}

                  {formItem.type === "book" ? (
                    <div className="space-y-2"><Label>Warna kartu buku</Label><Select value={String(metadataValue("gradient") || "gradient-pink")} onValueChange={(value) => updateMetadata("gradient", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gradient-pink">Pink Kuning</SelectItem><SelectItem value="gradient-pink-blue">Pink Biru</SelectItem><SelectItem value="gradient-blue">Biru</SelectItem></SelectContent></Select></div>
                  ) : null}

                  {formItem.type === "article" ? (
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border p-3"><div className="space-y-2"><Label>Tanggal tampil</Label><Input value={String(metadataValue("displayDate") || "")} onChange={(event) => updateMetadata("displayDate", event.target.value)} placeholder="1 Juli 2026" /></div><div className="space-y-2"><Label>Lokasi</Label><Input value={String(metadataValue("location") || "")} onChange={(event) => updateMetadata("location", event.target.value)} placeholder="Jakarta" /></div></div>
                  ) : null}

                  {formItem.type === "merchandise" ? (
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border p-3"><div className="space-y-2"><Label>Harga anak</Label><Input type="number" value={String(metadataValue("priceAnak") || "")} onChange={(event) => updateMetadata("priceAnak", Number(event.target.value || 0))} /></div><div className="space-y-2"><Label>Harga dewasa</Label><Input type="number" value={String(metadataValue("priceDewasa") || "")} onChange={(event) => updateMetadata("priceDewasa", Number(event.target.value || 0))} /></div></div>
                  ) : null}

                  {formItem.type === "competition" ? (
                    <div className="grid grid-cols-2 gap-3 rounded-2xl border p-3">
                      <div className="space-y-2"><Label>Tanggal acara</Label><Input type="datetime-local" value={String(metadataValue("eventDate") || "")} onChange={(event) => updateMetadata("eventDate", event.target.value)} /></div>
                      <div className="space-y-2"><Label>Tutup pendaftaran</Label><Input type="datetime-local" value={String(metadataValue("registrationClose") || "")} onChange={(event) => updateMetadata("registrationClose", event.target.value)} /></div>
                      <div className="space-y-2"><Label>Lokasi</Label><Input value={String(metadataValue("location") || "")} onChange={(event) => updateMetadata("location", event.target.value)} /></div>
                      <div className="space-y-2"><Label>Kuota</Label><Input type="number" min="1" value={String(metadataValue("quota") || "")} onChange={(event) => updateMetadata("quota", Number(event.target.value || 0))} /></div>
                      <div className="space-y-2"><Label>Kepemilikan buku</Label><Select value={String(metadataValue("bookRequirement") || "none")} onValueChange={(value) => updateMetadata("bookRequirement", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Tidak ditanyakan</SelectItem><SelectItem value="optional">Opsional</SelectItem><SelectItem value="required">Wajib</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>Link beli buku</Label><Input type="url" value={String(metadataValue("bookPurchaseUrl") || "")} onChange={(event) => updateMetadata("bookPurchaseUrl", event.target.value)} placeholder="https://artstudionala.com/buku/..." /></div>
                    </div>
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

                  {saveError ? <p role="alert" className="rounded-xl border border-destructive bg-destructive/5 p-3 text-sm text-destructive">{saveError} Data editor tetap tersedia.</p> : null}
                  <div className="flex gap-2"><Button type="submit" className="flex-1">{saving ? "Menyimpan…" : "Simpan Konten"}</Button><Button type="button" variant="outline" onClick={() => resetForm()}>Reset</Button></div>
                  </fieldset>
                </form>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[2rem] border-2 border-[#2b2118] bg-[#fffdf8] shadow-[8px_8px_0_#2b2118]">
              <CardHeader className="border-b-2 border-[#2b2118] bg-[#93e7d4]/40">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <CardTitle className="text-2xl">Daftar Konten</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Pilih jenis konten, lalu edit kartu yang ingin diubah.</p>
                  </div>
                <Select value={selectedType} onValueChange={(value: ContentType) => { setSelectedType(value); resetForm(value); }}>
                  <SelectTrigger className="max-w-xs rounded-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{contentTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                </Select>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((item) => (
                  <div key={item.id} className="group flex min-h-56 flex-col justify-between rounded-[1.75rem] border-2 border-[#2b2118] bg-white p-5 shadow-[5px_5px_0_#2b2118] transition hover:-translate-y-1 hover:rotate-[-0.5deg] hover:shadow-[8px_8px_0_#2b2118]">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "published" ? "bg-emerald-100 text-emerald-700" : item.status === "draft" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>{item.status}</span>
                        <span className="text-xs text-muted-foreground">#{item.sortOrder}</span>
                      </div>
                      <div>
                        <h3 className="line-clamp-2 text-lg font-black leading-tight text-foreground group-hover:text-primary">{item.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">/{item.slug}</p>
                      </div>
                      <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">{item.metadata?.shortDescription ? String(item.metadata.shortDescription) : item.description}</p>
                    </div>
                    <div className="mt-4 flex gap-2 border-t pt-4"><Button size="sm" className="flex-1" onClick={() => editItem(item)}>Edit</Button><Button size="sm" variant="outline" onClick={() => archiveItem(item)}>Archive</Button></div>
                  </div>
                ))}
                {visibleItems.length === 0 ? <div className="col-span-full rounded-3xl border border-dashed p-10 text-center text-muted-foreground">Belum ada konten untuk kategori ini.</div> : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <Card><CardHeader><CardTitle>Generate Kode Manual</CardTitle></CardHeader><CardContent className="flex gap-2"><Input placeholder="Order ID" value={manualOrderId} onChange={(event) => setManualOrderId(event.target.value)} /><Button onClick={generateCode}>Generate</Button></CardContent></Card>
            <Card><CardHeader><CardTitle>Premium Access Codes</CardTitle></CardHeader><CardContent className="space-y-3">{transactions.map((record) => <div key={`${record.transactionId}-${record.code}`} className="rounded-xl border p-3 text-sm"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><b>{record.code}</b> · {record.orderId} · {record.customer?.email || "no email"}{record.revokedAt ? <span className="ml-2 text-destructive">revoked</span> : null}</div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => adminApi.restoreCode(record.code).then(loadAll)}>Restore</Button><Button size="sm" variant="destructive" onClick={() => adminApi.revokeCode(record.code, "Admin revoke").then(loadAll)}>Revoke</Button></div></div></div>)}</CardContent></Card>
          </TabsContent>

          <TabsContent value="uploads" className="space-y-4">
            <Card><CardHeader><CardTitle>Upload / Asset Library</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Upload ke Cloudflare R2. Local fallback hanya tersedia saat development.</p><div className="space-y-3 rounded-2xl border p-4"><Label>Upload file</Label><Input type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4" disabled={uploading} onChange={(event) => event.target.files?.[0] && uploadFile(event.target.files[0], "file")} />{uploading ? <p className="text-sm font-medium text-primary">Mengupload dan mengoptimalkan…</p> : null}<p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF, PDF, MP4. Maks 10MB.</p></div><div className="flex gap-2"><Input placeholder="https://..." value={uploadUrl} onChange={(event) => setUploadUrl(event.target.value)} /><Button onClick={registerUpload}>Catat URL</Button></div></CardContent></Card>
            <Card><CardHeader><CardTitle>Media R2</CardTitle></CardHeader><CardContent className="space-y-4"><Input placeholder="Cari nama atau URL…" value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{media.filter((item) => `${item.title} ${item.url}`.toLowerCase().includes(mediaSearch.toLowerCase())).map((item) => <div key={item.id} className="space-y-3 rounded-2xl border p-3">{item.type.startsWith("image/") ? <img src={item.url} alt={item.title} className="h-36 w-full rounded-xl object-cover" /> : <div className="flex h-36 items-center justify-center rounded-xl bg-muted text-sm">{item.type}</div>}<div><p className="truncate font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">{item.size ? `${Math.ceil(item.size / 1024)} KB` : "Ukuran tidak tersedia"}</p></div>{item.usedBy.length ? <p className="text-xs text-amber-700">Dipakai: {item.usedBy.map((ref) => ref.title).join(", ")}</p> : <p className="text-xs text-emerald-700">Tidak digunakan</p>}<div className="flex gap-2"><Button size="sm" variant="outline" className="flex-1" onClick={() => navigator.clipboard.writeText(item.url).then(() => toast.success("URL disalin"))}>Copy URL</Button><Button size="sm" variant="destructive" disabled={Boolean(item.usedBy.length)} onClick={() => deleteMedia(item)}>Hapus</Button></div></div>)}</div>{media.length === 0 ? <p className="text-center text-sm text-muted-foreground">Belum ada upload CMS yang tercatat.</p> : null}</CardContent></Card>
          </TabsContent>

          <TabsContent value="audit"><Card><CardHeader><CardTitle>Audit Log</CardTitle></CardHeader><CardContent className="space-y-2">{logs.map((log) => <pre key={String(log.id)} className="overflow-auto rounded-xl bg-muted p-3 text-xs">{JSON.stringify(log, null, 2)}</pre>)}</CardContent></Card></TabsContent>
          <TabsContent value="competitions"><Card><CardHeader><CardTitle>Peserta Lomba</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex gap-2"><Input placeholder="Cari peserta, kode, WA, lomba…" value={registrationSearch} onChange={e=>setRegistrationSearch(e.target.value)}/><Button asChild><a href={`${import.meta.env.VITE_API_URL||''}/api/admin/competition-registrations.csv`}>Export CSV</a></Button></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th>Kode</th><th>Peserta</th><th>Lomba</th><th>WA</th><th>Bayar</th><th>Hadir</th></tr></thead><tbody>{registrations.filter(r=>JSON.stringify(r).toLowerCase().includes(registrationSearch.toLowerCase())).map(r=><tr key={r.id} className="border-t"><td>{r.registrationCode}</td><td>{r.participantName}<br/><small>{r.parentName}</small></td><td>{r.competitionTitle}</td><td>{r.whatsapp}</td><td>{r.paymentStatus}{r.bookProofUrl?<><br/><a className="underline" href={r.bookProofUrl} target="_blank" rel="noreferrer">Lihat foto buku</a></>:null}</td><td>{r.checkedInAt?'Sudah':<Button size="sm" disabled={r.paymentStatus!=='paid'} onClick={()=>adminApi.checkInCompetition(r.id).then(loadAll)}>Check-in</Button>}</td></tr>)}</tbody></table></div></CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default AdminDashboard;
