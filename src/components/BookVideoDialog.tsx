import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookVideo, parseYouTubeUrl } from "../../shared/book-videos.js";

export type SelectedBookVideo = { video: BookVideo; slug: string; bookTitle: string; trigger: HTMLButtonElement };

const BookVideoDialog = ({ selected, onClose }: { selected: SelectedBookVideo | null; onClose: () => void }) => {
  const parsed = selected ? parseYouTubeUrl(selected.video.url) : null;
  return (
    <Dialog open={!!selected} onOpenChange={(open) => { if (!open) onClose(); }}>
      {selected && parsed && (
        <DialogContent
          className="h-auto max-h-[calc(100svh_-_2rem)] overflow-y-auto w-[calc(100%_-_2rem)] max-w-xl rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-background to-pink-50 p-4 sm:p-6"
          onCloseAutoFocus={(event) => { event.preventDefault(); selected.trigger.focus(); }}
        >
          <DialogHeader className="pr-7 text-left">
            <DialogTitle className="break-words leading-snug">{selected.video.title}</DialogTitle>
            <DialogDescription className="break-words">{selected.bookTitle} · Video dimuat dari YouTube setelah Anda membuka dialog ini.</DialogDescription>
          </DialogHeader>
          <div className={parsed.isShort ? "mx-auto aspect-[9/16] w-full max-w-[min(340px,34svh)] overflow-hidden rounded-xl bg-black" : "aspect-video w-full overflow-hidden rounded-xl bg-black"}>
            <iframe
              key={parsed.videoId}
              src={`https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=0&rel=0&playsinline=1`}
              title={selected.video.title}
              className="h-full w-full border-0"
              allow="encrypted-media; fullscreen; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">Video tidak tersedia atau tidak bisa diputar? Buka langsung di YouTube.</p>
          <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-col gap-2 border-t bg-background/95 p-4 sm:static sm:m-0 sm:flex-row sm:justify-center sm:border-0 sm:bg-transparent sm:p-0">
            <Button className="w-full sm:w-auto" variant="outline" asChild><a href={parsed.url} target="_blank" rel="noopener noreferrer">Buka di YouTube ↗</a></Button>
            <Button className="w-full sm:w-auto" variant="secondary" asChild><Link to={`/buku/${selected.slug}#video-buku`} onClick={onClose}>Lihat semua video</Link></Button>
            <Button className="w-full sm:hidden" variant="ghost" onClick={onClose}>Tutup</Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default BookVideoDialog;
