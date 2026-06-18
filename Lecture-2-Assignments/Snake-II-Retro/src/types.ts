/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GameState {
  START_MENU = "START_MENU",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  GAME_OVER = "GAME_OVER",
  SETTINGS = "SETTINGS",
  MAZE_SELECT = "MAZE_SELECT",
  HIGHSCORES = "HIGHSCORES",
  HOW_TO_PLAY = "HOW_TO_PLAY"
}

export enum GameMode {
  SPEED_UP = "SPEED_UP",      // Speed increases every 10 points
  CLOSED_BOX = "CLOSED_BOX",  // Closed solid borders
  MAZES = "MAZES"             // Play inside chosen maze layout
}

export enum Direction {
  UP = "UP",
  DOWN = "DOWN",
  LEFT = "LEFT",
  RIGHT = "RIGHT"
}

export interface Position {
  x: number;
  y: number;
}

export interface HighScore {
  name: string;
  score: number;
  mode: GameMode;
  date: string;
}

export interface GameSettings {
  initialSpeed: number; // 1 to 9 (lower number is slower, represents Nokia speed levels)
  soundVolume: number; // 0 to 5
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: "green" | "amber" | "cyan" | "dark";
  gridDensity: "normal" | "dense"; // normal = 32x16, dense = 48x24
}

export interface Maze {
  id: string;
  name: string;
  walls: Position[]; // Wall coordinate grid
  hasWrapBorders: boolean; // Does this maze allow wrapping at the screen edges?
}
