import { useStudentInfo } from "../../hooks/use-auth";
import { PhotoLogbook } from "../../components/PhotoLogbook";

export function LogbookPage() {
  const studentInfo = useStudentInfo();
  const studentId = studentInfo?.studentId ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Jurnal Foto Pelayaran 📸
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Abadikan momen pembiasaan baikmu setiap hari. Guru dan orang tua akan memberikan apresiasi dan stiker!
        </p>
      </div>

      <PhotoLogbook studentId={studentId} />
    </div>
  );
}
