/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  HelpCircle,
  Trophy,
  Settings as SettingsIcon,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  PhoneCall,
  Activity,
  Award
} from "lucide-react";
import { GameState, GameMode, Direction, Position, HighScore, GameSettings } from "./types";
import { getMazes } from "./mazes";
import { audio } from "./audio";

// Constants for Nokia LCD 160x80 Display
const CANVAS_WIDTH = 160;
const CANVAS_HEIGHT = 80;
const GRID_COLS = 40;
const GRID_ROWS = 20;
const BLOCK_SIZE = 4; // 40 * 4 = 160, 20 * 4 = 80

// Phone shell color theme variants
interface ShellTheme {
  name: string;
  id: string;
  bodyBg: string; // Tailwind class
  innerScreenBorder: string; // Tailwind class
  buttonStyle: string; // Tailwind class
}

const SHELL_THEMES: ShellTheme[] = [
  {
    name: "Classic Grey (Nokia 3310)",
    id: "classic",
    bodyBg: "bg-slate-700 shadow-slate-900 border-slate-800",
    innerScreenBorder: "border-slate-500 bg-slate-400",
    buttonStyle: "bg-radial from-slate-200 to-slate-400 border-slate-300 text-slate-800 font-bold shadow-md hover:brightness-110 active:brightness-95"
  },
  {
    name: "Vibrant Cyan",
    id: "cyan",
    bodyBg: "bg-cyan-800 shadow-cyan-950 border-cyan-900",
    innerScreenBorder: "border-cyan-600 bg-cyan-700",
    buttonStyle: "bg-radial from-slate-100 to-slate-300 border-slate-200 text-slate-800 font-bold shadow-md hover:brightness-110 active:brightness-95"
  },
  {
    name: "Ruby Red",
    id: "ruby",
    bodyBg: "bg-rose-900 shadow-rose-950 border-rose-950",
    innerScreenBorder: "border-rose-700 bg-rose-800",
    buttonStyle: "bg-radial from-stone-200 to-stone-400 border-stone-300 text-slate-850 font-bold shadow-md hover:brightness-110 active:brightness-95"
  },
  {
    name: "Cyber Punk Purple",
    id: "cyber",
    bodyBg: "bg-fuchsia-950 border-fuchsia-900 shadow-fuchsia-950",
    innerScreenBorder: "border-fuchsia-700 bg-fuchsia-900",
    buttonStyle: "bg-radial from-zinc-200 to-zinc-450 border-zinc-350 text-fuchsia-950 font-bold shadow-md hover:brightness-110 active:brightness-95"
  }
];

// Color palettes for the LCD screen backlight
interface ScreenPalette {
  shadow: string;                  // active pixel shadow details
  active: string;                  // pixels active (front)
  backlightOffBg: string;          // pixels inactive (off)
  backlightOnBg: string;           // pixels inactive (on)
  glassGlow: string;               // soft neon container ambient glow
}

const LCD_THEMES: Record<string, ScreenPalette> = {
  green: {
    backlightOnBg: "#9cbd0f",       // Retro Nokia matrix green
    backlightOffBg: "#c2ccb1",      // Unpowered dark grey-green
    active: "#1a2408",              // High contrast deep greenish-black
    shadow: "rgba(26, 36, 8, 0.15)", // Subtle shadow below LCD matrix
    glassGlow: "shadow-[0_0_15px_rgba(156,189,15,0.45)]"
  },
  amber: {
    backlightOnBg: "#f8a020",       // Warm orange retro classic
    backlightOffBg: "#dcd2b8",      // Amber-grey unpowered
    active: "#251200",              // Dark amber
    shadow: "rgba(37, 18, 0, 0.15)",
    glassGlow: "shadow-[0_0_15px_rgba(248,160,32,0.45)]"
  },
  cyan: {
    backlightOnBg: "#40d0e0",       // Cool modern turquoise
    backlightOffBg: "#bdced2",      // Off-black-grey
    active: "#042028",              // Deep cyan black
    shadow: "rgba(4, 32, 40, 0.15)",
    glassGlow: "shadow-[0_0_15px_rgba(64,208,224,0.45)]"
  },
  dark: {
    backlightOnBg: "#111827",       // Dark mode LCD back
    backlightOffBg: "#0f172a",
    active: "#60a5fa",              // Bright neon electronic blue
    shadow: "rgba(96, 165, 250, 0.1)",
    glassGlow: "shadow-[0_0_15px_rgba(96,165,250,0.3)]"
  }
};

const DEFAULT_SETTINGS: GameSettings = {
  initialSpeed: 3,
  soundVolume: 3,
  soundEnabled: true,
  hapticsEnabled: true,
  theme: "green",
  gridDensity: "normal"
};

const MENU_ITEMS = [
  { id: GameState.PLAYING, name: "PLAY GAME", icon: "🐍" },
  { id: GameState.MAZE_SELECT, name: "SELECT MAZE", icon: "🧱" },
  { id: GameState.SETTINGS, name: "SETTINGS", icon: "⚙️" },
  { id: GameState.HIGHSCORES, name: "HIGH SCORES", icon: "🏆" },
  { id: GameState.HOW_TO_PLAY, name: "HOW TO PLAY", icon: "❓" }
];

