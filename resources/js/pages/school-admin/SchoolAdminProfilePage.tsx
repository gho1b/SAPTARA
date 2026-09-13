import { useState, useEffect } from "react";
import { schoolAdminService } from "../../services/school-admin.service";
import type { School } from "../../types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Upload,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";

export function SchoolAdminProfilePage() {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await schoolAdminService.getProfile();
      setSchool(data);
      setName(data.name || "");
      setAddress(data.address || "");
      setVillage(data.village || "");
      setDistrict(data.district || "");
      setCity(data.city || "");
      setProvince(data.province || "");
      setPhone(data.phone || "");
      setEmail(data.email || "");
      setWebsite(data.website || "");
      setLogoPreview(data.logo || null);
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal memuat profil sekolah." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlertMsg(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("address", address);
    formData.append("village", village);
    formData.append("district", district);
    formData.append("city", city);
    formData.append("province", province);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("website", website);
    if (logoFile) {
      formData.append("logo", logoFile);
    }

    try {
      const res = await schoolAdminService.updateProfile(formData);
      setAlertMsg({ type: "success", text: res.message });
      setSchool(res.school);
      schoolAdminService.me(); // Refresh stored school in background
    } catch (err: any) {
      setAlertMsg({ type: "error", text: err.message || "Gagal menyimpan profil sekolah." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 text-xs">
        Memuat data profil sekolah...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-teal-600" />
          <span>Profil & Identitas Sekolah</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Perbarui informasi resmi, alamat, kontak, dan logo sekolah yang tampil di seluruh aplikasi
        </p>
      </div>

      {alertMsg && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${
            alertMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {alertMsg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{alertMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Pokok & Logo */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">1. Identitas Pokok Lembaga</CardTitle>
            <CardDescription className="text-xs">Nomor pokok sekolah nasional dan nama resmi</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Sekolah"
                    className="h-20 w-20 rounded-2xl object-contain border border-slate-200 bg-slate-50 p-1 shadow-xs"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-3xl text-slate-400">
                    🏫
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 bg-teal-600 text-white p-1 rounded-lg cursor-pointer hover:bg-teal-700 shadow-sm">
                  <Upload className="h-3.5 w-3.5" />
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>

              <div className="flex-1 w-full space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      NPSN <span className="text-[10px] text-slate-400">(Terkunci)</span>
                    </label>
                    <Input
                      value={school?.npsn || ""}
                      disabled
                      className="bg-slate-100 font-mono font-bold text-slate-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nama Resmi Sekolah
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap sekolah"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alamat & Wilayah */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">2. Alamat & Wilayah Administratif</CardTitle>
            <CardDescription className="text-xs">Lokasi geografis dan domisili sekolah</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Alamat Jalan
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Nama Jalan No. XX"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Desa / Kelurahan
                </label>
                <Input
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="Kelurahan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kecamatan
                </label>
                <Input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Kecamatan"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kabupaten / Kota
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Kota / Kabupaten"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Provinsi
                </label>
                <Input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Provinsi"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kontak Resmi */}
        <Card className="bg-white border-slate-200/80 shadow-xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900">3. Kontak Resmi Sekolah</CardTitle>
            <CardDescription className="text-xs">Saluran komunikasi yang dapat dihubungi</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nomor Telepon
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="021-XXXXXXX"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Resmi Sekolah
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@sekolah.sch.id"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Website Sekolah
                </label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://sekolah.sch.id"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={saving}
            className="gap-2 bg-teal-600 hover:bg-teal-700 font-display text-xs"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Menyimpan Perubahan..." : "Simpan Profil Sekolah"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

