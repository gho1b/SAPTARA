import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStudentLogbook, useSubmitLogbook } from "../hooks/use-logbook";
import { useHabits } from "../hooks/use-habits";

interface PhotoLogbookProps {
  studentId: number;
}

/**
 * PhotoLogbook Component
 *
 * Displays the student's logbook entries and provides a form
 * to submit new entries with camera photo or gallery upload + caption.
 * Supports ?habitId= query param to pre-select a habit from the ocean map.
 */
export function PhotoLogbook({ studentId }: PhotoLogbookProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: entries, isLoading } = useStudentLogbook(studentId);
  const { data: habits } = useHabits();
  const submitLogbook = useSubmitLogbook(studentId);

  const preSelectedHabitId = Number(searchParams.get("habitId")) || 0;

  const [showForm, setShowForm] = useState(preSelectedHabitId > 0);
  const [selectedHabitId, setSelectedHabitId] = useState<number>(preSelectedHabitId);
  const [caption, setCaption] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-open form if habitId is in the URL
  useEffect(() => {
    if (preSelectedHabitId > 0) {
      setShowForm(true);
      setSelectedHabitId(preSelectedHabitId);
    }
  }, [preSelectedHabitId]);

  // Start camera with specified facing mode
  const startCamera = async (mode?: "environment" | "user") => {
    const useMode = mode ?? facingMode;
    setCameraError(null);
    // Stop existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: useMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setShowCamera(true);
      // Wait for ref to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      setCameraError("Kamera tidak tersedia. Gunakan upload dari galeri.");
      setShowCamera(false);
    }
  };

  // Switch between front and back camera
  const switchCamera = () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    startCamera(newMode);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setPhotoPreview(dataUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `misi-${Date.now()}.jpg`, { type: "image/jpeg" });
          setPhotoBlob(file);
        }
      }, "image/jpeg", 0.85);

      stopCamera();
    }
  };

  // Handle gallery file pick
  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoBlob(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabitId || !caption) return;

    await submitLogbook.mutateAsync({
      habitId: selectedHabitId,
      caption,
      photo: photoBlob || undefined,
    });

    // Reset form
    setCaption("");
    setPhotoBlob(null);
    setPhotoPreview(null);
    setSelectedHabitId(0);
    setShowForm(false);
    stopCamera();
    setSearchParams({});
  };

  const handleCloseForm = () => {
    setShowForm(false);
    stopCamera();
    setPhotoPreview(null);
    setPhotoBlob(null);
    setSearchParams({});
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoBlob(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const statusEmoji = (status: string) => {
    switch (status) {
      case "verified": return "✅";
      case "pending": return "⏳";
      case "rejected":
      case "needs_revision": return "🔄";
      default: return "❓";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "verified": return "Disetujui";
      case "pending": return "Menunggu";
      case "rejected": return "Ditolak";
      case "needs_revision": return "Perbaiki";
      default: return status;
    }
  };

  const selectedHabit = habits?.find(h => h.id === selectedHabitId);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
        <p style={{ opacity: 0.6 }}>Memuat logbook...</p>
      </div>
    );
  }

  return (
    <div className="photo-logbook" id="photo-logbook">
      {/* Submit button */}
      <button
        className="btn btn-primary logbook-submit-btn"
        onClick={() => showForm ? handleCloseForm() : setShowForm(true)}
        type="button"
      >
        {showForm ? "✕ Tutup" : "📸 Catat Misi Baru"}
      </button>

      {/* Submit form */}
      {showForm && (
        <form className="logbook-form" onSubmit={handleSubmit}>
          {/* Habit selector — custom button grid */}
          <div className="form-group">
            <label>Pilih Misi</label>
            <div className="habit-selector-grid" style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}>
              {habits?.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHabitId(h.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    border: selectedHabitId === h.id
                      ? "2px solid #FFB703"
                      : "2px solid rgba(255,255,255,0.1)",
                    background: selectedHabitId === h.id
                      ? "rgba(255, 183, 3, 0.15)"
                      : "rgba(255,255,255,0.05)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: selectedHabitId === h.id ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{h.icon}</span>
                  <span>{h.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="form-group">
            <label htmlFor="logbook-caption">Ceritakan Misimu</label>
            <textarea
              id="logbook-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Apa yang kamu lakukan hari ini, Kapten?"
              rows={3}
              required
            />
          </div>

          {/* Camera / Photo section */}
          <div className="form-group">
            <label>📷 Foto Bukti Misi</label>

            {/* Camera preview */}
            {showCamera && (
              <div className="camera-preview">
                <video
                  ref={videoRef}
                  className="camera-preview__video"
                  autoPlay
                  playsInline
                  muted
                  style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
                />
                <div className="camera-preview__controls" style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-primary camera-btn" onClick={capturePhoto}>
                    📸 Ambil Foto
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline camera-btn"
                    onClick={switchCamera}
                    style={{ fontSize: "14px" }}
                  >
                    🔄 {facingMode === "environment" ? "Depan" : "Belakang"}
                  </button>
                  <button type="button" className="btn btn-outline camera-btn" onClick={stopCamera}>
                    ✕ Batal
                  </button>
                </div>
              </div>
            )}

            {/* Photo preview */}
            {photoPreview && !showCamera && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview foto" className="photo-preview__img" />
                <button type="button" className="photo-preview__remove" onClick={removePhoto}>
                  ✕ Hapus
                </button>
              </div>
            )}

            {/* Camera + Gallery buttons (when no preview and no camera) */}
            {!photoPreview && !showCamera && (
              <div className="photo-buttons">
                <button type="button" className="btn btn-camera" onClick={() => startCamera()}>
                  📷 Buka Kamera
                </button>
                <button
                  type="button"
                  className="btn btn-gallery"
                  onClick={() => fileInputRef.current?.click()}
                >
                  🖼️ Pilih dari Galeri
                </button>
              </div>
            )}

            {cameraError && (
              <p className="error-text" style={{ fontSize: "12px", marginTop: "4px" }}>
                ⚠️ {cameraError}
              </p>
            )}

            {/* Hidden file input for gallery */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleGalleryPick}
              style={{ display: "none" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitLogbook.isPending || !selectedHabitId || !caption}
          >
            {submitLogbook.isPending ? "Mengirim..." : "🚀 Kirim Logbook"}
          </button>

          {submitLogbook.isError && (
            <p className="error-text">
              ❌ {submitLogbook.error.message}
            </p>
          )}
        </form>
      )}

      {/* Entries list */}
      <div className="logbook-entries">
        {(!entries || entries.length === 0) ? (
          <div className="logbook-empty" style={{ textAlign: "center", padding: "32px", opacity: 0.6 }}>
            <p>📝 Belum ada catatan logbook</p>
            <p style={{ fontSize: "13px" }}>Catat misi pertamamu, Kapten!</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className={`logbook-entry status-${entry.status}`}>
              <div className="logbook-entry__header">
                <span className="logbook-entry__habit">
                  {entry.habitIcon || "📋"} {entry.habitName || `Misi #${entry.habitId}`}
                </span>
                <span className={`logbook-entry__status badge-${entry.status}`}>
                  {statusEmoji(entry.status)} {statusLabel(entry.status)}
                </span>
              </div>

              {entry.photoUrl && (
                <img
                  src={entry.photoUrl}
                  alt="Bukti misi"
                  className="logbook-entry__photo"
                  loading="lazy"
                />
              )}

              <p className="logbook-entry__caption">{entry.caption}</p>

              <div className="logbook-entry__meta">
                <span>📅 {entry.date}</span>
                <span>🕐 {entry.time}</span>
                {entry.xpEarned > 0 && <span>⚡ +{entry.xpEarned} mil</span>}
              </div>

              {entry.teacherComment && (
                <div className="logbook-entry__feedback">
                  <span>{entry.teacherSticker || "💬"}</span>
                  <span>{entry.teacherComment}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
