/**
 * Unit test murni src/lib/places.ts — jalankan: npx tsx scripts/test-places.ts
 * Pola sama dengan scripts/test-routing.ts (tanpa framework, assert manual).
 */
import {
  PLACE_CATEGORIES,
  PLACE_CATEGORY_VALUES,
  validatePlaceDraft,
  type PlaceDraft,
} from "../src/lib/places";

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.error(`  ❌ ${name}`);
  }
}

/** Valid draft dasar — semua varian turun dari ini */
function baseDraft(over: Partial<PlaceDraft> = {}): PlaceDraft {
  return {
    name: "Pos Keamanan Harapan Indah",
    type: "pos_keamanan",
    lat: -6.2445,
    lng: 106.9995,
    address: "Jl. Ahmad Yani, Bekasi",
    open: "06:00",
    close: "23:00",
    phone: "110",
    ...over,
  };
}

console.log("== PLACE_CATEGORIES ==");

check(
  "8 kategori sesuai PlaceType existing",
  PLACE_CATEGORY_VALUES.length === 8 &&
    (["polisi", "rumah_sakit", "puskesmas", "masjid", "toko", "mall", "stasiun", "pos_keamanan"] as const).every(
      (v) => PLACE_CATEGORY_VALUES.includes(v)
    )
);
check(
  "tiap kategori punya label & ikon (komponen Lucide valid)",
  PLACE_CATEGORIES.every(
    (c) => c.label.trim().length > 0 && typeof c.icon !== "undefined" && c.icon !== null && "render" in c.icon
  )
);

console.log("== validatePlaceDraft: kasus VALID ==");

check("draft normal valid", validatePlaceDraft(baseDraft()) === null);
check(
  "24 jam (00:00–00:00) valid",
  validatePlaceDraft(baseDraft({ open: "00:00", close: "00:00" })) === null
);
check(
  "lintas tengah malam (18:00–02:00) valid — isOpenNow menanganinya",
  validatePlaceDraft(baseDraft({ open: "18:00", close: "02:00" })) === null
);
check(
  "phone null (opsional) valid",
  validatePlaceDraft(baseDraft({ phone: null })) === null
);
check(
  "nama 120 char masih valid (batas)",
  validatePlaceDraft(baseDraft({ name: "A".repeat(120) })) === null
);
check(
  "alamat opsional — string kosong valid",
  validatePlaceDraft(baseDraft({ address: "" })) === null
);

console.log("== validatePlaceDraft: kasus INVALID ==");

check(
  "nama kosong → error",
  typeof validatePlaceDraft(baseDraft({ name: "   " })) === "string"
);
check(
  "nama 121 char → error",
  typeof validatePlaceDraft(baseDraft({ name: "A".repeat(121) })) === "string"
);
check(
  "kategori invalid → error",
  typeof validatePlaceDraft(baseDraft({ type: "bank" as never })) === "string"
);
check(
  "lat bukan angka → error",
  typeof validatePlaceDraft(baseDraft({ lat: NaN })) === "string"
);
check(
  "lng bukan angka → error",
  typeof validatePlaceDraft(baseDraft({ lng: Number("x") })) === "string"
);
check(
  "lat jauh dari Bekasi (40.7) → error",
  typeof validatePlaceDraft(baseDraft({ lat: 40.7128 })) === "string"
);
check(
  "lng jauh dari Bekasi (13.4) → error",
  typeof validatePlaceDraft(baseDraft({ lng: 13.405 })) === "string"
);
check(
  "jam format salah (9.00) → error",
  typeof validatePlaceDraft(baseDraft({ open: "9.00" })) === "string"
);
check(
  "jam 25:00 → error",
  typeof validatePlaceDraft(baseDraft({ close: "25:00" })) === "string"
);
check(
  "jam 23:7 (1 digit menit) → error",
  typeof validatePlaceDraft(baseDraft({ close: "23:7" })) === "string"
);
check(
  "open kosong string → error",
  typeof validatePlaceDraft(baseDraft({ open: "" })) === "string"
);

console.log(`\n${pass} lulus, ${fail} gagal dari ${pass + fail} test.`);
if (fail > 0) process.exit(1);
