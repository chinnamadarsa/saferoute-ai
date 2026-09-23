"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

type Route = {
  route_id: string;
  strategy?: string;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  distance_km?: number;
  duration_min?: number;
  risk_score?: number;
};

type LocationPoint = {
  latitude: number;
  longitude: number;
  display_name?: string;
};

type Props = {
  routes: Route[];
  selectedRouteId?: string;
  origin?: LocationPoint;
  destination?: LocationPoint;
  onSelectRoute?: (routeId: string) => void;
};

function FitRoutes({
  routes,
  origin,
  destination,
}: {
  routes: Route[];
  origin?: LocationPoint;
  destination?: LocationPoint;
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];

    routes.forEach((route) => {
      route.geometry?.coordinates?.forEach(([lon, lat]) => {
        points.push([lat, lon]);
      });
    });

    if (origin) {
      points.push([origin.latitude, origin.longitude]);
    }

    if (destination) {
      points.push([destination.latitude, destination.longitude]);
    }

    if (points.length > 0) {
      const bounds = points as [number, number][];
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 11,
      });
    }
  }, [map, routes, origin, destination]);

  return null;
}

function riskColor(score = 0) {
  if (score >= 80) return "#e11d48";
  if (score >= 60) return "#f97316";
  if (score >= 31) return "#f59e0b";
  return "#10b981";
}

export default function RouteMap({
  routes,
  selectedRouteId,
  origin,
  destination,
  onSelectRoute,
}: Props) {
  const firstPoint =
    origin ??
    (routes[0]?.geometry?.coordinates?.[0]
      ? {
          latitude: routes[0].geometry.coordinates[0][1],
          longitude: routes[0].geometry.coordinates[0][0],
        }
      : {
          latitude: 15.135,
          longitude: 78.51,
        });

  return (
    <div className="relative h-[560px]">
      <MapContainer
        center={[firstPoint.latitude, firstPoint.longitude]}
        zoom={10}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitRoutes
          routes={routes}
          origin={origin}
          destination={destination}
        />

        {routes.map((route, index) => {
          const selected = route.route_id === selectedRouteId;
          const baseColor = riskColor(route.risk_score);

          return (
            <GeoJSON
              key={`${route.route_id}-${selected ? "selected" : "normal"}`}
              data={route.geometry as any}
              style={{
                color: selected ? baseColor : "#64748b",
                weight: selected ? 7 : 4,
                opacity: selected ? 0.95 : 0.45,
                lineCap: "round",
                lineJoin: "round",
                dashArray: selected ? undefined : "8 10",
              }}
              eventHandlers={{
                click: () =>
                  onSelectRoute?.(route.route_id),
              }}
            />
          );
        })}

        {origin && (
          <CircleMarker
            center={[origin.latitude, origin.longitude]}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              fillColor: "#10b981",
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="text-sm font-semibold">
                Start
              </div>
              <div className="mt-1 text-xs">
                {origin.display_name || "Origin"}
              </div>
            </Popup>
          </CircleMarker>
        )}

        {destination && (
          <CircleMarker
            center={[destination.latitude, destination.longitude]}
            radius={9}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              fillColor: "#f43f5e",
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="text-sm font-semibold">
                Destination
              </div>
              <div className="mt-1 text-xs">
                {destination.display_name || "Destination"}
              </div>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>

      {/* Map legend */}
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
          Map legend
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-700">
          <span className="h-2.5 w-7 rounded-full bg-emerald-500" />
          Selected route
        </div>

        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-700">
          <span className="h-0 w-7 border-t-2 border-dashed border-slate-400" />
          Alternatives
        </div>
      </div>
    </div>
  );
}
