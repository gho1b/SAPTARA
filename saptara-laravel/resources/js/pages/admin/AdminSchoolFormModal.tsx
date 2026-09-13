import { useState, useEffect } from "react";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { adminService } from "../../services/admin.service";
import type { School } from "../../types";
import { Building2, Upload, AlertCircle, CheckCircle2, Image as ImageIcon, X } from "lucide-react";

interface AdminSchoolFormModalProps {
  open: boolean;
  onClose: () => void;
  schoolToEdit?: School | null;
  onSuccess: (savedSchool: School) => void;
}

export function AdminSchoolFormModal({
  open,
  onClose,
  schoolToEdit,
  onSuccess,
}: AdminSchoolFormModalProps) {
  const isEditing = !!schoolToEdit;

  const [npsn, setNpsn] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (schoolToEdit) {
      setNpsn(schoolToEdit.npsn || "");
      setName(schoolToEdit.name || "");
      setAddress(schoolToEdit.address || "");
      setVillage(schoolToEdit.village || "");
      setDistrict(schoolToEdit.district || "");
      setCity(schoolToEdit.city || "");
      setProvince(schoolToEdit.province || "");
      setPhone(schoolToEdit.phone || "");
      setEmail(schoolToEdit.email || "");
      setWebsite(schoolToEdit.website || "");
      setIsActive(schoolToEdit.isActive ?? true);
      setLogoPreview(schoolToEdit.logo || null);
      setLogoFile(null);
    } else {
      setNpsn("");
      setName("");
      setAddress("");
      setVillage("");
      setDistrict("");
      setCity("");
      setProvince("");
      setPhone("");
      setEmail("");
      setWebsite("");
      setIsActive(true);
      setLogoPreview(null);
      setLogoFile(null);
    }
    setErrorMsg(null);
  }, [schoolToEdit, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedNpsn = npsn.trim();
    if (trimmedNpsn.length !== 8) {
      setErrorMsg("NPSN harus tepat 8 digit angka/karakter");
      return;
    }

    if (!name.trim()) {
      setErrorMsg("Nama sekolah wajib diisi");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("npsn", trimmedNpsn);
    formData.append("name", name.trim());
    if (address) formData.append("address", address.trim());
    if (village) formData.append("village", village.trim());
    if (district) formData.append("district", district.trim());
    if (city) formData.append("city", city.trim());
    if (province) formData.append("province", province.trim());
    if (phone) formData.append("phone", phone.trim());
    if (email) formData.append("email", email.trim());
    if (website) formData.append("website", website.trim());
    formData.append("is_active", isActive ? "1" : "0");

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    try {
      let res;
      if (isEditing && schoolToEdit) {
        // Laravel handles multipart best via POST with _method=PUT
        formData.append("_method", "PUT");
        res = await adminService.updateSchool(schoolToEdit.id, formData);
      } else {
        res = await adminService.createSchool(formData);
      }
      onSuccess(res.school);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan data sekolah");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Data Sekolah: ${schoolToEdit?.name}` : "Tambah Master Data Sekolah Baru 🏫"}
      description="Kelola informasi entitas sekolah sebagai tenant multi-sekolah SAPTARA"
      className="max-w-2xl"
    >
      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-1 max-h-[70vh] overflow-y-auto px-1">
        {/* Identitas Utama */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-sky-600" />
            <span>Identitas Pokok Sekolah</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                NPSN (8 Digit) <span className="text-rose-500">*</span>
              </label>
              <Input
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                placeholder="Contoh: 20101234"
                maxLength={8}
                required
                className="font-mono text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Resmi Sekolah <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: SMP Negeri 1 Samudra Jakarta"
                required
              />
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Logo Sekolah (Opsional)
          </label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {logoPreview ? (
                <img src={logoPreview} alt="Preview Logo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                onChange={handleFileChange}
                className="block w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-sky-800 hover:file:bg-sky-200 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Format: PNG, JPG, WebP, SVG. Maks 2 MB.
              </p>
            </div>
            {logoPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLogoFile(null);
                  setLogoPreview(null);
                }}
                className="h-8 text-xs text-rose-600 hover:bg-rose-50"
              >
                Hapus
              </Button>
            )}
          </div>
        </div>

        {/* Wilayah & Alamat */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Alamat & Lokasi Wilayah
          </h4>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Alamat Jalan / Gedung
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contoh: Jl. Maritim Bahari No. 45"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Kelurahan
              </label>
              <Input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Kelurahan"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Kecamatan
              </label>
              <Input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Kecamatan"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Kota / Kab.
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Kota / Kab"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Provinsi
              </label>
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Provinsi"
              />
            </div>
          </div>
        </div>

        {/* Kontak Resmi */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Kontak Resmi & Website
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                No. Telepon
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="021-..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Email Resmi
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@sekolah.sch.id"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Website
              </label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Status Aktif */}
        <div className="flex items-center gap-2 p-2">
          <input
            type="checkbox"
            id="schoolIsActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
          />
          <label htmlFor="schoolIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
            Aktifkan Sekolah (Dapat dipilih oleh siswa, guru, dan orang tua saat login)
          </label>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
          >
            {loading ? "Menyimpan..." : isEditing ? "Perbarui Data Sekolah" : "Simpan Master Sekolah"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

