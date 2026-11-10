const FILES = {
  sky: "bg_clear_sky.png",
  cloud: "cloud_fluffy.png",
  island: "island_chunk.png",
  pad: "bounce_pad.png",
  mailbox: "mailbox.png",
  flag: "wind_flag.png",
  fox: "fox_courier.png",
  parcel: "parcel.png",
} as const;

export type SpriteName = keyof typeof FILES;

interface Entry {
  img: HTMLImageElement;
  failed: boolean;
}

const cache = new Map<SpriteName, Entry>();
let started = false;

function assetUrl(file: string): string {
  const meta = import.meta as { env?: { BASE_URL?: string } };
  const base = meta.env?.BASE_URL ?? "./";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}assets/${file}`;
}

/** Start each sprite request once. Later frames only read the cache. */
export function preloadSprites(): void {
  if (started || typeof Image === "undefined") return;
  started = true;
  for (const name of Object.keys(FILES) as SpriteName[]) {
    const img = new Image();
    const entry: Entry = { img, failed: false };
    img.onerror = () => {
      entry.failed = true;
    };
    img.src = assetUrl(FILES[name]);
    cache.set(name, entry);
  }
}

/** Null until the image has decoded, or forever if it failed. Callers draw the old shapes. */
export function spriteImage(name: SpriteName): HTMLImageElement | null {
  preloadSprites();
  const entry = cache.get(name);
  if (!entry || entry.failed) return null;
  if (!entry.img.complete) return null;
  if (entry.img.naturalWidth <= 0) {
    entry.failed = true;
    return null;
  }
  return entry.img;
}
