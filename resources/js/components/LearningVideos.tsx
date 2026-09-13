import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Video, Play, ExternalLink, Sparkles, Music, Activity, Layers, MonitorPlay } from "lucide-react";

export interface LearningVideoItem {
  id: string;
  youtubeId: string;
  title: string;
  originalUrl: string;
  embedUrl: string;
  category: string;
  badgeVariant: "default" | "success" | "warning";
  icon: React.ReactNode;
  duration?: string;
  description: string;
}

export const LEARNING_VIDEOS: LearningVideoItem[] = [
  {
    id: "video-edukasi",
    youtubeId: "cozeCsjMV-4",
    title: "Video Edukasi Tujuh Kebiasaan Anak Indonesia Hebat",
    originalUrl: "https://youtu.be/cozeCsjMV-4?si=YNF8Ur3jIn7WtDsc",
    embedUrl: "https://www.youtube.com/embed/cozeCsjMV-4",
    category: "Edukasi Karakter",
    badgeVariant: "default",
    icon: <Sparkles className="h-4 w-4 text-sky-500" />,
    description: "Pelajari panduan 7 kebiasaan mulia untuk membangun pribadi anak Indonesia yang tangguh, cerdas, dan berbudi pekerti luhur.",
  },
  {
    id: "senam-anak",
    youtubeId: "yobwi89woPQ",
    title: "Senam Anak Indonesia Hebat",
    originalUrl: "https://youtu.be/yobwi89woPQ?si=mP1F0G0tTJCfFcnU",
    embedUrl: "https://www.youtube.com/embed/yobwi89woPQ",
    category: "Senam & Olahraga",
    badgeVariant: "success",
    icon: <Activity className="h-4 w-4 text-emerald-500" />,
    description: "Ayo gerakkan badan dengan semangat dan riang gembira bersama irama Senam Anak Indonesia Hebat agar fisik tetap bugar!",
  },
  {
    id: "lirik-lagu",
    youtubeId: "d1NwNLFT94g",
    title: "Lirik Tujuh Kebiasaan Anak Indonesia Hebat - Lagu Tujuh Kebiasaan Anak Indonesia",
    originalUrl: "https://youtu.be/d1NwNLFT94g?si=Ekoj_MHR1YZNJX0I",
    embedUrl: "https://www.youtube.com/embed/d1NwNLFT94g",
    category: "Lagu & Musik",
    badgeVariant: "warning",
    icon: <Music className="h-4 w-4 text-amber-500" />,
    description: "Lagu ceria dan lirik penuh motivasi untuk memudahkan anak-anak mengingat dan mengamalkan 7 kebiasaan mulia setiap hari.",
  },
];

export function LearningVideos() {
  const [activeVideoId, setActiveVideoId] = React.useState<string>(LEARNING_VIDEOS[0].id);
  const [viewMode, setViewMode] = React.useState<"theater" | "all">("theater");

  const activeVideo = LEARNING_VIDEOS.find((v) => v.id === activeVideoId) || LEARNING_VIDEOS[0];

  return (
    <Card className="border-sky-100/90 shadow-md bg-white/95 overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-sm">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-display text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <span>Video Pembelajaran Kebiasaan Hebat</span>
                <span className="text-xs font-normal text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                  3 Video
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Tonton video edukasi, senam ceria, dan lagu kebiasaan untuk menemani pelayaran karaktermu
              </CardDescription>
            </div>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode("theater")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === "theater"
                  ? "bg-white text-sky-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              <span>Teater</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === "all"
                  ? "bg-white text-sky-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Semua Video</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 sm:pt-6 space-y-6">
        {viewMode === "theater" ? (
          /* ========================================================================= */
          /* THEATER VIEW: 1 Active Video Player with Responsive 16:9 + Playlist Menu  */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Active Video Player Container (Fully Responsive on Mobile, never clipped) */}
            <div className="space-y-2">
              <div className="relative w-full aspect-video overflow-hidden rounded-xl sm:rounded-2xl bg-slate-950 shadow-lg border border-slate-200">
                <iframe
                  key={activeVideo.youtubeId}
                  className="absolute inset-0 h-full w-full border-0"
                  src={`${activeVideo.embedUrl}?rel=0&modestbranding=1`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              {/* Active Video Info Bar */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={activeVideo.badgeVariant} className="text-[11px]">
                      {activeVideo.icon}
                      <span>{activeVideo.category}</span>
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-medium">Sedang Diputar</span>
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-slate-900 leading-snug">
                    {activeVideo.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {activeVideo.description}
                  </p>
                </div>

                <a
                  href={activeVideo.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors border border-sky-200 shrink-0"
                  title="Buka langsung di aplikasi YouTube"
                >
                  <span>Buka di YouTube</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Menu Playlist Selector (Pilihan Video) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Daftar Pilihan Video Pembelajaran
                </h5>
                <span className="text-[11px] text-slate-400">Klik video untuk memutar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LEARNING_VIDEOS.map((video, index) => {
                  const isActive = video.id === activeVideoId;
                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => setActiveVideoId(video.id)}
                      className={`group text-left p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                        isActive
                          ? "bg-sky-50/70 border-sky-400 ring-2 ring-sky-300 shadow-sm"
                          : "bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400">
                            #{index + 1}
                          </span>
                          <Badge variant={video.badgeVariant} className="text-[10px] py-0 px-2">
                            {video.category}
                          </Badge>
                        </div>
                        <p
                          className={`text-xs font-semibold line-clamp-2 leading-snug transition-colors ${
                            isActive ? "text-sky-900" : "text-slate-800 group-hover:text-sky-700"
                          }`}
                        >
                          {video.title}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                            </span>
                            Sedang Diputar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 group-hover:text-sky-600">
                            <Play className="h-3 w-3 fill-current" />
                            Putar Video
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* ALL VIDEOS VIEW: List of 3 Video Cards, Each with Responsive 16:9 Container*/
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {LEARNING_VIDEOS.map((video, index) => (
              <div
                key={video.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* 16:9 Responsive Video Container - Never clipped on mobile */}
                <div className="relative w-full aspect-video overflow-hidden bg-slate-950 border-b border-slate-100">
                  <iframe
                    className="absolute inset-0 h-full w-full border-0"
                    src={`${video.embedUrl}?rel=0&modestbranding=1`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                {/* Card Body */}
                <div className="flex flex-col flex-1 p-3.5 justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant={video.badgeVariant} className="text-[10px]">
                        {video.icon}
                        <span>{video.category}</span>
                      </Badge>
                      <span className="text-[11px] text-slate-400 font-medium">Video #{index + 1}</span>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                      {video.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {video.description}
                    </p>
                  </div>

                  <a
                    href={video.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 py-2 rounded-lg transition-colors border border-sky-200"
                  >
                    <span>Buka di YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
