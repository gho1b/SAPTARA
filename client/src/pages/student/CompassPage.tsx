import { useState } from "react";
import { RadarChart } from "../../components/RadarChart";
import { Navbar } from "../../components/Navbar";
import { useStudentInfo } from "../../hooks/use-auth";
import { useStudentWeekly } from "../../hooks/use-students";

// Video panduan 7 karakter Saptara
const GUIDE_VIDEOS = [
  {
    id: "cozeCsjMV-4",
    title: "Video Edukasi 7 KAIH",
    desc: "Kenali 7 kebiasaan karakter anak Nusantara",
    url: "https://youtu.be/cozeCsjMV-4?si=YNF8Ur3jIn7WtDsc",
  },
  {
    id: "yobwi89woPQ",
    title: "Senam Anak Indonesia Hebat",
    desc: "Cara mudah menyelesaikan misi setiap hari",
    url: "https://youtu.be/yobwi89woPQ?si=mP1F0G0tTJCfFcnU",
  },
  {
    id: "d1NwNLFT94g",
    title: "Lirik Lagu 7 KAIH",
    desc: "Strategi meningkatkan skor kompas karakter",
    url: "https://youtu.be/d1NwNLFT94g?si=Ekoj_MHR1YZNJX0I",
  },
];

/**
 * YouTubeCard
 *
 * Menampilkan thumbnail video YouTube. Saat diklik tampil embed iframe.
 * Menggunakan thumbnail resolusi tinggi dari YouTube CDN.
 */
function YouTubeCard({
  id,
  title,
  desc,
  url,
}: {
  id: string;
  title: string;
  desc: string;
  url: string;
}) {
  const [playing, setPlaying] = useState(false);

  const thumbHq = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;

  return (
    <div className="yt-card">
      {playing ? (
        <div className="yt-card__iframe-wrap">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="yt-card__iframe"
          />
        </div>
      ) : (
        <button
          className="yt-card__thumb-btn"
          onClick={() => setPlaying(true)}
          type="button"
          aria-label={`Putar video: ${title}`}
        >
          <img
            src={thumbHq}
            alt={title}
            className="yt-card__thumb"
            loading="lazy"
          />
          {/* Play button overlay */}
          <span className="yt-card__play-overlay">
            <span className="yt-card__play-icon">▶</span>
          </span>
          {/* YouTube badge */}
          <span className="yt-card__yt-badge">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
            </svg>
            YouTube
          </span>
        </button>
      )}

      <div className="yt-card__info">
        <p className="yt-card__title">{title}</p>
        <p className="yt-card__desc">{desc}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="yt-card__link"
          onClick={(e) => e.stopPropagation()}
        >
          Buka di YouTube ↗
        </a>
      </div>
    </div>
  );
}

/**
 * Student Compass Page
 *
 * Shows the radar chart of habit scores, weekly trend data,
 * and a curated video guide section below.
 */
export function CompassPage() {
  const studentInfo = useStudentInfo();
  const studentId = studentInfo?.studentId ?? 0;
  const { data: weeklyData, isLoading } = useStudentWeekly(studentId);

  const maxCompleted = weeklyData ? Math.max(...weeklyData.map(d => d.completed), 1) : 1;

  return (
    <div className="student-page" id="student-compass-page">
      <div className="page-header">
        <h1 className="page-title">🧭 Kompas Karakter</h1>
        <p className="page-subtitle">Peta kekuatan karaktermu</p>
      </div>

      {/* Radar Chart */}
      <div className="compass-section">
        <RadarChart studentId={studentId} />
      </div>

      {/* Weekly Trend */}
      <div className="weekly-section">
        <h3 className="section-title">📊 Tren Mingguan</h3>
        {isLoading ? (
          <p style={{ opacity: 0.6 }}>Memuat data...</p>
        ) : (
          <div className="weekly-chart">
            {weeklyData?.map((day, idx) => (
              <div key={idx} className="weekly-bar-col">
                <div className="weekly-bar-wrapper">
                  <div
                    className="weekly-bar"
                    style={{
                      height: `${(day.completed / Math.max(maxCompleted, 7)) * 100}%`,
                    }}
                  >
                    <span className="weekly-bar__count">{day.completed}</span>
                  </div>
                </div>
                <span className="weekly-bar__day">{day.day}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Panduan */}
      <div className="yt-section">
        <h3 className="section-title">🎬 Video Panduan Karakter</h3>
        <p className="yt-section__subtitle">Tonton video untuk semangat ekspedisimu!</p>
        <div className="yt-list">
          {GUIDE_VIDEOS.map((v) => (
            <YouTubeCard key={v.id} {...v} />
          ))}
        </div>
      </div>

      <Navbar role="student" />
    </div>
  );
}
