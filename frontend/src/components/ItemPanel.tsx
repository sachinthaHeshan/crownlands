"use client";

import { ITEMS, type PlaceableItem } from "@/game/items";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type ItemPanelProps = {
  open: boolean;
  draggingId: string | null;
  onClose: () => void;
  onPickItem: (
    item: PlaceableItem,
    html5?: boolean,
    pointerId?: number,
  ) => void;
};

export default function ItemPanel({
  open,
  draggingId,
  onClose,
  onPickItem,
}: ItemPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-30">
      <button
        type="button"
        aria-label="Close items"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-panel-title"
        className="absolute inset-y-0 right-0 flex w-[min(18rem,70vw)] flex-col border-l border-white/10 bg-zinc-950/97 shadow-2xl"
        style={{ paddingRight: "env(safe-area-inset-right)" }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-xs font-medium tracking-widest text-emerald-400/90 uppercase">
              Build
            </p>
            <h2
              id="item-panel-title"
              className="mt-1 text-sm font-semibold text-zinc-100"
            >
              Items
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
          >
            Close
          </button>
        </div>
        <ul className="flex flex-1 flex-col gap-3 overflow-y-auto p-3 [touch-action:pan-y]">
          {ITEMS.map((item) => {
            const src = `${basePath}${item.src}`;
            const isDragging = draggingId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  draggable
                  onClick={() => onPickItem(item)}
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
                  <div className="mx-auto aspect-square w-full max-w-[140px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      draggable={false}
                      className="pointer-events-none h-full w-full object-contain"
                    />
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
    </div>
  );
}
