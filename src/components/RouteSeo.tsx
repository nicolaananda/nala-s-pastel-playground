import { useLocation } from "react-router-dom";
import Seo from "@/components/Seo";

const pages: Record<string, [string, string]> = {
  "/": ["Nala Art Studio - Kelas Mewarnai, Menggambar & Art Therapy", "Kelas seni untuk anak dan dewasa, buku mewarnai, worksheet gratis, serta panduan menggambar dari Nala Art Studio."],
  "/berita-lomba": ["Berita Lomba Mewarnai | Nala Art Studio", "Informasi, dokumentasi, dan pengalaman Nala Art Studio dalam kegiatan serta lomba mewarnai anak."],
  "/grasp-guide-premium": ["Panduan Premium Grasp | Nala Art Studio", "Panduan eksklusif penggunaan dan teknik mewarnai dengan Grasp dari Nala Art Studio."],
  "/grasp-sixty-color-premium": ["Panduan Grasp 60 Warna | Nala Art Studio", "Panduan premium nama, nomor, swatch, dan penggunaan Grasp 60 warna."],
  "/sketch-purchase": ["Beli Sketch Premium | Nala Art Studio", "Dapatkan koleksi sketch premium untuk latihan menggambar dan mewarnai."],
  "/sketch-premium": ["Akses Sketch Premium | Nala Art Studio", "Halaman akses koleksi sketch premium Nala Art Studio."],
};

const RouteSeo = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return <Seo title="Admin Nala Art Studio" description="Area administrasi privat." path={pathname} noindex />;
  const page = pages[pathname];
  if (!page) return null;
  return <Seo title={page[0]} description={page[1]} path={pathname} noindex={["/sketch-premium", "/grasp-guide-premium", "/grasp-sixty-color-premium"].includes(pathname)} />;
};
export default RouteSeo;
