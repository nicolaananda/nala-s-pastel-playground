import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicContent,ContentItem } from '@/lib/cms';
import Footer from '@/components/Footer';
export default function Competitions(){const [items,setItems]=useState<ContentItem[]>([]);useEffect(()=>{fetchPublicContent('competition').then(setItems)},[]);return <main className="min-h-screen bg-[#fff8ef] p-5"><div className="mx-auto max-w-5xl"><h1 className="mb-6 text-4xl font-black">Lomba Mewarnai</h1><div className="grid gap-5 md:grid-cols-2">{items.map(i=><Link key={i.id} to={`/lomba/${i.slug}`} className="overflow-hidden rounded-3xl border-2 border-foreground bg-white shadow-[6px_6px_0_#2b2118]">{i.imageUrl&&<img src={i.imageUrl} alt={i.title} className="h-60 w-full object-cover"/>}<div className="p-5"><h2 className="text-2xl font-black">{i.title}</h2><p>{String(i.metadata.shortDescription||'')}</p><b>Rp {Number(i.price).toLocaleString('id-ID')}</b></div></Link>)}</div></div><Footer/></main>}
