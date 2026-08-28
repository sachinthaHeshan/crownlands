"use client";

import { ITEMS, type PlaceableItem } from "@/game/items";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type ItemPanelProps = {
  draggingId: string | null;
  onPickItem: (item: PlaceableItem, html5?: boolean) => void;
};

export default function ItemPanel({ draggingId, onPickItem }: ItemPanelProps) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-l border-white/10 bg-zinc-950/95">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs font-medium tracking-widest text-emerald-400/90 uppercase">
          Build
        </p>
        <h2 className="mt-1 text-sm font-semibold text-zinc-100">Items</h2>
      </div>
      <ul className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {ITEMS.map((item) => {
          const src = `${basePath}${item.src}`;
          const isDragging = draggingId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                draggable
                onPointerDown={() => onPickItem(item)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";
                  event.dataTransfer.setData("text/plain", item.id);
                  const blank = document.createElement("canvas");
                  blank.width = 1;
                  blank.height = 1;
                  event.dataTransfer.setDragImage(blank, 0, 0);
                  onPickItem(item, true);
                }}
                className={`w-full cursor-grab rounded-xl border border-white/10 bg-zinc-900/80 p-3 text-left shadow-sm transition hover:border-emerald-400/40 hover:bg-zinc-800 active:cursor-grabbing ${
                  isDragging ? "opacity-40" : ""
                }`}
              >
                <div className="relative mx-auto aspect-square w-full max-w-[140px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="pointer-events-none h-full w-full object-contain"
                  />
                  <FootprintOverlay />
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-100">
                  {item.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {item.cols}×{item.rows} cells
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function FootprintOverlay() {
  return (
    <svg
      viewBox="0 0 80 40"
      className="pointer-events-none absolute inset-x-0 bottom-[8%] mx-auto h-[28%] w-[70%] opacity-90"
      aria-hidden
    >
      <polygon
        points="40,0 80,20 40,40 0,20"
        fill="none"
        stroke="white"
        strokeWidth="1.6"
      />
      <line x1="40" y1="0" x2="40" y2="40" stroke="white" strokeWidth="1.2" />
      <line x1="0" y1="20" x2="80" y2="20" stroke="white" strokeWidth="1.2" />
    </svg>
  );
}
