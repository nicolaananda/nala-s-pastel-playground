import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { searchVillages, VillageOption } from "@/lib/shipping";

interface VillagePickerProps {
  id?: string;
  value: VillageOption | null;
  onChange: (village: VillageOption | null) => void;
  placeholder?: string;
}

const VillagePicker = ({ id, value, onChange, placeholder }: VillagePickerProps) => {
  const [query, setQuery] = useState(value?.label || "");
  const [results, setResults] = useState<VillageOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync external value (kalau parent reset form)
  useEffect(() => {
    if (value && value.label !== query) setQuery(value.label);
    if (!value && query && !isOpen) setQuery("");
  }, [value]);

  const handleInputChange = (val: string) => {
    setQuery(val);
    setIsOpen(true);

    // Clear selected kalau user edit teksnya
    if (value && val !== value.label) {
      onChange(null);
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const villages = await searchVillages(val);
        setResults(villages);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);
  };

  const handleSelect = (village: VillageOption) => {
    onChange(village);
    setQuery(village.label);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        placeholder={placeholder || "Cari kelurahan/desa, contoh: Tembalang"}
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {isOpen && (results.length > 0 || (query.length >= 2 && !isLoading)) && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border-2 border-primary/20 bg-white shadow-lg">
          {results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Tidak ditemukan. Coba kata kunci lain.
            </div>
          ) : (
            results.map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() => handleSelect(v)}
                className="w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors border-b border-muted last:border-0"
              >
                <p className="font-semibold text-sm">{v.name}</p>
                <p className="text-xs text-muted-foreground">
                  {v.district}, {v.regency}, {v.province}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VillagePicker;
