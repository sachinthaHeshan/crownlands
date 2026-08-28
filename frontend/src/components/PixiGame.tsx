"use client";

import { useEffect, useRef, useState } from "react";
import ItemPanel from "@/components/ItemPanel";
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  cellCorners,
  cellKey,
  footprintCells,
  gridToWorld,
  isFootprintInBounds,
  snapFootprintOrigin,
  worldToGrid,
} from "@/game/iso";
import { ITEMS, type PlaceableItem } from "@/game/items";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const LAND_IMAGE = `${basePath}/background/land.png`;

type GameApi = {
  beginDrag: (item: PlaceableItem, html5?: boolean) => void;
  hover: (clientX: number, clientY: number) => void;
  drop: () => void;
};

function fitWorldToScreen(
  screenWidth: number,
  screenHeight: number,
): { scale: number; x: number; y: number } {
  const scale = Math.min(screenWidth / MAP_WIDTH, screenHeight / MAP_HEIGHT);
  return {
    scale,
    x: (screenWidth - MAP_WIDTH * scale) / 2,
    y: (screenHeight - MAP_HEIGHT * scale) / 2,
  };
}

async function loadTexture(src: string) {
  const { Texture } = await import("pixi.js");
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
  return Texture.from(image);
}

export default function PixiGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<GameApi | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    let app: import("pixi.js").Application | null = null;
    let world: import("pixi.js").Container | null = null;
    let destroyed = false;
    let stopDrag: (() => void) | null = null;

    async function init() {
      try {
        const { Application, Container, Graphics, Sprite } = await import(
          "pixi.js"
        );

        if (!containerRef.current || destroyed) {
          return;
        }

        app = new Application();
        await app.init({
          resizeTo: containerRef.current,
          backgroundColor: 0x1c2a36,
          antialias: true,
          preference: "webgl",
          preserveDrawingBuffer: true,
        });

        if (destroyed || !containerRef.current) {
          app.destroy(true);
          return;
        }

        containerRef.current.appendChild(app.canvas);

        const landTexture = await loadTexture(LAND_IMAGE);
        const itemTextures: Record<string, import("pixi.js").Texture> = {};
        for (const item of ITEMS) {
          itemTextures[item.id] = await loadTexture(`${basePath}${item.src}`);
        }

        if (destroyed) {
          landTexture.destroy(true);
          return;
        }

        world = new Container();
        world.sortableChildren = true;
        app.stage.addChild(world);

        const background = new Sprite(landTexture);
        background.width = MAP_WIDTH;
        background.height = MAP_HEIGHT;
        background.zIndex = 0;
        world.addChild(background);

        const itemsLayer = new Container();
        itemsLayer.zIndex = 2;
        itemsLayer.sortableChildren = true;
        world.addChild(itemsLayer);

        const ghostGrid = new Graphics();
        ghostGrid.zIndex = 3;
        world.addChild(ghostGrid);

        const ghostSprite = new Sprite();
        ghostSprite.alpha = 0.6;
        ghostSprite.visible = false;
        ghostSprite.zIndex = 4;
        world.addChild(ghostSprite);

        const occupied = new Set<string>();
        let dragItem: PlaceableItem | null = null;
        let hoverOrigin: { col: number; row: number } | null = null;
        let html5DragActive = false;

        const layout = () => {
          if (!app || !world) {
            return;
          }
          const { scale, x, y } = fitWorldToScreen(
            app.screen.width,
            app.screen.height,
          );
          world.scale.set(scale);
          world.position.set(x, y);
        };

        layout();
        app.renderer.on("resize", layout);

        function clientToWorld(clientX: number, clientY: number) {
          if (!app || !world) {
            return null;
          }
          const rect = app.canvas.getBoundingClientRect();
          const localX =
            ((clientX - rect.left) * app.screen.width) / rect.width;
          const localY =
            ((clientY - rect.top) * app.screen.height) / rect.height;
          return {
            x: (localX - world.x) / world.scale.x,
            y: (localY - world.y) / world.scale.y,
          };
        }

        function canPlace(item: PlaceableItem, col: number, row: number) {
          if (!isFootprintInBounds(col, row, item.cols, item.rows)) {
            return false;
          }
          return footprintCells(col, row, item.cols, item.rows).every(
            (cell) => !occupied.has(cellKey(cell.col, cell.row)),
          );
        }

        function layoutItemSprite(
          sprite: import("pixi.js").Sprite,
          item: PlaceableItem,
          col: number,
          row: number,
        ) {
          const north = gridToWorld(col, row);
          const east = gridToWorld(col + item.cols, row);
          const west = gridToWorld(col, row + item.rows);
          const south = gridToWorld(col + item.cols, row + item.rows);
          const worldW = east.x - west.x;
          const worldH = south.y - north.y;
          const grassW = item.base.east.x - item.base.west.x;
          const grassH = item.base.south.y - item.base.north.y;
          sprite.scale.set(worldW / grassW, worldH / grassH);
          sprite.anchor.set(
            item.base.south.x / item.textureWidth,
            item.base.south.y / item.textureHeight,
          );
          sprite.position.set(south.x, south.y);
          sprite.zIndex = col + row;
        }

        function drawFootprint(
          graphics: import("pixi.js").Graphics,
          item: PlaceableItem,
          col: number,
          row: number,
          valid: boolean,
          filled = true,
        ) {
          graphics.clear();
          const color = valid ? 0x22c55e : 0xef4444;
          const cells = footprintCells(col, row, item.cols, item.rows);

          if (filled) {
            for (const cell of cells) {
              const [north, east, south, west] = cellCorners(
                cell.col,
                cell.row,
              );
              graphics.poly(
                [
                  north.x,
                  north.y,
                  east.x,
                  east.y,
                  south.x,
                  south.y,
                  west.x,
                  west.y,
                ],
                true,
              );
              graphics.fill({ color, alpha: 0.32 });
            }
          }

          for (const cell of cells) {
            const [north, east, south, west] = cellCorners(cell.col, cell.row);
            graphics.poly(
              [
                north.x,
                north.y,
                east.x,
                east.y,
                south.x,
                south.y,
                west.x,
                west.y,
              ],
              true,
            );
            graphics.stroke({
              width: filled ? 2.2 : 1.8,
              color: filled ? color : 0xffffff,
              alpha: filled ? 0.95 : 0.7,
            });
          }
        }

        function hideGhost() {
          ghostSprite.visible = false;
          ghostGrid.clear();
          hoverOrigin = null;
        }

        function updateHover(clientX: number, clientY: number) {
          if (!dragItem) {
            return;
          }
          const rect = app?.canvas.getBoundingClientRect();
          if (
            !rect ||
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
          ) {
            hideGhost();
            return;
          }
          const worldPoint = clientToWorld(clientX, clientY);
          if (!worldPoint) {
            hideGhost();
            return;
          }
          const grid = worldToGrid(worldPoint);
          if (!grid) {
            hideGhost();
            return;
          }

          const origin = snapFootprintOrigin(
            grid.x,
            grid.y,
            dragItem.cols,
            dragItem.rows,
          );
          hoverOrigin = origin;
          const valid = canPlace(dragItem, origin.col, origin.row);
          const texture = itemTextures[dragItem.id];
          if (texture) {
            ghostSprite.texture = texture;
          }
          layoutItemSprite(ghostSprite, dragItem, origin.col, origin.row);
          ghostSprite.alpha = 0.6;
          ghostSprite.visible = true;
          drawFootprint(ghostGrid, dragItem, origin.col, origin.row, valid);
        }

        function placeItem(item: PlaceableItem, col: number, row: number) {
          const texture = itemTextures[item.id];
          if (!texture) {
            return;
          }
          const sprite = new Sprite(texture);
          layoutItemSprite(sprite, item, col, row);
          itemsLayer.addChild(sprite);
          for (const cell of footprintCells(col, row, item.cols, item.rows)) {
            occupied.add(cellKey(cell.col, cell.row));
          }
        }

        function onPointerMove(event: PointerEvent) {
          updateHover(event.clientX, event.clientY);
        }

        function onDragOver(event: DragEvent) {
          event.preventDefault();
          html5DragActive = true;
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "copy";
          }
          updateHover(event.clientX, event.clientY);
        }

        function endDrag() {
          dragItem = null;
          html5DragActive = false;
          hideGhost();
          setDraggingId(null);
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
          window.removeEventListener("dragover", onDragOver);
          window.removeEventListener("drop", onWindowDrop);
          window.removeEventListener("dragend", onDragEnd);
        }

        function commitDrop() {
          if (dragItem && hoverOrigin) {
            if (canPlace(dragItem, hoverOrigin.col, hoverOrigin.row)) {
              placeItem(dragItem, hoverOrigin.col, hoverOrigin.row);
            }
          }
          endDrag();
        }

        function onPointerUp() {
          if (html5DragActive) {
            return;
          }
          commitDrop();
        }

        function onWindowDrop(event: DragEvent) {
          event.preventDefault();
          updateHover(event.clientX, event.clientY);
          commitDrop();
        }

        function onDragEnd() {
          endDrag();
        }

        function beginDrag(item: PlaceableItem, html5 = false) {
          if (!dragItem) {
            setDraggingId(item.id);
            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
            window.addEventListener("dragover", onDragOver);
            window.addEventListener("drop", onWindowDrop);
            window.addEventListener("dragend", onDragEnd);
          }
          dragItem = item;
          if (html5) {
            html5DragActive = true;
          }
        }

        stopDrag = endDrag;

        gameRef.current = {
          beginDrag,
          hover: (clientX: number, clientY: number) => {
            html5DragActive = true;
            updateHover(clientX, clientY);
          },
          drop: commitDrop,
        };
      } catch (error) {
        console.error("PixiGame failed to start", error);
      }
    }

    void init();

    return () => {
      destroyed = true;
      stopDrag?.();
      gameRef.current = null;
      app?.destroy(true, { children: true });
    };
  }, []);

  return (
    <div className="flex h-full w-full">
      <div
        ref={containerRef}
        className="h-full min-w-0 flex-1"
        aria-label="Game canvas"
        onDragOver={(event) => {
          event.preventDefault();
          gameRef.current?.hover(event.clientX, event.clientY);
        }}
        onDrop={(event) => {
          event.preventDefault();
          gameRef.current?.hover(event.clientX, event.clientY);
          gameRef.current?.drop();
        }}
      />
      <ItemPanel
        draggingId={draggingId}
        onPickItem={(item, html5) => {
          gameRef.current?.beginDrag(item, html5);
        }}
      />
    </div>
  );
}
