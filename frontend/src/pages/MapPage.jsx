import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { ActivityMeta } from "@/components/ActivityCard";

const icon = (fav) => L.divIcon({ className: "", html: `<div class="pink-marker ${fav ? "dark-marker" : ""}"></div>`, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });

export default function MapPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [latest, setLatest] = useState(null);
  const [favs, setFavs] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/suggestions/latest").then((r) => setLatest(r.data)).catch(() => setLatest({}));
    api.get("/favorites").then((r) => setFavs(r.data)).catch(() => {});
  }, []);

  const points = useMemo(() => {
    const s = (latest?.activities || []).map((a) => ({ ...a, fav: false }));
    const f = favs.map((x) => ({ ...x.activity, fav: true }));
    const all = filter === "all" ? [...s, ...f] : filter === "favorites" ? f : s;
    return all.filter((a) => typeof a.lat === "number" && typeof a.lon === "number" && (a.lat || a.lon));
  }, [latest, favs, filter]);

  if (latest === null) return null;
  const center = points[0] ? [points[0].lat, points[0].lon] : latest?.lat ? [latest.lat, latest.lon] : user.lat ? [user.lat, user.lon] : [41.9, 12.5];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">{t("map")}</h1>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {["all", "suggested", "favorites"].map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`chip whitespace-nowrap ${filter === k ? "chip-on" : ""}`} data-testid={`map-filter-${k}`}>{t(k)}</button>
        ))}
      </div>
      {!points.length && <p className="text-sm text-slate-500" data-testid="map-empty">{t("map_empty")}</p>}
      <div className="h-[60vh] min-h-[380px] card-soft overflow-hidden p-0 relative z-0" data-testid="activity-map">
        <MapContainer key={center.join(",")} center={center} zoom={12} scrollWheelZoom className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {points.map((a, i) => (
            <Marker key={`${a.title}-${i}`} position={[a.lat, a.lon]} icon={icon(a.fav)}>
              <Popup>
                <div className="space-y-2 min-w-[200px]" data-testid={`map-popup-${i}`}>
                  <p className="font-display font-bold text-[15px] m-0">{a.title}</p>
                  <p className="text-xs text-slate-500 m-0">{a.place}</p>
                  <ActivityMeta a={a} />
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
