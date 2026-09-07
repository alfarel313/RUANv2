"use client";

import MapShell from "@/components/MapShell";
import BeaconLayer from "@/components/BeaconLayer";
import PlaceLayer from "@/components/PlaceLayer";
import { usePresenceCtx } from "@/components/PresenceContext";

export default function LiveMap() {
  const { beacons } = usePresenceCtx();
  return (
    <MapShell>
      <PlaceLayer />
      <BeaconLayer beacons={beacons} />
    </MapShell>
  );
}
