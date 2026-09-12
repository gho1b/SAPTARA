import { useStudentInfo } from "../../hooks/use-auth";
import { RadarChart } from "../../components/RadarChart";
import { HabitHeatmap } from "../../components/HabitHeatmap";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Compass, Sparkles, Lightbulb } from "lucide-react";

export function CompassPage() {
  const studentInfo = useStudentInfo();
  const studentId = studentInfo?.studentId ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24 space-y-6">
      <div className="mb-2">
        <h1 className="font-display text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Compass className="h-6 w-6 text-sky-600" />
          <span>Kompas Karakter Samudra</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Pantau keseimbangan 7 kebiasaan mulia dalam 30 hari terakhir pelayaranmu
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Radar Chart Card */}
        <Card className="border-sky-100 shadow-md">
          <CardHeader>
            <CardTitle className="font-display text-base text-slate-800">
              Keseimbangan Karakter
            </CardTitle>
            <CardDescription>
              Semakin luas jaring biru terbentang, semakin tangguh karaktermu!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadarChart studentId={studentId} />
          </CardContent>
        </Card>

        {/* Character Advice & Reflections */}
        <div className="space-y-4">
          <Card className="border-amber-100 bg-amber-50/40">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-amber-800">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <CardTitle className="font-display text-sm text-amber-900">
                  Petunjuk dari Si Kaka Bijak 🐢
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-amber-950 space-y-2 leading-relaxed">
              <p>
                "Kapten hebat bukan yang berlayar tanpa badai, tapi yang tekun memegang kemudi setiap hari!"
              </p>
              <p>
                Perhatikan kebiasaan yang jaringnya masih kecil di kompasmu. Cobalah fokus menjalankannya pekan ini!
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-500" />
                <CardTitle className="font-display text-sm text-slate-900">
                  Misi 7 Kebiasaan Anak Indonesia Hebat
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-slate-600 space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="text-base">🌅</span>
                <div>
                  <strong className="text-slate-800">Bangun Pagi:</strong> Memulai hari dengan semangat dan kesegaran jiwa.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">🕌</span>
                <div>
                  <strong className="text-slate-800">Beribadah:</strong> Bersyukur dan mendekatkan diri kepada Tuhan Yang Maha Esa.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">🏃</span>
                <div>
                  <strong className="text-slate-800">Rajin Berolahraga:</strong> Menjaga kesehatan raga agar selalu berenergi.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">🥗</span>
                <div>
                  <strong className="text-slate-800">Makan Sehat:</strong> Memberi nutrisi terbaik untuk pertumbuhan otak dan tubuh.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">📚</span>
                <div>
                  <strong className="text-slate-800">Gemar Belajar:</strong> Membuka jendela ilmu pengetahuan seluas samudra.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">🤝</span>
                <div>
                  <strong className="text-slate-800">Bermasyarakat:</strong> Peduli kawan, ramah, santun, dan suka menolong.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">🌙</span>
                <div>
                  <strong className="text-slate-800">Tidur Tepat Waktu:</strong> Mengistirahatkan badan agar fit dan bahagia esok hari.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Heatmap 60 Hari */}
      {studentId > 0 && (
        <HabitHeatmap studentId={studentId} studentName={studentInfo?.name} />
      )}
    </div>
  );
}
