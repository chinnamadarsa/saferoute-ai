"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
});

type LocationPoint = {
  latitude: number;
  longitude: number;
  display_name?: string;
};

type Route = {
  route_id: string;
  strategy?: string;
  distance_km: number;
  duration_min: number;
  risk_score: number;
  rainfall?: number;
  rainfall_risk?: number;
  flood_risk?: number;
  terrain_elevation?: number;
  traffic_risk?: number;
  disruption_risk?: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
};

type AnalysisResult = {
  origin: LocationPoint;
  destination: LocationPoint;
  routes: Route[];
  selected_route?: Route;
  weather?: {
    rainfall?: number;
    precipitation?: number;
    temperature?: number;
    source?: string;
  };
  explanation?: string;
};

const riskMeta = (score = 0) => {
  if (score >= 80) {
    return {
      label: "Very high",
      badge: "bg-rose-100 text-rose-700",
      text: "text-rose-600",
      bar: "bg-rose-500",
    };
  }

  if (score >= 60) {
    return {
      label: "High",
      badge: "bg-orange-100 text-orange-700",
      text: "text-orange-600",
      bar: "bg-orange-500",
    };
  }

  if (score >= 31) {
    return {
      label: "Moderate",
      badge: "bg-amber-100 text-amber-700",
      text: "text-amber-600",
      bar: "bg-amber-500",
    };
  }

  return {
    label: "Low",
    badge: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-600",
    bar: "bg-emerald-500",
  };
};

const formatDuration = (minutes = 0) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) {
    return `${mins} min`;
  }

  return `${hours}h ${mins}m`;
};

const routeStrategyLabel = (route: Route) => {
  if (route.strategy) return route.strategy;

  return route.route_id === "route-1" ? "Fastest" : "Alternative";
};

