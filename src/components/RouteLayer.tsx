"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { Polyline, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import { useRouteCtx } from "@/components/RouteContext";
import { REPORT_LABELS } from "@/lib/routing";

/** flyTo rute saat rute baru diset (sekali per rute) */
function FlyToRoute() {
  const map = useMap();
  const { route } = useRouteCtx();
  useEffect(() => {
    if (!route) return;
    const bounds = L.latLngBounds(route.result.chosen.coords.map((c) => L.latLng(c[0], c[1])));
    map.flyToBounds(bounds, { padding: [48, 96], maxZoom: 16, duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);
  return null;
}

/** Tutup popup (mis. tempat) supaya kartu rute terlihat jelas saat rute tampil */
function ClosePopups() {
  const map = useMap();
  const { route } = useRouteCtx();
  useMapEvents({
    popupopen: () => {
      if (route) map.closePopup();
    },
  });
  return null;
}

export default function RouteLayer() {
  const { route } = useRouteCtx();
  if (!route) return null;

  const { result, showCompare } = route;
  const chosen = result.chosen;
  const showFastestGhost =
    showCompare && result.fastest !== chosen;

  return (
    <>
      <Polyline
        positions={chosen.coords}
        pathOptions={{
          color: "#0f766e",
          weight: 6,
          opacity: 0.9,
          lineCap: "round",
        }}
        aria-label="Rute aman yang dipilih"
      />
      {showFastestGhost && (
        <Polyline
          positions={result.fastest.coords}
          pathOptions={{
            color: "#64748b",
            weight: 4,
            opacity: 0.55,
            dashArray: "8 10",
          }}
          interactive={false}
          aria-hidden="true"
        />
      )}
      {/* Insiden yang dihindari rute tercepat — merah, bisa diketuk */}
      {result.avoidedIncidents.map((inc, i) => (
        <CircleMarker
          key={`avoid-${i}`}
          center={[inc.report.lat, inc.report.lng]}
          radius={9}
          pathOptions={{
            color: "#dc2626",
            weight: 3,
            fillColor: "#dc2626",
            fillOpacity: 0.35,
          }}
          aria-label={`Bahaya dihindari: ${REPORT_LABELS[inc.report.type]}`}
        >
          <Popup>
            <strong>{inc.report.title}</strong>
            <br />
            {REPORT_LABELS[inc.report.type]} — dihindari Rute Aman
          </Popup>
        </CircleMarker>
      ))}
      {/* Insiden yang tetap di jalur terpilih — amber */}
      {result.chosenIncidents.map((inc, i) => (
        <CircleMarker
          key={`onroute-${i}`}
          center={[inc.report.lat, inc.report.lng]}
          radius={7}
          pathOptions={{
            color: "#d97706",
            weight: 3,
            fillColor: "#d97706",
            fillOpacity: 0.3,
          }}
          aria-label={`Bahaya di jalur: ${REPORT_LABELS[inc.report.type]}`}
        >
          <Popup>
            <strong>{inc.report.title}</strong>
            <br />
            {REPORT_LABELS[inc.report.type]} — tetap di jalur, waspada
          </Popup>
        </CircleMarker>
      ))}
      <FlyToRoute />
      <ClosePopups />
    </>
  );
}
