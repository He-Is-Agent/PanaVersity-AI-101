/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Maze, Position } from "./types";

// Helper to generate coordinates of a straight line of wall
function generateLine(x1: number, y1: number, x2: number, y2: number): Position[] {
  const line: Position[] = [];
  const startX = Math.min(x1, x2);
  const endX = Math.max(x1, x2);
  const startY = Math.min(y1, y2);
  const endY = Math.max(y1, y2);

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      line.push({ x, y });
    }
  }
  return line;
}

// Generate Maze list based on a 40x20 grid (x: 0-39, y: 0-19)
export const getMazes = (): Maze[] => {
  const mazes: Maze[] = [];

  // 1. Classic Open (Default)
  mazes.push({
    id: "open",
    name: "Classic Open",
    walls: [],
    hasWrapBorders: true,
  });

  // 2. Box-in-Box
  // Represents a smaller inner box in the center, with gates on all four sides.
  const boxInBoxWalls: Position[] = [
    // Interior box spanning from x: 10 to 30, y: 5 to 14, with gaps in the middle
    ...generateLine(10, 5, 17, 5),      // Top left
    ...generateLine(22, 5, 30, 5),      // Top right
    ...generateLine(10, 14, 17, 14),    // Bottom left
    ...generateLine(22, 14, 30, 14),    // Bottom right
    
    ...generateLine(10, 6, 10, 8),      // Left top
    ...generateLine(10, 11, 10, 13),    // Left bottom
    ...generateLine(30, 6, 30, 8),      // Right top
    ...generateLine(30, 11, 30, 13),    // Right bottom
  ];
  mazes.push({
    id: "box_in_box",
    name: "Box Labirinth",
    walls: boxInBoxWalls,
    hasWrapBorders: true,
  });

  // 3. Dual Tunnels
  // Two large horizontal barriers with vertical stumps, creating three parallel channels.
  const tunnelsWalls: Position[] = [
    // Top channel bar
    ...generateLine(6, 5, 33, 5),
    // Bottom channel bar
    ...generateLine(6, 14, 33, 14),
    // Center divider blocks
    ...generateLine(19, 8, 20, 11),
  ];
  mazes.push({
    id: "tunnels",
    name: "Dual Tunnels",
    walls: tunnelsWalls,
    hasWrapBorders: true,
  });

  // 4. Corner Pillars
  // Four solid blocks positioned strategically in the corners of the inner play field.
  const pillarsWalls: Position[] = [
    // Top-Left block
    ...generateLine(8, 4, 11, 6),
    // Top-Right block
    ...generateLine(28, 4, 31, 6),
    // Bottom-Left block
    ...generateLine(8, 13, 11, 15),
    // Bottom-Right block
    ...generateLine(28, 13, 31, 15),
    // Center block
    ...generateLine(18, 9, 21, 10),
  ];
  mazes.push({
    id: "pillars",
    name: "Apartment Blocks",
    walls: pillarsWalls,
    hasWrapBorders: true,
  });

  // 5. Grid Rail / Spiral
  // Interlocking rails that require constant snake weaving.
  const spiralWalls: Position[] = [
    ...generateLine(5, 3, 5, 16),
    ...generateLine(34, 3, 34, 16),
    ...generateLine(6, 3, 15, 3),
    ...generateLine(24, 3, 33, 3),
    ...generateLine(6, 16, 15, 16),
    ...generateLine(24, 16, 33, 16),
    ...generateLine(19, 2, 19, 7),
    ...generateLine(19, 12, 19, 17),
  ];
  mazes.push({
    id: "spiral",
    name: "Cross Rail",
    walls: spiralWalls,
    hasWrapBorders: true,
  });

  return mazes;
};
