import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookVideo, MAX_BOOK_VIDEOS, MAX_VIDEO_TITLE, MAX_VIDEO_URL } from "../../shared/book-videos.js";

const BookVideoEditor = ({ metadataText, onChange }: { metadataText: string; onChange: (text: string) => void }) => {
  let metadata: Record<string, unknown>;
  let videos: BookVideo[];
  try {
    metadata = JSON.parse(metadataText || "{}");
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error();
    const rows = metadata.videos === undefined ? [] : metadata.videos;
    if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== "object" || typeof row.url !== "string" || typeof row.title !== "string")) throw new Error();
    videos = rows;
  } catch {
    return <p role="alert" className="rounded-xl border border-destructive p-3 text-sm text-destructive">Video belum bisa diedit: perbaiki Advanced JSON agar metadata berupa objek dan videos berupa daftar {"{url, title}"}. Data asli tetap tersimpan di editor.</p>;
  }
  const update = (next: BookVideo[]) => onChange(JSON.stringify({ ...metadata, videos: next }, null, 2));
  const move = (index: number, direction: number) => {
    const next = [...videos];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    update(next);
  };
  return (
    <section aria-labelledby="book-videos-label" className="space-y-3 rounded-2xl border-2 border-primary/20 bg-pink-50/50 p-3">
      <h3 id="book-videos-label" className="font-semibold">Video YouTube Buku</h3>
      <p className="text-xs text-muted-foreground">Video pertama menjadi video utama di beranda. Maksimal {MAX_BOOK_VIDEOS} video; URL duplikat digabung saat disimpan. Hapus semua baris untuk menyembunyikan video.</p>
      {videos.map((video, index) => (
        <div key={index} className="min-w-0 space-y-2 rounded-xl border bg-background p-3">
          <p className="text-sm font-semibold">Video {index + 1}{index === 0 ? " · Utama" : ""}</p>
          <Label htmlFor={`video-title-${index}`}>Judul video</Label>
          <Input id={`video-title-${index}`} value={video.title} maxLength={MAX_VIDEO_TITLE} placeholder="Contoh: Intip isi buku" onChange={(event) => update(videos.map((row, i) => i === index ? { ...row, title: event.target.value } : row))} />
          <Label htmlFor={`video-url-${index}`}>URL YouTube</Label>
          <Input id={`video-url-${index}`} value={video.url} maxLength={MAX_VIDEO_URL} inputMode="url" placeholder="https://www.youtube.com/shorts/..." onChange={(event) => update(videos.map((row, i) => i === index ? { ...row, url: event.target.value } : row))} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" aria-label={`Naikkan video ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}>↑ Naik</Button>
            <Button type="button" size="sm" variant="outline" aria-label={`Turunkan video ${index + 1}`} disabled={index === videos.length - 1} onClick={() => move(index, 1)}>↓ Turun</Button>
            <Button type="button" size="sm" variant="outline" aria-label={`Hapus video ${index + 1}`} onClick={() => update(videos.filter((_, i) => i !== index))}>Hapus</Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" disabled={videos.length >= MAX_BOOK_VIDEOS} onClick={() => update([...videos, { url: "", title: "" }])}>+ Tambah video</Button>
    </section>
  );
};

export default BookVideoEditor;
