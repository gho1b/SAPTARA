import React, { useState, useEffect, useRef } from "react";
import { Search, Building2, Check, RefreshCw, X, MapPin } from "lucide-react";
import type { School } from "../types";
import { schoolService } from "../services/school.service";

interface SchoolSelectComboboxProps {
  selectedSchool: School | null;
  onSelectSchool: (school: School | null) => void;
  className?: string;
}

export function SchoolSelectCombobox({
  selectedSchool,
  onSelectSchool,
  className = "",
}: SchoolSelectComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch schools when dropdown is opened or search query changes
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await schoolService.getSchools(searchQuery);
        setSchools(data);
      } catch (err) {
        console.error("Failed to fetch schools:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, searchQuery]);

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSelect = (school: School) => {
    onSelectSchool(school);
    schoolService.setStoredSchool(school);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Selected School Display or Prompt to Select */}
      {selectedSchool && !isOpen ? (
        <div className="flex items-center justify-between p-3 bg-sky-50/80 border border-sky-200 rounded-xl hover:bg-sky-100/70 transition-all shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {selectedSchool.logo ? (
                <img
                  src={selectedSchool.logo}
                  alt={selectedSchool.name}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <Building2 className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                  Sekolah Terpilih
                </span>
                <span className="inline-flex items-center text-[10px] bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded font-mono font-medium">
                  {selectedSchool.npsn}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                {selectedSchool.name}
              </h4>
              {selectedSchool.city && (
                <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 inline text-slate-400" />
                  {selectedSchool.city}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpen}
            className="ml-2 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-white border border-sky-300 rounded-lg hover:bg-sky-50 transition-colors shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Ganti</span>
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={handleOpen}
            className="w-full text-left flex items-center justify-between p-3 bg-white border-2 border-dashed border-sky-300 hover:border-sky-500 rounded-xl transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-sky-100 group-hover:bg-sky-200 text-sky-600 flex items-center justify-center shrink-0 transition-colors">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-sky-700">
                  🏫 Pilih Sekolah Kamu Terlebih Dahulu
                </p>
                <p className="text-[11px] text-slate-400">
                  Ketik nama sekolah atau NPSN untuk mencari...
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform">
              Pilih ▾
            </span>
          </button>
        </div>
      )}

      {/* Dropdown / Combobox Search Panel */}
      {isOpen && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-white border border-sky-300 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
            <Search className="h-4 w-4 text-sky-600 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama sekolah, NPSN, atau kota..."
              className="w-full text-xs sm:text-sm bg-transparent border-none outline-hidden focus:outline-hidden text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded cursor-pointer shrink-0"
            >
              Tutup
            </button>
          </div>

          {/* School Results List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-600" />
                <span>Mencari sekolah...</span>
              </div>
            ) : schools.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                <p className="font-semibold text-slate-600">Sekolah tidak ditemukan</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pastikan ejaan nama sekolah atau NPSN benar, atau hubungi administrator.
                </p>
              </div>
            ) : (
              schools.map((school) => {
                const isSelected = selectedSchool?.id === school.id;
                return (
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => handleSelect(school)}
                    className={`w-full text-left p-2.5 flex items-center justify-between hover:bg-sky-50/70 transition-colors cursor-pointer ${
                      isSelected ? "bg-sky-50/90 font-semibold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {school.logo ? (
                          <img
                            src={school.logo}
                            alt={school.name}
                            className="h-full w-full object-cover rounded"
                          />
                        ) : (
                          <Building2 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {school.name}
                          </p>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-mono">
                            {school.npsn}
                          </span>
                        </div>
                        {school.city && (
                          <p className="text-[11px] text-slate-400 truncate">
                            📍 {school.city} {school.province ? `, ${school.province}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-sky-600 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

