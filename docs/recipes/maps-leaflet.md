# Receta: mapa con Leaflet + OpenStreetMap (geocodificación con Nominatim)

Muestra la ubicación de un registro a partir de su dirección en texto, sin pedir coordenadas ni claves.
- Un Server Component geocodifica con Nominatim (con caché).
- El navegador dibuja el mapa con Leaflet.
- Hay un enlace de respaldo a Google Maps, que tampoco requiere clave.

## 1. Dependencias (`apps/web`)

```bash
npm install -w @portal/web leaflet@^1.9.4 react-leaflet@^5.0.0
npm install -w @portal/web -D @types/leaflet@^1.9.22
```

(Versiones verificadas en el proyecto de origen con Next 16 + React 19.)

## 2. Variables de entorno

Ninguna nueva. Nominatim exige un `User-Agent` identificable: se arma con `NEXT_PUBLIC_SITE_URL`, que ya existe.

## 3. Geocodificación (`apps/web/src/lib/geocoding.ts`, solo servidor)

```ts
const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const CACHE_SECONDS = 60 * 60 * 24 * 30;

export type MapLocation = { latitude: number; longitude: number; zoom: number };

/** Point of an address, or null on any failure (the page still renders, with only the link). */
export async function geocodeAddress(query: string, countryCode?: string): Promise<MapLocation | null> {
  try {
    const params = new URLSearchParams({ format: "jsonv2", limit: "1", q: query, ...(countryCode ? { countrycodes: countryCode } : {}) });
    const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params}`, {
      // Usage policy: identifying User-Agent and cached results (~1 request/s max).
      headers: { "User-Agent": `<AppName>/0.1 (+${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"})`, "Accept-Language": "es" },
      next: { revalidate: CACHE_SECONDS },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const [result] = (await response.json()) as { lat: string; lon: string }[];
    const latitude = Number(result?.lat);
    const longitude = Number(result?.lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude, zoom: 16 } : null;
  } catch {
    return null;
  }
}

export const buildGoogleMapsUrl = (query: string) => `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
```

En el origen, si no se encontraba la calle, se reintentaba solo con la comuna (zoom 13).
Con tráfico real, guarda las coordenadas en la BD desde la API al crear o editar el registro, en vez de geocodificar en cada render.

## 4. Mapa en el navegador

`components/map/map-loader.tsx`:

```tsx
"use client";
import dynamic from "next/dynamic";

// Leaflet touches `window` on import: browser only.
export const MapLoader = dynamic(() => import("./map-canvas"), {
  ssr: false,
  loading: () => <div role="status" className="flex size-full items-center justify-center text-sm text-muted">Cargando mapa…</div>,
});
```

`components/map/map-canvas.tsx` (mínimo):

```tsx
"use client";
import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import type { MapLocation } from "@/lib/geocoding";

// Inline SVG pin: no marker images to bundle. Anchor = tip of the pin.
const pinIcon = divIcon({
  className: "",
  html: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42" aria-hidden="true"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 41 16 41s15-14 15-25.2C31 7.6 24.3 1 16 1Z" fill="#dc2626" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15.5" r="5.5" fill="#fff"/></svg>',
  iconSize: [32, 42],
  iconAnchor: [16, 41],
});

export default function MapCanvas({ location, label }: { location: MapLocation; label: string }) {
  const center: [number, number] = [location.latitude, location.longitude];
  return (
    // MapContainer does not forward ARIA props: the accessible name goes on a wrapper.
    <div role="region" aria-label={label} className="size-full">
      <MapContainer center={center} zoom={location.zoom} scrollWheelZoom={false} className="size-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={center} icon={pinIcon} keyboard={false} interactive={false} />
      </MapContainer>
    </div>
  );
}
```

Uso en la página de detalle (Server Component):

```tsx
const location = await geocodeAddress(item.address);
{location && (
  // `isolate z-0` keeps Leaflet's panes (z-index 400+) below the sticky header.
  <div className="relative isolate z-0 aspect-[16/9] overflow-hidden rounded-[1.25rem] border border-line">
    <MapLoader location={location} label={`Mapa de ubicación: ${item.address}`} />
  </div>
)}
<a href={buildGoogleMapsUrl(item.address)} target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a>
```

Mejora opcional del origen: rueda del ratón desactivada hasta que se hace clic en el mapa, con un aviso «Haz clic en el mapa para hacer zoom». Así el mapa no secuestra el scroll de la página.

## 5. Validación

- Unit: `geocodeAddress` con `fetch` simulado (punto válido; respuesta vacía → null; error de red → null) y `buildGoogleMapsUrl`.
- Componente: `renderToStaticMarkup` del contenedor. Leaflet no corre en Node: prueba que el loader muestra «Cargando mapa…».
- Navegador: el mapa no tapa el header fijo, la atribución de OSM es visible y no hay errores en consola.

## 6. Reversión

Desinstala los tres paquetes y borra `lib/geocoding.ts` y `components/map/`. Quita los usos en las páginas.