export default function Home() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [viewedRouteId, setViewedRouteId] = useState<string | null>(null);

  const canAnalyze =
    origin.trim() !== "" &&
    destination.trim() !== "" &&
    !loading;

  const recommendedRouteId =
    result?.selected_route?.route_id ?? result?.routes?.[0]?.route_id ?? null;

  const viewedRoute = useMemo(() => {
    if (!result?.routes?.length) return null;

    const id = viewedRouteId ?? recommendedRouteId;

    return (
      result.routes.find((route) => route.route_id === id) ??
      result.selected_route ??
      result.routes[0]
    );
  }, [result, viewedRouteId, recommendedRouteId]);

  const analyzeRoutes = async () => {
    if (!canAnalyze) return;

    setLoading(true);
    setError("");
    setResult(null);
    setViewedRouteId(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/agent/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin: origin.trim(),
            destination: destination.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Backend request failed."
        );
      }

      setResult(data);
      setViewedRouteId(data.selected_route?.route_id ?? null);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Could not connect to the SafeRoute backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-slate-900">
      {/* Top navigation */}
      <header className="border-b border-white/10 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold shadow-lg shadow-emerald-500/20">
              SR
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight">
                  SafeRoute
                </h1>
                <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-300">
                  AI
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Risk-aware route intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Prototype
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.17),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.10),_transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-28 pt-16">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              AI-powered route risk analysis
            </div>

            <h2 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Get there smarter.
              <span className="block text-emerald-400">
                Stay ahead of risk.
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Compare candidate routes using weather, flood exposure,
              terrain, disruptions and other risk signals — not just
              distance and travel time.
            </p>
          </div>

          {/* Search panel */}
          <div className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-xl">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  From
                </label>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                  <input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") analyzeRoutes();
                    }}
                    placeholder="Allagadda"
                    className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="hidden text-center text-slate-500 lg:block">
                →
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5">
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  To
                </label>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,0.65)]" />
                  <input
                    value={destination}
                    onChange={(e) =>
                      setDestination(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") analyzeRoutes();
                    }}
                    placeholder="Nandyal"
                    className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!canAnalyze}
                onClick={analyzeRoutes}
                className="rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {loading ? "Analyzing…" : "Analyze routes"}
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 px-3 py-1.5">
              Routing
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1.5">
              Weather
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1.5">
              Risk engine
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1.5">
              AI explanation
            </span>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-6 pb-16">
        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="h-[560px] animate-pulse rounded-[30px] bg-slate-200" />
            <div className="space-y-4">
              <div className="h-52 animate-pulse rounded-[30px] bg-slate-200" />
              <div className="h-72 animate-pulse rounded-[30px] bg-slate-200" />
            </div>
          </div>
        ) : !result ? (
          <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-xl shadow-slate-200/40">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
              🧭
            </div>

            <h3 className="mt-5 text-xl font-semibold">
              Your route intelligence appears here
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Enter a starting point and destination to generate
              candidate routes, compare their risk signals and see
              the AI explanation.
            </p>
          </div>
        ) : (
          <>
            {/* Main result area */}
            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
              {/* Map */}
              <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Live route view
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {result.origin?.display_name?.split(",")[0] ||
                        origin}{" "}
                      <span className="text-slate-400">→</span>{" "}
                      {result.destination?.display_name?.split(",")[0] ||
                        destination}
                    </h3>
                  </div>

                  <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                    {result.routes?.length || 0} candidate
                    {result.routes?.length === 1 ? "" : "s"}
                  </div>
                </div>

                <RouteMap
                  routes={result.routes || []}
                  selectedRouteId={
                    viewedRoute?.route_id ?? recommendedRouteId ?? undefined
                  }
                  origin={result.origin}
                  destination={result.destination}
                  onSelectRoute={(routeId) =>
                    setViewedRouteId(routeId)
                  }
                />
              </div>

              {/* Recommendation panel */}
              <div className="space-y-4">
                <div className="rounded-[30px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-xl shadow-slate-200/40">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Recommended
                      </div>

                      <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                        {result.selected_route
                          ? routeStrategyLabel(result.selected_route)
                          : "Route analysis"}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {result.selected_route?.route_id || "—"}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl px-3 py-2 text-right ${
                        riskMeta(
                          result.selected_route?.risk_score
                        ).badge
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                        Risk
                      </p>
                      <p className="mt-0.5 text-2xl font-bold">
                        {result.selected_route?.risk_score?.toFixed(0) ??
                          "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-400">Distance</p>
                      <p className="mt-1 text-lg font-semibold">
                        {result.selected_route?.distance_km?.toFixed(1) ??
                          "—"}{" "}
                        km
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-xs text-slate-400">Travel time</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatDuration(
                          result.selected_route?.duration_min
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Route details
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {viewedRoute
                          ? routeStrategyLabel(viewedRoute)
                          : "Selected route"}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        riskMeta(viewedRoute?.risk_score).badge
                      }`}
                    >
                      {riskMeta(viewedRoute?.risk_score).label}
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">
                          Overall risk
                        </span>
                        <span className="font-semibold">
                          {viewedRoute?.risk_score?.toFixed(0) ?? "—"} / 100
                        </span>
                      </div>

                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${
                            riskMeta(viewedRoute?.risk_score).bar
                          }`}
                          style={{
                            width: `${Math.min(
                              viewedRoute?.risk_score ?? 0,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-400">
                          Rainfall
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {viewedRoute?.rainfall ?? "—"} mm
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-400">
                          Flood exposure
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {viewedRoute?.flood_risk?.toFixed(0) ?? "—"} / 100
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-400">
                          Disruptions
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {viewedRoute?.disruption_risk?.toFixed(0) ?? "—"} / 100
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs text-slate-400">
                          Elevation
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {viewedRoute?.terrain_elevation ?? "—"} m
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route comparison */}
            <div className="mt-6 rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Compare candidates
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-tight">
                    See how the routes differ
                  </h3>
                </div>

                <p className="text-xs text-slate-400">
                  Click a route to focus it on the map.
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {(result.routes || []).map((route) => {
                  const isRecommended =
                    route.route_id === recommendedRouteId;

                  const isViewed =
                    route.route_id === viewedRouteId;

                  const meta = riskMeta(route.risk_score);

                  return (
                    <button
                      key={route.route_id}
                      type="button"
                      onClick={() => setViewedRouteId(route.route_id)}
                      className={`text-left rounded-3xl border p-5 transition ${
                        isViewed
                          ? "border-emerald-300 bg-emerald-50/70 shadow-md shadow-emerald-100"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isViewed
                                  ? "bg-emerald-500"
                                  : "bg-slate-300"
                              }`}
                            />
                            <span className="text-sm font-semibold">
                              {routeStrategyLabel(route)}
                            </span>

                            {isRecommended && (
                              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                Recommended
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-400">
                            {route.route_id}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-400">
                            Distance
                          </p>
                          <p className="mt-1 text-lg font-semibold">
                            {route.distance_km.toFixed(1)} km
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Time
                          </p>
                          <p className="mt-1 text-lg font-semibold">
                            {formatDuration(route.duration_min)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            Risk score
                          </span>
                          <span className={`font-bold ${meta.text}`}>
                            {route.risk_score.toFixed(0)}
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${meta.bar}`}
                            style={{
                              width: `${Math.min(
                                route.risk_score,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI explanation + weather */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/40">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-xl">
                    ✦
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                      Why this route?
                    </p>

                    <h3 className="mt-1 text-xl font-semibold">
                      AI route explanation
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {result.explanation ||
                        "No explanation was returned by the analysis agent."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Current conditions
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Rainfall</p>
                    <p className="mt-1 text-xl font-semibold">
                      {result.weather?.rainfall ?? "—"} mm
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-400">Temperature</p>
                    <p className="mt-1 text-xl font-semibold">
                      {result.weather?.temperature ?? "—"}°
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                  Weather source:{" "}
                  <span className="font-semibold text-slate-700">
                    {result.weather?.source || "Open-Meteo"}
                  </span>
                </div>
              </div>
            </div>

            {/* Prototype note */}
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs leading-5 text-amber-800">
              <strong>Prototype:</strong> risk scores are transparent
              decision rules for demonstration and are not scientifically
              validated flood predictions.
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-slate-400">
          SafeRoute AI · Risk-aware route intelligence
        </div>
      </footer>
    </main>
  );
}
