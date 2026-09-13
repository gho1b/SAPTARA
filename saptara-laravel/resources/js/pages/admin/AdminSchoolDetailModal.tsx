import { useState, useEffect } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { adminService } from "../../services/admin.service";
import type { School } from "../../types";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Ship,
  GraduationCap,
  AlertCircle,
  ExternalLink,
  Edit2,
} from "lucide-react";

interface AdminSchoolDetailModalProps {
  open: boolean;
  schoolId: number | null;
  onClose: () => void;
  onEdit?: (school: School) => void;
}

export function AdminSchoolDetailModal({
  open,
  schoolId,
  onClose,
  onEdit,
}: AdminSchoolDetailModalProps) {
  const [school, setSchool] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && schoolId) {
      setLoading(true);
      setError(null);
      adminService
        .getSchool(schoolId)
        .then((data) => {
          setSchool(data);
        })
        .catch((err: any) => {
          setError(err.message || "Gagal memuat detail sekolah.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setSchool(null);
      setError(null);
    }
  }, [open, schoolId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Detail Master Sekolah 🏛️"
      description="Informasi komprehensif data tenant, rombongan belajar, dan pengampu"
    >
      {loading ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <div className="h-7 w-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Memuat detail sekolah...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : school ? (
        <div className="space-y-5 pt-1 text-xs">
          {/* Header Card */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            {school.logo ? (
              <img
                src={school.logo}
                alt={school.name}
                className="h-14 w-14 rounded-xl object-contain border border-slate-200 bg-white p-1 shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-2xl shrink-0">
                🏫
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {school.name}
                </h3>
                <span className="font-mono bg-white text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                  NPSN: {school.npsn}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    school.is_active ?? true
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {school.is_active ?? true ? "Aktif" : "Non-aktif"}
                </span>
              </div>

              {/* Location */}
              <div className="mt-1 flex items-center gap-1.5 text-slate-500 text-[11px]">
                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                <span>
                  {[school.address, school.village, school.district, school.city, school.province]
                    .filter(Boolean)
                    .join(", ") || "Alamat belum dilengkapi"}
                </span>
              </div>

              {/* Contact Pills */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                {school.phone && (
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{school.phone}</span>
                  </div>
                )}
                {school.email && (
                  <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <span>{school.email}</span>
                  </div>
                )}
                {school.website && (
                  <a
                    href={school.website.startsWith("http") ? school.website : `https://${school.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 text-sky-600 hover:underline"
                  >
                    <Globe className="h-3 w-3" />
                    <span>{school.website}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-100">
              <p className="text-[10px] font-bold text-sky-600 uppercase">Rombel / Kelas</p>
              <p className="text-lg font-black text-sky-900 mt-0.5">{school.classes_count ?? 0}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100">
              <p className="text-[10px] font-bold text-purple-600 uppercase">Dewan Guru</p>
              <p className="text-lg font-black text-purple-900 mt-0.5">{school.teachers_count ?? 0}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Siswa</p>
              <p className="text-lg font-black text-emerald-900 mt-0.5">{school.students_count ?? 0}</p>
            </div>
          </div>

          {/* Classes Breakdown */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Ship className="h-3.5 w-3.5 text-sky-600" />
              Daftar Kelas & Kapal Layar ({school.classes?.length ?? 0})
            </h4>
            {school.classes && school.classes.length > 0 ? (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden max-h-48 overflow-y-auto">
                {school.classes.map((c: any) => (
                  <div key={c.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span>{c.class_code || c.classCode}</span>
                        <span className="text-slate-400 font-normal">•</span>
                        <span className="text-sky-700 font-semibold">{c.ship_name || c.shipName || "Kapal Layar"}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Wali Kelas: {c.teacher?.user?.name || c.teacher?.display_name || "Belum ditentukan"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                Belum ada kelas/rombongan belajar yang dibuat di sekolah ini.
              </p>
            )}
          </div>

          {/* Teachers Breakdown */}
          <div>
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-purple-600" />
              Dewan Guru Terdaftar ({school.teachers?.length ?? 0})
            </h4>
            {school.teachers && school.teachers.length > 0 ? (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden max-h-48 overflow-y-auto">
                {school.teachers.map((t: any) => (
                  <div key={t.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">
                        {t.user?.name || t.display_name || "Guru"}
                      </p>
                      <p className="text-[10px] text-slate-500">{t.user?.email || "-"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                Belum ada guru yang mendaftar atau ditugaskan di sekolah ini.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(school);
                }}
                className="gap-1 text-sky-700 border-sky-200 hover:bg-sky-50"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Data Sekolah</span>
              </Button>
            )}
            <div className="ml-auto">
              <Button variant="primary" size="sm" onClick={onClose}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

