import type { Point } from "@/game/iso";

export type PlaceableItem = {
  id: string;
  name: string;
  src: string;
  cols: number;
  rows: number;
  textureWidth: number;
  textureHeight: number;
  /** Grass diamond in texture pixels, used to sit the sprite on the land grid. */
  base: {
    north: Point;
    east: Point;
    west: Point;
    south: Point;
  };
};

export const ITEMS: PlaceableItem[] = [
  {
    id: "tree",
    name: "Tree",
    src: "/items/tree.png",
    cols: 2,
    rows: 2,
    textureWidth: 600,
    textureHeight: 544,
    base: {
      north: { x: 297, y: 238 },
      east: { x: 581, y: 380 },
      west: { x: 12, y: 380 },
      south: { x: 296, y: 522 },
    },
  },
];

export function getItem(id: string): PlaceableItem | undefined {
  return ITEMS.find((item) => item.id === id);
}
