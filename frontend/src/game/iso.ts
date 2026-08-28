/** Land art size in pixels (`public/background/land.png`). */
export const MAP_WIDTH = 1536;
export const MAP_HEIGHT = 1024;

/**
 * Walkable top face of the island, in image pixels.
 * South is independent of the other three so the diamond can
 * stretch down to the land's bottom tip.
 */
export const LAND_DIAMOND = {
  north: { x: 736, y: 112 },
  east: { x: 1468, y: 428 },
  west: { x: 58, y: 408 },
  south: { x: 780, y: 882 },
} as const;

export const GRID_COLS = 24;
export const GRID_ROWS = 24;

export type Point = { x: number; y: number };

export type GridCell = { col: number; row: number };

function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/** Map tile vertex (col, row) to image/world pixels. */
export function gridToWorld(col: number, row: number): Point {
  const u = col / GRID_COLS;
  const v = row / GRID_ROWS;
  const northEast = lerp(LAND_DIAMOND.north, LAND_DIAMOND.east, u);
  const westSouth = lerp(LAND_DIAMOND.west, LAND_DIAMOND.south, u);
  return lerp(northEast, westSouth, v);
}

/**
 * Inverse of gridToWorld. Returns fractional grid coordinates,
 * which may fall slightly outside the map near the edges.
 */
export function worldToGrid(point: Point): Point | null {
  const a = LAND_DIAMOND.north;
  const b = LAND_DIAMOND.east;
  const c = LAND_DIAMOND.south;
  const d = LAND_DIAMOND.west;

  const e = { x: b.x - a.x, y: b.y - a.y };
  const f = { x: d.x - a.x, y: d.y - a.y };
  const g = { x: a.x - b.x + c.x - d.x, y: a.y - b.y + c.y - d.y };
  const h = { x: point.x - a.x, y: point.y - a.y };

  const k2 = g.x * f.y - g.y * f.x;
  const k1 = e.x * f.y - e.y * f.x + h.x * g.y - h.y * g.x;
  const k0 = h.x * e.y - h.y * e.x;

  let u: number;
  let v: number;

  if (Math.abs(k2) < 1e-6) {
    if (Math.abs(k1) < 1e-6) {
      return null;
    }
    v = -k0 / k1;
    const denom = e.x + g.x * v;
    if (Math.abs(denom) < 1e-6) {
      return null;
    }
    u = (h.x - f.x * v) / denom;
  } else {
    const disc = k1 * k1 - 4 * k0 * k2;
    if (disc < 0) {
      return null;
    }
    const sqrtDisc = Math.sqrt(disc);
    const v1 = (-k1 - sqrtDisc) / (2 * k2);
    const v2 = (-k1 + sqrtDisc) / (2 * k2);
    const u1 = (h.x - f.x * v1) / (e.x + g.x * v1);
    const u2 = (h.x - f.x * v2) / (e.x + g.x * v2);
    const uv = pickUv(u1, v1, u2, v2);
    if (!uv) {
      return null;
    }
    u = uv.u;
    v = uv.v;
  }

  return {
    x: u * GRID_COLS,
    y: v * GRID_ROWS,
  };
}

function pickUv(
  u1: number,
  v1: number,
  u2: number,
  v2: number,
): { u: number; v: number } | null {
  const score = (u: number, v: number) => {
    const du = u < 0 ? -u : u > 1 ? u - 1 : 0;
    const dv = v < 0 ? -v : v > 1 ? v - 1 : 0;
    return du + dv;
  };
  const s1 = Number.isFinite(u1) && Number.isFinite(v1) ? score(u1, v1) : Infinity;
  const s2 = Number.isFinite(u2) && Number.isFinite(v2) ? score(u2, v2) : Infinity;
  if (s1 === Infinity && s2 === Infinity) {
    return null;
  }
  return s1 <= s2 ? { u: u1, v: v1 } : { u: u2, v: v2 };
}

export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function footprintCells(
  originCol: number,
  originRow: number,
  cols: number,
  rows: number,
): GridCell[] {
  const cells: GridCell[] = [];
  for (let row = originRow; row < originRow + rows; row += 1) {
    for (let col = originCol; col < originCol + cols; col += 1) {
      cells.push({ col, row });
    }
  }
  return cells;
}

export function isFootprintInBounds(
  originCol: number,
  originRow: number,
  cols: number,
  rows: number,
): boolean {
  return (
    originCol >= 0 &&
    originRow >= 0 &&
    originCol + cols <= GRID_COLS &&
    originRow + rows <= GRID_ROWS
  );
}

/** Four corners of one land cell, clockwise from north. */
export function cellCorners(col: number, row: number): [Point, Point, Point, Point] {
  return [
    gridToWorld(col, row),
    gridToWorld(col + 1, row),
    gridToWorld(col + 1, row + 1),
    gridToWorld(col, row + 1),
  ];
}

export function snapFootprintOrigin(
  fracCol: number,
  fracRow: number,
  cols: number,
  rows: number,
): GridCell {
  return {
    col: Math.round(fracCol - cols / 2),
    row: Math.round(fracRow - rows / 2),
  };
}
