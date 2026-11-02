import { Sun, CloudSun, Cloud, CloudFog, CloudRain, Snowflake, CloudLightning, Droplets, Wind } from "lucide-react";
import { useI18n } from "@/i18n/I18nContext";

const iconFor = (c) => {
  if (c <= 1) return Sun;
  if (c === 2) return CloudSun;
  if (c === 3) return Cloud;
  if (c === 45 || c === 48) return CloudFog;
  if (c >= 71 && c <= 77) return Snowflake;
  if (c >= 95) return CloudLightning;
  return CloudRain;
};

export const WeatherCard = ({ weather, place }) => {
  const { t } = useI18n();
  if (!weather) {
    return (
      <div className="card-soft p-5 text-sm text-slate-500" data-testid="weather-card">
        <p className="font-semibold text-slate-700 mb-1">{t("weather")}{place ? ` · ${place}` : ""}</p>
        {t("weather_na")}
      </div>
    );
  }
  const Icon = iconFor(weather.code);
  return (
    <div className="card-soft p-5 flex items-center gap-4 bg-gradient-to-br from-white to-[var(--pink-light)]" data-testid="weather-card">
      <div className="h-14 w-14 rounded-2xl bg-white grid place-items-center shadow-sm">
        <Icon className="h-8 w-8 text-[var(--pink)]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-slate-500">{t("weather")}{place ? ` · ${place}` : ""}</p>
        <p className="font-display text-3xl font-extrabold" data-testid="weather-temperature">{Math.round(weather.temperature)}°</p>
        <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
          <span className="inline-flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />{weather.precipitation_probability}% {t("rain")}</span>
          <span className="inline-flex items-center gap-1"><Wind className="h-3.5 w-3.5" />{Math.round(weather.wind_speed)} km/h</span>
        </div>
      </div>
    </div>
  );
};
