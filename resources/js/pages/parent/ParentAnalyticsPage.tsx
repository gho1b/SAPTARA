import { useParentInfo } from "../../hooks/use-auth";
import { RadarChart } from "../../components/RadarChart";
import { HabitHeatmap } from "../../components/HabitHeatmap";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { BarChart3, Heart, Lightbulb } from "lucide-react";

export function ParentAnalyticsPage() {
  const parentInfo = useParentInfo();
  const studentId = parentInfo?.studentId ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24 space-y-6">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-emerald-600" />
          <span>Pantauan Karakter {parentInfo?.studentName || "Ananda"}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Analisis keseimbangan 7 kebiasaan mulia dalam 30 hari terakhir pelayaran
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Radar Chart */}
        <Card className="border-emerald-100 shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-base text-slate-800">
              Kompas Karakter Ananda
            </CardTitle>
            <CardDescription>
              Tingkat konsistensi setiap kebiasaan baik yang terlaksana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadarChart studentId={studentId} />
          </CardContent>
        </Card>

        {/* Home Collaboration Tips for Parents */}
        <div className="space-y-4">
          <Card className="border-emerald-100 bg-emerald-50/40">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-emerald-800">
                <Heart className="h-5 w-5 text-rose-500" />
                <CardTitle className="font-display text-sm text-emerald-900">
                  Apresiasi & Kasih Sayang di Rumah
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-emerald-950 leading-relaxed">
              <p>
                Perilaku baik yang dihargai akan diulang. Pujilah usaha ananda, bukan sekadar hasilnya.
              </p>
              <p>
                Misalnya: <em>"Bunda bangga melihatmu langsung merapikan tempat tidur sendiri pagi ini tanpa disuruh!"</em>
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-slate-800">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <CardTitle className="font-display text-sm text-slate-800">
                  Tips Penguatan Pembiasaan
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <span>⏰</span>
                <div>
                  <strong className="text-slate-800">Tidur Tepat Waktu:</strong> Batasi layar gawai (gadget) 1 jam sebelum tidur agar tidur nyenyak.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span>🥗</span>
                <div>
                  <strong className="text-slate-800">Makan Sehat:</strong> Ajak ananda mencoba sayur dan buah baru dalam porsi kecil dengan suasana menyenangkan.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span>📖</span>
                <div>
                  <strong className="text-slate-800">Gemar Belajar:</strong> Luangkan waktu 15 menit membaca buku cerita bersama sebelum tidur.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Heatmap 60 Hari */}
      {studentId > 0 && (
        <HabitHeatmap studentId={studentId} studentName={parentInfo?.studentName} />
      )}
    </div>
  );
}