export default function App() {
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.START_MENU);
  const [activeMode, setActiveMode] = useState<GameMode>(GameMode.SPEED_UP);
  const [activeMazeIndex, setActiveMazeIndex] = useState<number>(0);
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  
  // Game engine parameters
  const [score, setScore] = useState<number>(0);
  const [currentSpeedLevel, setCurrentSpeedLevel] = useState<number>(3);
  const [foodsEaten, setFoodsEaten] = useState<number>(0);
  const [isHighScoreAwarded, setIsHighScoreAwarded] = useState<boolean>(false);
  const [highScorePlayerName, setHighScorePlayerName] = useState<string>("MUNEEB");
  const [t9CursorIndex, setT9CursorIndex] = useState<number>(0); // 0-5 characters
  
  // Backlight power triggers
  const [isBacklightOn, setIsBacklightOn] = useState<boolean>(true);
  const [shellThemeId, setShellThemeId] = useState<string>("classic");
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);
  const [isBooted, setIsBooted] = useState<boolean>(false);
  const [bootProgress, setBootProgress] = useState<number>(0); // 0 to 100

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const snakeRef = useRef<Position[]>([]);
  const directionRef = useRef<Direction>(Direction.RIGHT);
  const nextDirectionRef = useRef<Direction>(Direction.RIGHT);
  const foodRef = useRef<Position>({ x: 15, y: 10 });
  const bonusFoodRef = useRef<Position | null>(null);
  const bonusFoodTimerRef = useRef<number>(0);
  const bonusFoodMaxSecRef = useRef<number>(25);
  const menuCursorRef = useRef<number>(0);
  const settingsCursorRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const animationFrameTick = useRef<number>(0);
  const cellularSignalBars = useRef<number>(4);
  const batteryPercentBars = useRef<number>(4);

  // T9 mobile text helper states
  const t9ActiveKeyRef = useRef<string | null>(null);
  const t9PressCountRef = useRef<number>(0);
  const t9TimeoutIdRef = useRef<number | null>(null);

  const mazesList = getMazes();
  const currentMaze = mazesList[activeMazeIndex];

  // Map T9 Buttons to character lists
  const T9_MAP: Record<string, string[]> = {
    "2": ["A", "B", "C", "2"],
    "3": ["D", "E", "F", "3"],
    "4": ["G", "H", "I", "4"],
    "5": ["J", "K", "L", "5"],
    "6": ["M", "N", "O", "6"],
    "7": ["P", "Q", "R", "S", "7"],
    "8": ["T", "U", "V", "8"],
    "9": ["W", "X", "Y", "Z", "9"],
    "0": [" ", "0"]
  };

  // Sync settings with Web Audio engine on changes
  useEffect(() => {
    audio.setSettings(settings.soundEnabled, settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  // Load high scores
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nokia-snake-highscores");
      if (stored) {
        setHighScores(JSON.parse(stored));
      } else {
        const dummy: HighScore[] = [
          { name: "NOKIA", score: 800, mode: GameMode.SPEED_UP, date: "2026-06-09" },
          { name: "3310", score: 500, mode: GameMode.SPEED_UP, date: "2026-06-09" },
          { name: "RETRO", score: 300, mode: GameMode.CLOSED_BOX, date: "2026-06-09" }
        ];
        setHighScores(dummy);
        localStorage.setItem("nokia-snake-highscores", JSON.stringify(dummy));
      }
    } catch (e) {
      console.error(e);
    }

    // Fluctuating signal bars mock
    const signalInterval = setInterval(() => {
      cellularSignalBars.current = Math.min(5, Math.max(1, cellularSignalBars.current + (Math.random() > 0.55 ? 1 : -1)));
    }, 12000);

    return () => clearInterval(signalInterval);
  }, []);

  // Save score helper
  const saveHighScore = (finalScore: number) => {
    try {
      const newScore: HighScore = {
        name: highScorePlayerName.trim() || "SNAKE",
        score: finalScore,
        mode: activeMode,
        date: new Date().toISOString().split("T")[0]
      };
      
      const updated = [...highScores, newScore]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      setHighScores(updated);
      localStorage.setItem("nokia-snake-highscores", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to store high score:", e);
    }
  };

  // Boot chime & loader simulation
  useEffect(() => {
    if (!isBooted) {
      let interval = setInterval(() => {
        setBootProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsBooted(true);
            audio.playLevelUp(); // Power-up tone
            return 100;
          }
          return prev + 4;
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [isBooted]);

  // Dynamic Speed mapper based on Level (1 to 10)
  const getGameLoopDuration = (level: number): number => {
    const minD = 35; // fastest (level 10)
    const maxD = 180; // slowest (level 1)
    // Interpolation curve
    return maxD - ((level - 1) / 9) * (maxD - minD);
  };

  // Safe spawn validator
  const spawnFood = (forbidden: Position[]): Position => {
    let attempts = 0;
    while (attempts < 500) {
      const col = Math.floor(Math.random() * GRID_COLS);
      const row = Math.floor(Math.random() * GRID_ROWS);

      // Check snake body
      const isOk = !forbidden.some((seg) => seg.x === col && seg.y === row) && 
                   // Check static maze walls
                   !currentMaze.walls.some((w) => w.x === col && w.y === row);
      
      if (isOk) {
        return { x: col, y: row };
      }
      attempts++;
    }
    return { x: 5, y: 5 }; // fallback safely
  };

  // Trigger T9 keypad simulated inputs (SMS keyboard Nokia style)
  const handleT9Input = (key: string) => {
    if (gameState !== GameState.GAME_OVER || !isHighScoreAwarded) return;
    audio.playMenuClick();

    if (T9_MAP[key]) {
      const charOptions = T9_MAP[key];

      if (t9ActiveKeyRef.current === key) {
        // Increment presses on same key
        t9PressCountRef.current = (t9PressCountRef.current + 1) % charOptions.length;
      } else {
        // New key pressed of a different numeric group
        t9ActiveKeyRef.current = key;
        t9PressCountRef.current = 0;
      }

      const activeChar = charOptions[t9PressCountRef.current];

      setHighScorePlayerName((prev) => {
        const charsArr = prev.split("");
        charsArr[t9CursorIndex] = activeChar;
        // Limit to 6 chars
        return charsArr.slice(0, 6).join("");
      });

      // Clear any pending character commit timers
      if (t9TimeoutIdRef.current) {
        clearTimeout(t9TimeoutIdRef.current);
      }

      // Automatically move cursor to next position if no action for 1 second
      t9TimeoutIdRef.current = window.setTimeout(() => {
        setT9CursorIndex((prev) => (prev < 5 ? prev + 1 : prev));
        t9ActiveKeyRef.current = null;
        t9PressCountRef.current = 0;
      }, 1000);
    }
  };

  // Trigger haptic vibrate if supported
  const triggerHaptic = () => {
    if (settings.hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  // Game Engine reset state
  const resetGame = useCallback(() => {
    const isClosedBox = activeMode === GameMode.CLOSED_BOX;
    
    // Spawn simple centering horizontal snake
    const initialSnake: Position[] = [
      { x: 12, y: 10 },
      { x: 11, y: 10 },
      { x: 10, y: 10 }
    ];

    snakeRef.current = initialSnake;
    directionRef.current = Direction.RIGHT;
    nextDirectionRef.current = Direction.RIGHT;
    
    // Re-validate wall layouts + grid
    const spawnForbidden = [...initialSnake];
    foodRef.current = spawnFood(spawnForbidden);
    bonusFoodRef.current = null;
    bonusFoodTimerRef.current = 0;

    setScore(0);
    setCurrentSpeedLevel(settings.initialSpeed);
    setFoodsEaten(0);
    setIsHighScoreAwarded(false);
    setGameState(GameState.PLAYING);
    lastUpdateRef.current = performance.now();
  }, [activeMode, activeMazeIndex, settings.initialSpeed]);

  // Navigate back to Main Menu helper
  const goBackToMenu = () => {
    audio.playMenuClick();
    setGameState(GameState.START_MENU);
  };

  // Handle all inputs: physical keyboard and virtual clicks
  const handleAction = useCallback((action: string) => {
    triggerHaptic();

    if (!isBooted) return;

    // Pausible Game handling
    if (gameState === GameState.PLAYING) {
      if (action === "UP" && directionRef.current !== Direction.DOWN) {
        nextDirectionRef.current = Direction.UP;
      } else if (action === "DOWN" && directionRef.current !== Direction.UP) {
        nextDirectionRef.current = Direction.DOWN;
      } else if (action === "LEFT" && directionRef.current !== Direction.RIGHT) {
        nextDirectionRef.current = Direction.LEFT;
      } else if (action === "RIGHT" && directionRef.current !== Direction.LEFT) {
        nextDirectionRef.current = Direction.RIGHT;
      } else if (action === "PAUSE" || action === "SOFT_LEFT" || action === "ENTER") {
        audio.playMenuClick();
        setGameState(GameState.PAUSED);
      } else if (action === "BACK" || action === "SOFT_RIGHT") {
        audio.playMenuClick();
        setGameState(GameState.START_MENU);
      }
      return;
    }

    if (gameState === GameState.PAUSED) {
      if (action === "ENTER" || action === "PAUSE" || action === "SOFT_LEFT") {
        audio.playMenuClick();
        setGameState(GameState.PLAYING);
        lastUpdateRef.current = performance.now();
      } else if (action === "BACK" || action === "SOFT_RIGHT") {
        audio.playMenuClick();
        setGameState(GameState.START_MENU);
      }
      return;
    }

    if (gameState === GameState.START_MENU) {
      const listSize = MENU_ITEMS.length;
      if (action === "DOWN") {
        audio.playMenuClick();
        menuCursorRef.current = (menuCursorRef.current + 1) % listSize;
      } else if (action === "UP") {
        audio.playMenuClick();
        menuCursorRef.current = (menuCursorRef.current - 1 + listSize) % listSize;
      } else if (action === "ENTER" || action === "SOFT_LEFT") {
        audio.playMenuClick();
        const selected = MENU_ITEMS[menuCursorRef.current].id;
        if (selected === GameState.PLAYING) {
          resetGame();
        } else {
          setGameState(selected);
        }
      }
      return;
    }

    if (gameState === GameState.SETTINGS) {
      // Settings controls: 5 rows
      // 0: Init Speed Level
      // 1: Sound Volume
      // 2: Sound Toggle
      // 3: Screen Backlight Color Palette
      // 4: Screen scanline filter mode
      if (action === "DOWN") {
        audio.playMenuClick();
        settingsCursorRef.current = (settingsCursorRef.current + 1) % 5;
      } else if (action === "UP") {
        audio.playMenuClick();
        settingsCursorRef.current = (settingsCursorRef.current - 1 + 5) % 5;
      } else if (action === "LEFT") {
        audio.playMenuClick();
        setSettings((prev) => {
          const mod = { ...prev };
          if (settingsCursorRef.current === 0) {
            mod.initialSpeed = Math.max(1, prev.initialSpeed - 1);
          } else if (settingsCursorRef.current === 1) {
            mod.soundVolume = Math.max(0, prev.soundVolume - 1);
          } else if (settingsCursorRef.current === 2) {
            mod.soundEnabled = !prev.soundEnabled;
          } else if (settingsCursorRef.current === 3) {
            const themes: ("green" | "amber" | "cyan" | "dark")[] = ["green", "amber", "cyan", "dark"];
            const currentIdx = themes.indexOf(prev.theme);
            const nextIdx = (currentIdx - 1 + themes.length) % themes.length;
            mod.theme = themes[nextIdx];
          } else if (settingsCursorRef.current === 4) {
            mod.hapticsEnabled = !prev.hapticsEnabled;
          }
          return mod;
        });
      } else if (action === "RIGHT" || action === "ENTER") {
        audio.playMenuClick();
        setSettings((prev) => {
          const mod = { ...prev };
          if (settingsCursorRef.current === 0) {
            mod.initialSpeed = Math.min(9, prev.initialSpeed + 1);
          } else if (settingsCursorRef.current === 1) {
            mod.soundVolume = Math.min(5, prev.soundVolume + 1);
          } else if (settingsCursorRef.current === 2) {
            mod.soundEnabled = !prev.soundEnabled;
          } else if (settingsCursorRef.current === 3) {
            const themes: ("green" | "amber" | "cyan" | "dark")[] = ["green", "amber", "cyan", "dark"];
            const currentIdx = themes.indexOf(prev.theme);
            const nextIdx = (currentIdx + 1) % themes.length;
            mod.theme = themes[nextIdx];
          } else if (settingsCursorRef.current === 4) {
            mod.hapticsEnabled = !prev.hapticsEnabled;
          }
          return mod;
        });
      } else if (action === "BACK" || action === "SOFT_RIGHT") {
        goBackToMenu();
      }
      return;
    }

    if (gameState === GameState.MAZE_SELECT) {
      if (action === "LEFT") {
        audio.playMenuClick();
        setActiveMazeIndex((prev) => (prev - 1 + mazesList.length) % mazesList.length);
      } else if (action === "RIGHT") {
        audio.playMenuClick();
        setActiveMazeIndex((prev) => (prev + 1) % mazesList.length);
      } else if (action === "UP" || action === "DOWN") {
        audio.playMenuClick();
        // Toggle game rule modes based on selection
        const modes = [GameMode.SPEED_UP, GameMode.CLOSED_BOX, GameMode.MAZES];
        const nextIdx = (modes.indexOf(activeMode) + (action === "DOWN" ? 1 : -1) + 3) % 3;
        setActiveMode(modes[nextIdx]);
      } else if (action === "ENTER" || action === "SOFT_LEFT") {
        audio.playMenuClick();
        resetGame(); // Start game directly
      } else if (action === "BACK" || action === "SOFT_RIGHT") {
        goBackToMenu();
      }
      return;
    }

    if (gameState === GameState.HOW_TO_PLAY || gameState === GameState.HIGHSCORES) {
      if (action === "BACK" || action === "SOFT_RIGHT" || action === "ENTER" || action === "SOFT_LEFT") {
        goBackToMenu();
      }
      return;
    }

    if (gameState === GameState.GAME_OVER) {
      if (isHighScoreAwarded) {
        if (action === "LEFT") {
          audio.playMenuClick();
          setT9CursorIndex((prev) => Math.max(0, prev - 1));
        } else if (action === "RIGHT") {
          audio.playMenuClick();
          setT9CursorIndex((prev) => Math.min(5, prev + 1));
        } else if (action === "ENTER" || action === "SOFT_LEFT") {
          audio.playTone([800, 1000], [80, 150]);
          saveHighScore(score);
          setIsHighScoreAwarded(false);
        } else if (action === "SOFT_RIGHT" || action === "BACK") {
          // Clear text action or backspacing
          if (highScorePlayerName.length > 0) {
            audio.playMenuClick();
            setHighScorePlayerName((prev) => {
              const prevArr = prev.split("");
              prevArr[t9CursorIndex] = " ";
              return prevArr.join("");
            });
          } else {
            setGameState(GameState.START_MENU);
          }
        }
      } else {
        if (action === "ENTER" || action === "SOFT_LEFT") {
          resetGame();
        } else if (action === "SOFT_RIGHT" || action === "BACK") {
          goBackToMenu();
        }
      }
      return;
    }
  }, [gameState, activeMode, activeMazeIndex, isHighScoreAwarded, highScorePlayerName, t9CursorIndex, highScores, isBooted, settings, score, resetGame]);

  // Map physical keys to Game Actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let act: string | null = null;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          act = "UP";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          act = "DOWN";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          act = "LEFT";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          act = "RIGHT";
          break;
        case "Enter":
        case " ":
          act = "ENTER";
          break;
        case "p":
        case "P":
          act = "PAUSE";
          break;
        case "Escape":
        case "Backspace":
          act = "BACK";
          break;
        // Keypad inputs mapped to real keypad actions
        case "2":
          handleT9Input("2");
          act = "UP";
          break;
        case "4":
          handleT9Input("4");
          act = "LEFT";
          break;
        case "6":
          handleT9Input("6");
          act = "RIGHT";
          break;
        case "8":
          handleT9Input("8");
          act = "DOWN";
          break;
        case "3":
          handleT9Input("3");
          break;
        case "5":
          handleT9Input("5");
          act = "ENTER";
          break;
        case "7":
          handleT9Input("7");
          break;
        case "9":
          handleT9Input("9");
          break;
        case "0":
          handleT9Input("0");
          break;
      }

      if (act) {
        e.preventDefault();
        handleAction(act);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAction, handleT9Input]);

  // Core Physical Game loop logic calculations (Ticks)
  useEffect(() => {
    if (gameState !== GameState.PLAYING) return;

    let active = true;
    const tickDuration = getGameLoopDuration(currentSpeedLevel);

    const checkCollision = (head: Position): boolean => {
      // 1. Boundary checking
      const isClosedBorder = activeMode === GameMode.CLOSED_BOX;
      
      if (isClosedBorder) {
        if (head.x < 0 || head.x >= GRID_COLS || head.y < 0 || head.y >= GRID_ROWS) {
          return true;
        }
      }

      // 2. Static maze wall elements
      if (currentMaze.walls.some((wall) => wall.x === head.x && wall.y === head.y)) {
        return true;
      }

      // 3. Cannibal self eating (except tail block as it moves forward simultaneously)
      // If we are about to eat a food, we don't pop tail, so head CANNOT hit tail.
      const hitsSelf = snakeRef.current.slice(0, -1).some((segment) => segment.x === head.x && segment.y === head.y);
      if (hitsSelf) {
        return true;
      }

      return false;
    };

    const updateGame = () => {
      if (!active) return;

      // Update direction from the buffered input to avoid 180-deg instant self crashes
      directionRef.current = nextDirectionRef.current;

      const head = { ...snakeRef.current[0] };
      switch (directionRef.current) {
        case Direction.UP:
          head.y -= 1;
          break;
        case Direction.DOWN:
          head.y += 1;
          break;
        case Direction.LEFT:
          head.x -= 1;
          break;
        case Direction.RIGHT:
          head.x += 1;
          break;
      }

      // Wrap-around coordinate processing
      const hasWrapping = activeMode !== GameMode.CLOSED_BOX;
      if (hasWrapping) {
        if (head.x < 0) head.x = GRID_COLS - 1;
        else if (head.x >= GRID_COLS) head.x = 0;

        if (head.y < 0) head.y = GRID_ROWS - 1;
        else if (head.y >= GRID_ROWS) head.y = 0;
      }

      // Determine Collision
      if (checkCollision(head)) {
        audio.playCrash();
        
        // Evaluate high scores eligibility
        const scoresForMode = highScores.filter((s) => s.mode === activeMode);
        const isEligible = scoresForMode.length < 5 || score > (scoresForMode[scoresForMode.length - 1]?.score || 0);

        if (isEligible && score > 0) {
          setIsHighScoreAwarded(true);
          setT9CursorIndex(0);
        } else {
          setIsHighScoreAwarded(false);
        }

        setGameState(GameState.GAME_OVER);
        return;
      }

      // Grow & Move process
      const newSnake = [head, ...snakeRef.current];

      // Regular food collision
      const pathW = foodRef.current;
      const didEatRegular = head.x === pathW.x && head.y === pathW.y;
      
      // Bonus food (Insect) collision
      let didEatBonus = false;
      if (bonusFoodRef.current && head.x === bonusFoodRef.current.x && head.y === bonusFoodRef.current.y) {
        didEatBonus = true;
      }

      if (didEatRegular) {
        // Food eaten
        audio.playEat();
        
        // Points awarded based on speed scale
        const pointsGained = currentSpeedLevel * 10;
        setScore((prev) => prev + pointsGained);
        
        // Generate new food slot, avoiding the full snake AND standard walls
        const fullBody = [...newSnake];
        foodRef.current = spawnFood(fullBody);

        setFoodsEaten((prev) => {
          const next = prev + 1;
          // Spawn bonus bugs every 5 foods
          if (next % 5 === 0) {
            const forbiddenArea = [...fullBody, foodRef.current];
            bonusFoodRef.current = spawnFood(forbiddenArea);
            bonusFoodTimerRef.current = bonusFoodMaxSecRef.current;
            audio.playBonusAppear();
          }
          return next;
        });

        // Mode 1: Progressive Speed increases every 10 points
        if (activeMode === GameMode.SPEED_UP) {
          setCurrentSpeedLevel((prevLevel) => {
            const calculatedLevel = Math.min(10, Math.floor((score + pointsGained) / 100) + settings.initialSpeed);
            if (calculatedLevel > prevLevel) {
              audio.playLevelUp();
            }
            return calculatedLevel;
          });
        }

      } else if (didEatBonus) {
        // Bonus bug eaten!
        audio.playBonusEat();
        const bonusPoints = bonusFoodTimerRef.current * currentSpeedLevel * 3;
        setScore((prev) => prev + bonusPoints);
        bonusFoodRef.current = null;
        bonusFoodTimerRef.current = 0;
      } else {
        // No food eaten, move forward standard
        newSnake.pop();
      }

      snakeRef.current = newSnake;

      // Handle bonus food ticking down
      if (bonusFoodRef.current) {
        bonusFoodTimerRef.current -= 1;
        if (bonusFoodTimerRef.current <= 0) {
          bonusFoodRef.current = null; // Bug crawled away!
        }
      }

      // Loop callback
      if (active) {
        setTimeout(updateGame, tickDuration);
      }
    };

    const runId = setTimeout(updateGame, tickDuration);

    return () => {
      active = false;
      clearTimeout(runId);
    };
  }, [gameState, activeMode, currentSpeedLevel, highScores, score, settings.initialSpeed, currentMaze]);

  // Draw visual canvas graphics (Nokia LCD 3310 Style) at 60fps
  useEffect(() => {
    let active = true;
    
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      animationFrameTick.current += 1;

      const currentPalette = LCD_THEMES[settings.theme];
      const activeColor = isBacklightOn ? currentPalette.active : "#334155";
      const inactiveColor = isBacklightOn ? currentPalette.backlightOnBg : currentPalette.backlightOffBg;
      const shadowColor = currentPalette.shadow;

      // 1. Clear & draw background LCD color
      ctx.fillStyle = inactiveColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. Render stages
      if (!isBooted) {
        // Nokia Bootloader animation
        ctx.fillStyle = activeColor;
        ctx.font = "14px 'Press Start 2P'";
        ctx.textAlign = "center";
        
        if (bootProgress < 30) {
          // Soft screen blink/shimmer
        } else if (bootProgress < 65) {
          ctx.fillText("NOKIA", CANVAS_WIDTH / 2, 45);
        } else {
          // Hands shake pixel drawing
          ctx.font = "8px 'Press Start 2P'";
          ctx.fillText("NOKIA", CANVAS_WIDTH / 2, 28);
          
          // Draw simple iconic hands
          ctx.fillRect(20 + (bootProgress - 65) * 0.4, 48, 25, 6); // Left arm
          ctx.fillRect(CANVAS_WIDTH - 20 - (bootProgress - 65) * 0.4 - 25, 52, 25, 6); // Right arm
          ctx.fillRect(CANVAS_WIDTH / 2 - 5, 45, 10, 15); // joining center block
        }
        
        // Progress percentage loader bar
        ctx.strokeRect(30, 70, 100, 4);
        ctx.fillRect(30, 70, bootProgress, 4);

      } else if (gameState === GameState.START_MENU) {
        // Navigation Rails & Nokia Headers
        ctx.strokeStyle = activeColor;
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(CANVAS_WIDTH, 15);
        ctx.stroke();

        ctx.font = "5px 'Press Start 2P'";
        ctx.fillStyle = activeColor;
        ctx.textAlign = "center";
        ctx.fillText("🐍 SNAKE II 🐍", CANVAS_WIDTH / 2, 10);

        // Render current item selection menu
        const currentItem = MENU_ITEMS[menuCursorRef.current];
        
        ctx.font = "10px 'Press Start 2P'";
        ctx.fillText(currentItem.icon, CANVAS_WIDTH / 2, 34);

        ctx.font = "6.5px 'Press Start 2P'";
        ctx.fillStyle = activeColor;
        ctx.fillText(`${menuCursorRef.current + 1}. ${currentItem.name}`, CANVAS_WIDTH / 2, 54);

        // Quick page selector dots on bottom margin
        ctx.textAlign = "center";
        let dots = "";
        for (let i = 0; i < MENU_ITEMS.length; i++) {
          dots += i === menuCursorRef.current ? "●" : "○";
        }
        ctx.font = "7px 'Press Start 2P'";
        ctx.fillText(dots, CANVAS_WIDTH / 2, 72);

      } else if (gameState === GameState.SETTINGS) {
        // Headers
        ctx.fillStyle = activeColor;
        ctx.font = "5.5px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText("⚙️ SETTINGS", CANVAS_WIDTH / 2, 10);
        ctx.strokeRect(4, 14, CANVAS_WIDTH - 8, 1);

        // List settings values
        ctx.textAlign = "left";
        const settingsText = [
          `1. SPEED LEVEL   < ${settings.initialSpeed} >`,
          `2. SOUND VOLUME  < ${settings.soundVolume} >`,
          `3. AUDIO SOUNDS  < ${settings.soundEnabled ? "ON" : "OFF"} >`,
          `4. SCREEN GLOW   < ${settings.theme.toUpperCase()} >`,
          `5. VIBRATION     < ${settings.hapticsEnabled ? "ON" : "OFF"} >`
        ];

        ctx.font = "4px 'Press Start 2P'";
        const startY = 26;
        settingsText.forEach((text, i) => {
          const isSelected = settingsCursorRef.current === i;
          ctx.fillStyle = activeColor;
          if (isSelected) {
            // Draw retro selected chevron pointer
            ctx.fillRect(4, startY + i * 11 - 4, CANVAS_WIDTH - 8, 9);
            ctx.fillStyle = inactiveColor;
            ctx.fillText("> " + text, 8, startY + i * 11);
          } else {
            ctx.fillText("  " + text, 8, startY + i * 11);
          }
        });

      } else if (gameState === GameState.MAZE_SELECT) {
        // Headers
        ctx.fillStyle = activeColor;
        ctx.font = "5px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText("🧱 LEVEL & RULES", CANVAS_WIDTH / 2, 10);
        ctx.strokeRect(4, 14, CANVAS_WIDTH - 8, 1);

        // Displays Maze list selection
        ctx.textAlign = "center";
        ctx.font = "5.5px 'Press Start 2P'";
        ctx.fillText(`< ${currentMaze.name} >`, CANVAS_WIDTH / 2, 28);

        // Displays Custom Game rules
        ctx.font = "4px 'Press Start 2P'";
        ctx.fillText(`RULESET: ${activeMode.replace("_", " ")}`, CANVAS_WIDTH / 2, 40);

        // Draw miniature preview screen of the maze layout
        ctx.strokeStyle = activeColor;
        ctx.strokeRect(CANVAS_WIDTH / 2 - 25, 48, 50, 22);

        // Miniature walls preview drawing
        ctx.fillStyle = activeColor;
        const scaleX = 50 / 40;
        const scaleY = 22 / 20;
        const miniOffX = CANVAS_WIDTH / 2 - 25;
        const miniOffY = 48;

        currentMaze.walls.forEach((p) => {
          ctx.fillRect(miniOffX + p.x * scaleX, miniOffY + p.y * scaleY, Math.max(1, scaleX), Math.max(1, scaleY));
        });

        // If closed box rule is toggled on, highlight outer border preview
        if (activeMode === GameMode.CLOSED_BOX) {
          ctx.strokeRect(CANVAS_WIDTH / 2 - 24, 49, 48, 20);
        }

        ctx.font = "3.5px 'Press Start 2P'";
        ctx.fillStyle = activeColor;
        ctx.fillText("PRESS KEYS OR 2-8 TO NAVIGATE", CANVAS_WIDTH / 2, 77);

      } else if (gameState === GameState.PLAYING || gameState === GameState.PAUSED) {
        // ------------------ Active Game Rendering ------------------
        
        // A. Draw LCD Shell Frame Signals & Batteries (Nokia style top status)
        ctx.fillStyle = activeColor;
        ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Screen border
        ctx.strokeRect(0, 8, CANVAS_WIDTH, 1); // Stats row divisor divider
        
        // Score value (Classic LCD segment LED font style)
        ctx.font = "5.5px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(`SCORE: ${score}`, CANVAS_WIDTH / 2, 6);

        // Cellular network signal bars on left
        ctx.textAlign = "left";
        for (let i = 0; i < 5; i++) {
          if (i < cellularSignalBars.current) {
            ctx.fillRect(3 + i * 2, 6 - i, 1.5, i + 1);
          }
        }
        ctx.font = "4px 'Press Start 2P'";
        ctx.fillText("📶", 14, 6);

        // Battery bars on right
        ctx.strokeRect(CANVAS_WIDTH - 15, 2, 10, 5);
        ctx.fillRect(CANVAS_WIDTH - 17, 3.5, 2, 2); // pointer tip
        for (let i = 0; i < batteryPercentBars.current; i++) {
          ctx.fillRect(CANVAS_WIDTH - 14 + i * 2, 3, 1.5, 3);
        }
        ctx.textAlign = "right";
        ctx.fillText("🔋", CANVAS_WIDTH - 17, 6);

        // Offset dimensions to render actual play area inside border row (y: 8 to 80)
        const boardYOffset = 8;
        const boardHeight = CANVAS_HEIGHT - boardYOffset;
        const boardBlockSizeY = boardHeight / GRID_ROWS; // 72 / 20 = 3.6 pixels each

        // B. Draw Walls (Borders & Maze contents)
        ctx.fillStyle = activeColor;
        
        // If SOLID_BOX mode is active, draw solid bold border around board region
        if (activeMode === GameMode.CLOSED_BOX) {
          ctx.strokeRect(0, boardYOffset, CANVAS_WIDTH, boardHeight);
        }

        // Draw active maze walls with subtle Nokia brick lines pattern
        currentMaze.walls.forEach((wall) => {
          const rx = wall.x * BLOCK_SIZE;
          const ry = boardYOffset + wall.y * boardBlockSizeY;
          
          // Draw shadowed block below for reflective 3D look
          ctx.fillStyle = shadowColor;
          ctx.fillRect(rx + 1, ry + 1, BLOCK_SIZE - 1, boardBlockSizeY - 1);

          ctx.fillStyle = activeColor;
          ctx.fillRect(rx, ry, BLOCK_SIZE - 1, boardBlockSizeY - 1);
          
          // Tiny interior pixel to resemble a Nokia 3310 block-wall brick
          ctx.fillStyle = inactiveColor;
          ctx.fillRect(rx + 1, ry + 1, 1, 1);
        });

        // C. Draw Food
        const fPos = foodRef.current;
        const fx = fPos.x * BLOCK_SIZE;
        const fy = boardYOffset + fPos.y * boardBlockSizeY;

        // Draw Regular Food: pixelated fly/cross shape representation
        ctx.fillStyle = activeColor;
        ctx.fillRect(fx + 1, fy, 1.5, boardBlockSizeY - 1);
        ctx.fillRect(fx, fy + 1, BLOCK_SIZE - 1, 1.5);

        // D. Draw Bonus insect Food (If present)
        if (bonusFoodRef.current) {
          const bPos = bonusFoodRef.current;
          const bx = bPos.x * BLOCK_SIZE;
          const by = boardYOffset + bPos.y * boardBlockSizeY;

          // Animate pulsing flashes
          if (Math.floor(animationFrameTick.current / 8) % 2 === 0) {
            ctx.fillStyle = activeColor;
            
            // Draw little 3x3 spider/beetle
            ctx.fillRect(bx, by, BLOCK_SIZE - 1, boardBlockSizeY - 1);
            // Draw spider legs
            ctx.fillRect(bx - 1, by, 1, 1);
            ctx.fillRect(bx + 3, by, 1, 1);
            ctx.fillRect(bx - 1, by + 2, 1, 1);
            ctx.fillRect(bx + 3, by + 2, 1, 1);
          }

          // Draw the remaining sliding countdown timer bar above insect, or alongside
          ctx.fillStyle = activeColor;
          ctx.strokeRect(CANVAS_WIDTH / 2 - 12, 6, 24, 1.2);
          const ratio = bonusFoodTimerRef.current / bonusFoodMaxSecRef.current;
          ctx.fillRect(CANVAS_WIDTH / 2 - 12, 6, 24 * ratio, 1.2);
        }

        // E. Draw Snake Body & Animated Head
        const snake = snakeRef.current;
        
        snake.forEach((seg, index) => {
          const sx = seg.x * BLOCK_SIZE;
          const sy = boardYOffset + seg.y * boardBlockSizeY;
          const isHead = index === 0;

          // Shadow depth layer
          ctx.fillStyle = shadowColor;
          ctx.fillRect(sx + 1, sy + 1, BLOCK_SIZE - 1, boardBlockSizeY - 1);

          ctx.fillStyle = activeColor;

          if (isHead) {
            // Draw head with tiny direction eyes
            ctx.fillRect(sx, sy, BLOCK_SIZE - 1, boardBlockSizeY - 1);
            ctx.fillStyle = inactiveColor; // light eye colors

            // Place eyes relative to heading direction
            switch (directionRef.current) {
              case Direction.UP:
                ctx.fillRect(sx, sy, 1, 1);
                ctx.fillRect(sx + 2, sy, 1, 1);
                break;
              case Direction.DOWN:
                ctx.fillRect(sx, sy + 2, 1, 1);
                ctx.fillRect(sx + 2, sy + 2, 1, 1);
                break;
              case Direction.LEFT:
                ctx.fillRect(sx, sy, 1, 1);
                ctx.fillRect(sx, sy + 2, 1, 1);
                break;
              case Direction.RIGHT:
                ctx.fillRect(sx + 2, sy, 1, 1);
                ctx.fillRect(sx + 2, sy + 2, 1, 1);
                break;
            }
          } else {
            // Draw patterned segment block for high authentic fidelity texture
            ctx.fillRect(sx, sy, BLOCK_SIZE - 1, boardBlockSizeY - 1);
            
            // Checkerboard center cutout hole
            if (index % 2 === 0) {
              ctx.fillStyle = inactiveColor;
              ctx.fillRect(sx + 1, sy + 1, 1, 1);
            }
          }
        });

        // F. Draw Paused banner overlay text
        if (gameState === GameState.PAUSED) {
          ctx.fillStyle = inactiveColor;
          ctx.fillRect(CANVAS_WIDTH / 2 - 32, 34, 64, 18);
          ctx.strokeStyle = activeColor;
          ctx.strokeRect(CANVAS_WIDTH / 2 - 32, 34, 64, 18);
          
          ctx.fillStyle = activeColor;
          ctx.font = "6px 'Press Start 2P'";
          ctx.textAlign = "center";
          ctx.fillText("II PAUSED", CANVAS_WIDTH / 2, 45);
        }

      } else if (gameState === GameState.GAME_OVER) {
        // Skull pixel art + text
        ctx.fillStyle = activeColor;
        
        ctx.font = "8px 'Press Start 2P'";
        ctx.textAlign = "center";
        
        ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, 22);

        ctx.font = "5px 'Press Start 2P'";
        ctx.fillText(`YOUR SCORE: ${score}`, CANVAS_WIDTH / 2, 34);

        if (isHighScoreAwarded) {
          // Render High Score blinking text input box
          ctx.font = "4.5px 'Press Start 2P'";
          ctx.fillText("🎉 NEW HIGH SCORE! 🎉", CANVAS_WIDTH / 2, 45);
          ctx.fillText("USE KEYPAD NAMES:", CANVAS_WIDTH / 2, 53);

          // Typewriter boxes
          const boxStep = 11;
          const boxStartX = CANVAS_WIDTH / 2 - (6 * boxStep) / 2;
          
          for (let i = 0; i < 6; i++) {
            const letter = highScorePlayerName[i] || " ";
            const isCursor = t9CursorIndex === i;
            const rx = boxStartX + i * boxStep;

            if (isCursor && Math.floor(animationFrameTick.current / 15) % 2 === 0) {
              ctx.fillRect(rx, 58, 8, 9);
              ctx.fillStyle = inactiveColor;
              ctx.font = "6px 'Press Start 2P'";
              ctx.fillText(letter, rx + 4, 65);
              ctx.fillStyle = activeColor;
            } else {
              ctx.strokeRect(rx, 58, 8, 9);
              ctx.font = "6px 'Press Start 2P'";
              ctx.fillText(letter, rx + 4, 65);
            }
          }
          
          ctx.font = "3.5px 'Press Start 2P'";
          ctx.fillText("PRESS ENTER OR NAV-OK TO SAVE", CANVAS_WIDTH / 2, 75);
        } else {
          // Play again footer
          ctx.font = "4px 'Press Start 2P'";
          ctx.fillText("NAV-OK TO RETRY", CANVAS_WIDTH / 2, 48);
          ctx.fillText("CLEAR (C) FOR START MENU", CANVAS_WIDTH / 2, 58);

          // Render small design decorative graphics
          ctx.fillRect(20, 68, 120, 1);
        }

      } else if (gameState === GameState.HIGHSCORES) {
        // Trophy Icon
        ctx.fillStyle = activeColor;
        ctx.font = "5px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText("🏆 HALL OF FAME 🏆", CANVAS_WIDTH / 2, 10);
        ctx.strokeRect(4, 14, CANVAS_WIDTH - 8, 1);

        // Filter high scores based on currently selected rules
        const filtered = highScores.filter((s) => s.mode === activeMode).slice(0, 4);

        if (filtered.length === 0) {
          ctx.font = "5.5px 'Press Start 2P'";
          ctx.fillText("NO HIGH SCORES", CANVAS_WIDTH / 2, 38);
          ctx.font = "4px 'Press Start 2P'";
          ctx.fillText(`PLAY ${activeMode.replace("_", " ")} MODE TO POST`, CANVAS_WIDTH / 2, 52);
        } else {
          ctx.font = "4px 'Press Start 2P'";
          ctx.textAlign = "left";
          
          filtered.forEach((entry, i) => {
            const rxY = 25 + i * 11;
            ctx.fillText(`${i + 1}.`, 8, rxY);
            ctx.font = "5px 'Press Start 2P'";
            ctx.fillText(entry.name.padEnd(6, " "), 22, rxY);
            ctx.font = "4.5px 'Press Start 2P'";
            ctx.textAlign = "right";
            ctx.fillText(`${entry.score} pts`, CANVAS_WIDTH - 28, rxY);
            ctx.font = "3.5px 'Press Start 2P'";
            ctx.fillText(entry.date, CANVAS_WIDTH - 8, rxY);
            ctx.textAlign = "left";
            ctx.font = "4px 'Press Start 2P'";
          });
        }

        // Instructions Footer
        ctx.fillStyle = activeColor;
        ctx.font = "3.5px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText("BACK (C) TO RETURN", CANVAS_WIDTH / 2, 76);

      } else if (gameState === GameState.HOW_TO_PLAY) {
        // Headers
        ctx.fillStyle = activeColor;
        ctx.font = "5px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText("❓ HOW TO PLAY", CANVAS_WIDTH / 2, 10);
        ctx.strokeRect(4, 14, CANVAS_WIDTH - 8, 1);

        // Simple tutorial pages
        ctx.font = "3.8px 'Press Start 2P'";
        ctx.textAlign = "left";
        const lines = [
          "• CONTROLS: USE ARROW KEYS,/WASD",
          "  OR MOBILE TAP PAD (KEYPAD 2,4,6,8).",
          "• TARGET: EAT REGULAR & BONUS FOODS.",
          "• AVOID: COLLIDING WALLS & BODY.",
          "• MODES: SPEED GAINS, CLOSED SIDES",
          "  AND SPECIAL NOSTALGIA MAZES."
        ];

        lines.forEach((l, idx) => {
          ctx.fillText(l, 6, 26 + idx * 8.5);
        });

        // Instructions
        ctx.textAlign = "center";
        ctx.font = "3.5px 'Press Start 2P'";
        ctx.fillText("NAV-OK OR (C) TO EXIT", CANVAS_WIDTH / 2, 77);
      }

      // Shadow overlay filter effect in canvas
      if (active) {
        requestRef.current = requestAnimationFrame(draw);
      }
    };

    requestRef.current = requestAnimationFrame(draw);
    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, activeMode, activeMazeIndex, settings, score, highScores, isBooted, bootProgress, isHighScoreAwarded, highScorePlayerName, t9CursorIndex, isBacklightOn]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between select-none font-sans overflow-x-hidden relative">
      <div className="absolute inset-0 bg-radial from-slate-800 to-slate-950 pointer-events-none opacity-40 z-0" />
      
      {/* 1. Header Navigation Banner */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-radial from-green-500/20 to-transparent flex items-center justify-center rounded-lg border border-green-500/20">
            <span className="text-2xl animate-pulse">🐍</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Snake II <span className="text-xs bg-slate-800 text-green-400 border border-green-500/30 px-2 py-0.5 rounded font-mono">NOKIA SIM</span>
            </h1>
            <p className="text-xs text-slate-400">Authentic 8-bit liquid-crystal emulator experience</p>
          </div>
        </div>

        {/* Global Action Utility Toggles */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              audio.playMenuClick();
              setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
            }}
            id="sound-toggle-btn"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-705 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-medium"
            title="Audio Settings Toggle"
          >
            {settings.soundEnabled ? <Volume2 className="h-4 w-4 text-green-400" /> : <VolumeX className="h-4 w-4 text-rose-500" />}
            <span className="hidden sm:inline">{settings.soundEnabled ? "Mute" : "Unmute"}</span>
          </button>

          <button
            onClick={() => {
              audio.playMenuClick();
              setIsCompactMode((prev) => !prev);
            }}
            id="compact-toggle-btn"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-705 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-medium"
            title="Sizing View Mode"
          >
            {isCompactMode ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{isCompactMode ? "Show Phone" : "Compact Layout"}</span>
          </button>

          <button
            onClick={() => {
              audio.playMenuClick();
              setIsBooted(false);
              setBootProgress(0);
            }}
            id="reboot-toggle-btn"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-705 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-medium"
            title="Replay telephone startup chime"
          >
            <RotateCcw className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">Reboot</span>
          </button>
        </div>
      </header>

      {/* 2. Main Responsive Game Frame Grid Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 md:p-8 max-w-7xl mx-auto w-full gap-8 md:gap-12 z-10">
        
        {/* Left Interactive Custom Panels (Mode display & controller configs) */}
        <div className={`w-full lg:w-80 flex flex-col space-y-4 ${isCompactMode ? "lg:flex" : "hidden lg:flex"}`}>
          {/* Game Information Box */}
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-400" /> Current Mode Rules
            </h2>
            
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span className="font-semibold block text-slate-200 uppercase tracking-tight">{activeMode.replace("_", " ")}</span>
                <p className="text-slate-400 mt-1">
                  {activeMode === GameMode.SPEED_UP && "Standard wrap borders. Overcoming each speed challenge gears the snake speeds faster (+1 level every 10 points score incremental)."}
                  {activeMode === GameMode.CLOSED_BOX && "Strict solid boundaries. Edges of the map act as fatal masonry wall bricks. Crash is sudden death!"}
                  {activeMode === GameMode.MAZES && "Physical layout walls are seeded inside. Navigate carefully within tight passages and complex block labyrinths."}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex justify-between">
                  <span>Maze:</span>
                  <span className="font-medium text-white">{currentMaze.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed Level:</span>
                  <span className="font-medium text-green-400">{currentSpeedLevel} / 10</span>
                </div>
                <div className="flex justify-between">
                  <span>Score Weight:</span>
                  <span className="font-semibold text-yellow-400">× {currentSpeedLevel * 10} pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Keyboard controls guide card */}
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl text-xs space-y-3">
            <h3 className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-indigo-400" /> Desktop Controls
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono">
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">Arrow/WASD</div>
              <div className="py-1">Move Snake</div>
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">Enter / Space</div>
              <div className="py-1">Start / OK / Pause</div>
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">Backspace/Esc</div>
              <div className="py-1">Menu Back (C)</div>
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">Keys 2 / 4 / 6 / 8</div>
              <div className="py-1">Tactile Directions</div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: The Ultimate Physical Emulator Frame */}
        <div className="flex flex-col items-center justify-center relative">
          
          {/* Simulated Physical Nokia Brick Phone Case Shell */}
          <div className={`transition-all duration-300 flex flex-col items-center select-none ${
            isCompactMode 
              ? "bg-transparent p-0 border-0 shadow-none" 
              : `p-6 md:p-8 rounded-[48px] border-4 flex flex-col items-center w-[340px] md:w-[380px] ${SHELL_THEMES.find(t => t.id === shellThemeId)?.bodyBg || SHELL_THEMES[0].bodyBg}`
          }`}>
            
            {/* Immersive Nokia 3310 Ear-Speaker & Brand banner bar (Visible in full shell mode) */}
            {!isCompactMode && (
              <div className="w-full mb-6 flex flex-col items-center">
                {/* Horizontal Ear Slit Speaker */}
                <div className="w-20 h-2 bg-slate-950 rounded-full mb-3 border border-slate-800/80" />
                {/* Vintage NOKIA grey branding */}
                <div className="text-slate-400 font-bold text-sm tracking-all -skew-x-6 text-center">NOKIA</div>
              </div>
            )}

            {/* THE MONOCHROME LIQUID CRYSTAL SCREEN ZONE */}
            <div className={`relative p-4 md:p-5 rounded-[20px] border-8 border-slate-700 bg-slate-800 transition-all duration-300 w-full overflow-hidden ${
              isCompactMode ? "max-w-xl w-full" : "w-[290px] md:w-[320px]"
            }`}>
              
              {/* Backlight LCD Glow Glass Case */}
              <div className={`relative transition-colors duration-200 nokia-screen-lcd rounded-sm border-2 border-slate-950/80 nokia-lcd-grain p-1.5 md:p-2 ${
                isBacklightOn 
                  ? `${LCD_THEMES[settings.theme].glassGlow}` 
                  : "shadow-inner border-slate-800"
              }`}
                style={{
                  backgroundColor: isBacklightOn 
                    ? LCD_THEMES[settings.theme].backlightOnBg 
                    : LCD_THEMES[settings.theme].backlightOffBg
                }}
              >
                {/* Realistic glare overlay */}
                <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-white/10 pointer-events-none mix-blend-overlay z-20" />

                {/* Main LCD `<canvas>` drawing matrix */}
                <canvas
                  id="nokia-lcd-canvas"
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="w-full h-auto block select-none rounded-[1px]"
                  style={{
                    imageRendering: "pixelated",
                    filter: "contrast(120%) saturate(110%)"
                  }}
                />
              </div>

              {/* LCD Backlight Glass Soft Power Indicator toggle pin */}
              <div className="flex justify-between items-center mt-3 px-1">
                <span className="text-[9px] font-mono text-slate-400 font-bold flex items-center gap-1">
                  💡 LCD Glow:
                  <button 
                    onClick={() => {
                      audio.playMenuClick();
                      setIsBacklightOn(!isBacklightOn);
                    }}
                    id="backlight-toggle"
                    className={`h-4 w-8 rounded-full transition-colors cursor-pointer relative ${isBacklightOn ? "bg-green-500" : "bg-slate-600"}`}
                  >
                    <div className={`h-3 w-3 rounded-full bg-white absolute top-0.5 transition-all ${isBacklightOn ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </span>

                <span className="text-[8px] font-mono text-slate-400 font-bold">
                  SNAKE II v1.02
                </span>
              </div>
            </div>

            {/* NOSTALGIC NOKIA 3310 HARDWARE KEYS (Excluded in compact viewport modes) */}
            {!isCompactMode && (
              <div className="w-full mt-6 space-y-4">
                
                {/* 3310 Functional Nav control row keys */}
                <div className="grid grid-cols-3 gap-3 px-2">
                  {/* Left Keypad option - Pause/Select */}
                  <button
                    onClick={() => handleAction("SOFT_LEFT")}
                    className="h-10 border border-slate-600 rounded-b-2xl rounded-l-md hover:brightness-115 active:translate-y-[1px] bg-linear-to-b from-slate-400 to-slate-500 text-slate-900 border-slate-400 font-bold shadow-md cursor-pointer flex flex-col justify-center items-center text-[10px]"
                    title="Pauses game / select item option"
                  >
                    <span className="text-[11px] block">─</span>
                    <span className="font-mono scale-90">OK</span>
                  </button>

                  {/* Rocker Dual Navigation Scroll Key (Up / Down) */}
                  <div className="flex flex-col space-y-0.5">
                    <button
                      onClick={() => handleAction("UP")}
                      className="h-7 border rounded-t-full hover:brightness-110 active:translate-y-[1px] bg-linear-to-b from-slate-300 to-slate-400 text-slate-80s text-md flex justify-center items-center shadow-md border-slate-350 cursor-pointer"
                      title="Move block directions up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleAction("DOWN")}
                      className="h-7 border rounded-b-full hover:brightness-110 active:translate-y-[1px] bg-linear-to-b from-slate-400 to-slate-500 text-slate-90s text-md flex justify-center items-center shadow-md border-slate-350 cursor-pointer"
                      title="Move block direction down"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Right keypad option - Clear/Cancel (C) key */}
                  <button
                    onClick={() => handleAction("SOFT_RIGHT")}
                    className="h-10 border border-slate-600 rounded-b-2xl rounded-r-md hover:brightness-115 active:translate-y-[1px] bg-linear-to-b from-slate-400 to-slate-500 text-slate-905 border-slate-400 font-bold shadow-md cursor-pointer flex flex-col justify-center items-center text-[10px]"
                    title="Menu cancels / escapes back option"
                  >
                    <span className="text-[11px] block">─</span>
                    <span className="font-mono">C</span>
                  </button>
                </div>

                {/* 12-Numpad Standard Phone grid keys area */}
                <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 px-4 pt-1">
                  
                  {/* Key 1: Helper Information */}
                  <button
                    onClick={() => {
                      audio.playMenuClick();
                      setGameState(GameState.HOW_TO_PLAY);
                    }}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs leading-none">1</span>
                    <span className="text-[8px] font-mono tracking-wider opacity-60">HELP</span>
                  </button>

                  {/* Key 2: UP directions controller */}
                  <button
                    onClick={() => {
                      handleT9Input("2");
                      handleAction("UP");
                    }}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs font-bold leading-none flex items-center text-indigo-500">2 ▲</span>
                    <span className="text-[8px] font-mono tracking-wider opacity-60">abc</span>
                  </button>

                  {/* Key 3 */}
                  <button
                    onClick={() => handleT9Input("3")}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs leading-none">3</span>
                    <span className="text-[8px] font-mono tracking-wider opacity-60">def</span>
                  </button>

                  {/* Key 4: LEFT directions controller */}
                  <button
                    onClick={() => {
                      handleT9Input("4");
                      handleAction("LEFT");
                    }}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs font-bold leading-none flex items-center text-indigo-500">4 ◄</span>
                    <span className="text-[8px] font-mono tracking-wider opacity-60">ghi</span>
                  </button>

                  {/* Key 5: Play/Pause/Center Select controller */}
                  <button
                    onClick={() => {
                      handleT9Input("5");
                      handleAction("ENTER");
                    }}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs leading-none font-bold">5 OK</span>
                    <span className="text-[8px] font-mono tracking-wider opacity-60">jkl</span>
                  </button>

                  {/* Key 6: RIGHT directions controller */}
                  <button
                    onClick={() => {
                      handleT9Input("6");
                      handleAction("RIGHT");
                    }}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs font-bold leading-none flex items-center text-indigo-500">6 ►</span>
                    <span className="text-[8px] font-mono tracking-wider opacity-60">mno</span>
                  </button>

                  {/* Key 7 */}
                  <button
                    onClick={() => handleT9Input("7")}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs leading-none">7</span>
                    <span className="text-[8px] font-mono tracking-wider opacity-60">pqrs</span>
                  </button>

                  {/* Key 8: DOWN directions controller */}
                  <button
                    onClick={() => {
                      handleT9Input("8");
                      handleAction("DOWN");
                    }}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs font-bold leading-none flex items-center text-indigo-500">8 ▼</span>
                    <span className="text-[8px] font-mono tracking-wider opacity-60">tuv</span>
                  </button>

                  {/* Key 9 */}
                  <button
                    onClick={() => handleT9Input("9")}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs leading-none">9</span>
                    <span className="text-[8px] font-mono tracking-wider opacity-60">wxyz</span>
                  </button>

                  {/* Key * */}
                  <button
                    onClick={() => {
                      audio.playMenuClick();
                      // Change screens to settings
                      setGameState(GameState.SETTINGS);
                    }}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-sm leading-none font-bold text-amber-500">*</span>
                    <span className="text-[7.5px] font-mono tracking-wider opacity-60">GLOW</span>
                  </button>

                  {/* Key 0 */}
                  <button
                    onClick={() => handleT9Input("0")}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs leading-none">0</span>
                    <span className="text-[8px] font-mono tracking-wider opacity-60">space</span>
                  </button>

                  {/* Key # */}
                  <button
                    onClick={() => {
                      audio.playMenuClick();
                      // Rotate device body theme selection
                      const nextIndex = (SHELL_THEMES.findIndex((t) => t.id === shellThemeId) + 1) % SHELL_THEMES.length;
                      setShellThemeId(SHELL_THEMES[nextIndex].id);
                    }}
                    className={`h-11 rounded-full nokia-btn border flex flex-col justify-center items-center cursor-pointer ${SHELL_THEMES.find(t=>t.id===shellThemeId)?.buttonStyle}`}
                  >
                    <span className="text-xs leading-none font-bold text-emerald-500">#</span>
                    <span className="text-[7px] font-mono tracking-wider opacity-60">SHELL</span>
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Info and customizer menu panel */}
        <div className="w-full lg:w-80 flex flex-col space-y-4">
          
          {/* Virtual shell customizations panel */}
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="font-semibold text-sm tracking-wider uppercase text-slate-400 flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-amber-400" /> Device Customizations
            </h3>

            {/* Quick physical plastic frame options */}
            <div className="py-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block mb-2">Plastic Case Shell</label>
              <div className="flex flex-wrap gap-2">
                {SHELL_THEMES.map((theme) => {
                  const isActive = theme.id === shellThemeId;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        audio.playMenuClick();
                        setShellThemeId(theme.id);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg border-2 transition-all cursor-pointer ${
                        isActive 
                          ? "border-green-400 bg-slate-805 text-white" 
                          : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                      }`}
                    >
                      {theme.name.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LCD themes options in dropdown */}
            <div className="py-1 font-sans">
              <label id="screen-glow-label" className="text-[11px] font-bold text-slate-400 uppercase tracking-tight block mb-2">
                Green Backlight Color Glow
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(LCD_THEMES).map((thm) => {
                  const isActive = settings.theme === thm;
                  return (
                    <button
                      key={thm}
                      onClick={() => {
                        audio.playMenuClick();
                        setSettings((prev) => ({ ...prev, theme: thm as any }));
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs capitalize text-center font-semibold cursor-pointer border transition-all ${
                        isActive 
                          ? "bg-slate-800 text-green-400 border-green-500/50" 
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-705"
                      }`}
                    >
                      {thm} LCD
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick instructions panel details / High Score Summary info */}
          <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-3">
            <h3 className="font-semibold text-sm tracking-wider uppercase text-slate-400 flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-400" /> Best Scores
            </h3>

            <div className="space-y-2">
              {highScores.slice(0, 3).map((hs, i) => (
                <div key={i} className="flex justify-between items-center text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-mono text-slate-400 font-bold">
                    🥇 {hs.name}
                  </span>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-white font-bold">{hs.score}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({hs.mode.replace("_", " ")})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* 3. Footer Copyright Details Info */}
      <footer className="border-t border-slate-800 bg-slate-950 p-4 text-center text-slate-500 text-xs tracking-wide z-10 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full gap-2">
        <span>Authentic Snake II Nokia Mobile recreation of the classic 3310 simulator.</span>
        <span className="font-mono text-[11px]">UTC TIME: 2026-06-09 08:08 • GUEST-SESSION Active</span>
      </footer>
    </div>
  );
}
