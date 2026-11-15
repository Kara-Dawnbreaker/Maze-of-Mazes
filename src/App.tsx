/**
 * Maze of Mazes - Main Application Orchestrator
 * Fully supports Classic Labyrinth, Dark Fog, and Stalker Hunt (Horror & Darkness).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MenuMazeCanvas } from './components/MenuMazeCanvas';
import { MainMenu } from './components/MainMenu';
import { MazeRenderer } from './components/MazeRenderer';
import { GameHUD } from './components/GameHUD';
import { VictoryModal } from './components/VictoryModal';
import { DefeatModal } from './components/DefeatModal';
import { SettingsModal } from './components/SettingsModal';
import { ProgressionModal } from './components/ProgressionModal';
import { DpadControls } from './components/DpadControls';
import {
  CategoryId,
  DifficultyId,
  GameScreen,
  MazeGrid,
  VariantId,
  Direction,
  StalkerState,
  CustomMazeDimensions,
  PuzzleSanctumState,
  LockedDoor,
  HazardTrap,
  FloodingState,
  ImpossibleGeometryState,
  MazeCollectible,
} from './types/maze';
import { ChallengeMode, Achievement, PlayerProgression } from './types/progression';
import {
  loadPlayerProgression,
  recordRun,
  getTimeTrialLimit,
  getLimitedMovesBudget,
} from './utils/progressionEngine';
import { generateMaze } from './utils/mazeGenerator';
import { generateRandomSeed, PRNG } from './utils/prng';
import { initializeStalker, updateStalkerAI } from './utils/stalkerAI';
import { HORROR_DIFFICULTY_PARAMS } from './utils/visibility';
import { sounds } from './utils/audio';
import { generatePuzzleSanctum, processPuzzleStep } from './utils/puzzleEngine';
import {
  generateHazardTraps,
  initializeFloodingState,
  updateFlooding,
  updateHazardTraps,
  checkHazardPeril,
} from './utils/hazardEngine';
import { ThemeModal } from './components/ThemeModal';
import { CharacterModal } from './components/CharacterModal';
import { ThemePreferences, MazeTheme } from './types/theme';
import { CharacterPreferences, CharacterId, EquippedCosmetics } from './types/character';
import { loadThemePreferences, getActiveTheme } from './utils/themeEngine';
import { loadCharacterPreferences, evaluateCharacterUnlocks, saveCharacterPreferences } from './utils/characterEngine';
import { generateImpossibleGeometry, checkPortalWarp } from './utils/impossibleEngine';
import { generateCollectibles } from './utils/collectibleEngine';
import { MiniMap } from './components/MiniMap';

export default function App() {
  // Screen state
  const [screen, setScreen] = useState<GameScreen>('MENU');

  // Menu Maze Journey state
  const [currentChamberIndex, setCurrentChamberIndex] = useState<number>(0);
  const [isTraveling, setIsTraveling] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('classic');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyId>('pathfinder');
  const [customDims, setCustomDims] = useState<CustomMazeDimensions>({
    cols: 21,
    rows: 21,
    isCustom: false,
  });
  const [selectedVariant, setSelectedVariant] = useState<VariantId>('pure');
  const [seed, setSeed] = useState<string>('GOLDEN-HEARTH-108');

  // Gameplay state
  const [maze, setMaze] = useState<MazeGrid | null>(null);
  const [playerPos, setPlayerPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [exploredCells, setExploredCells] = useState<Set<string>>(() => new Set(['0,0']));
  const [collectibles, setCollectibles] = useState<MazeCollectible[]>([]);
  const [collectedCollectibleIds, setCollectedCollectibleIds] = useState<string[]>([]);
  const [playerMovedRecently, setPlayerMovedRecently] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(0);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<'follow' | 'overview'>('follow');
  const [showBreadcrumbs, setShowBreadcrumbs] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Challenge Modes & Progression state
  const [progression, setProgression] = useState<PlayerProgression>(() => loadPlayerProgression());
  const [challengeMode, setChallengeMode] = useState<ChallengeMode>('none');
  const [timeTrialLimit, setTimeTrialLimit] = useState<number | undefined>(undefined);
  const [moveBudget, setMoveBudget] = useState<number | undefined>(undefined);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<Achievement[]>([]);
  const [isProgressionOpen, setIsProgressionOpen] = useState<boolean>(false);

  // Phase 13: Themes & Custom Themes state
  const [themePrefs, setThemePrefs] = useState<ThemePreferences>(() => loadThemePreferences());
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  // Phase 14: Characters & Wardrobe state
  const [charPrefs, setCharPrefs] = useState<CharacterPreferences>(() => loadCharacterPreferences());
  const [isCharModalOpen, setIsCharModalOpen] = useState<boolean>(false);

  const activeTheme: MazeTheme = getActiveTheme(themePrefs);

  // Generate a deterministic set of optional rewards for each new maze.
  useEffect(() => {
    if (!maze) {
      setCollectibles([]);
      setCollectedCollectibleIds([]);
      return;
    }
    setCollectibles(generateCollectibles(maze));
    setCollectedCollectibleIds([]);
  }, [maze]);

  const handleCollectibleCollected = useCallback((item: MazeCollectible) => {
    setCollectedCollectibleIds((previous) =>
      previous.includes(item.id) ? previous : [...previous, item.id]
    );
  }, []);

  // Keep the explored map synchronized with the current maze and player.
  useEffect(() => {
    if (!maze) {
      setExploredCells(new Set());
      return;
    }
    setExploredCells((previous) => {
      const next = previous.size === 0 ? new Set<string>() : new Set(previous);
      next.add(`${playerPos.r},${playerPos.c}`);
      return next;
    });
  }, [maze, playerPos.r, playerPos.c]);

  // Ambience audio category synchronizer
  useEffect(() => {
    if (screen === 'MENU') {
      sounds.setCategoryAmbience('menu');
    } else if (screen === 'PLAYING') {
      sounds.setCategoryAmbience(selectedCategory);
    } else {
      sounds.stopAmbience();
    }
  }, [screen, selectedCategory]);

  // Expansion gameplay systems state
  const [puzzleState, setPuzzleState] = useState<PuzzleSanctumState | null>(null);
  const [hazardTraps, setHazardTraps] = useState<HazardTrap[]>([]);
  const [floodingState, setFloodingState] = useState<FloodingState | null>(null);
  const [impossibleState, setImpossibleState] = useState<ImpossibleGeometryState | null>(null);
  const [defeatCause, setDefeatCause] = useState<
    'stalker' | 'spikes' | 'drowning' | 'timeout' | 'out_of_moves'
  >('stalker');

  // Stalker Hunt state
  const [stalker, setStalker] = useState<StalkerState | null>(null);
  const stalkerTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const moveTimeoutRef = useRef<number | null>(null);
  const doorBumpTimeoutRef = useRef<number | null>(null);

  // Stopwatch timer ref
  const timerRef = useRef<number | null>(null);
  const rngRef = useRef<PRNG>(new PRNG(seed));
  // Stable simulation timers read current state through refs.
  const gameEndHandledRef = useRef(false);
  const playerPosRef = useRef(playerPos);
  const playerMovedRecentlyRef = useRef(playerMovedRecently);
  const timeSecondsRef = useRef(timeSeconds);
  const stalkerRef = useRef(stalker);
  const handleDefeatRef = useRef<((cause?: 'stalker' | 'spikes' | 'drowning' | 'timeout' | 'out_of_moves') => void) | null>(null);
  playerPosRef.current = playerPos;
  playerMovedRecentlyRef.current = playerMovedRecently;
  timeSecondsRef.current = timeSeconds;
  stalkerRef.current = stalker;

  // Helper to initialize challenge mode parameters
  const setupChallengeLimits = useCallback(
    (shortestPathLength: number) => {
      if (challengeMode === 'time_trial') {
        const limit = getTimeTrialLimit(shortestPathLength, selectedDifficulty);
        setTimeTrialLimit(limit);
      } else {
        setTimeTrialLimit(undefined);
      }
      if (challengeMode === 'limited_moves') {
        const budget = getLimitedMovesBudget(shortestPathLength, selectedDifficulty);
        setMoveBudget(budget);
      } else {
        setMoveBudget(undefined);
      }
      setNewlyUnlockedAchievements([]);
    },
    [challengeMode, selectedDifficulty]
  );

  // Helper to initialize active realm features deterministically
  const initFeatures = useCallback(
    (generated: MazeGrid, prng: PRNG) => {
      if (selectedCategory === 'puzzle') {
        const pState = generatePuzzleSanctum(generated, selectedDifficulty, prng);
        setPuzzleState(pState);
        setHazardTraps([]);
        setFloodingState(null);
        setImpossibleState(null);
        setStalker(null);
      } else if (selectedCategory === 'hazard') {
        const traps = generateHazardTraps(generated, selectedDifficulty, prng);
        const flood = initializeFloodingState(generated, selectedDifficulty, prng);
        setHazardTraps(traps);
        setFloodingState(flood);
        setPuzzleState(null);
        setImpossibleState(null);
        setStalker(null);
      } else if (selectedCategory === 'impossible') {
        const imp = generateImpossibleGeometry(generated, selectedDifficulty, prng);
        setImpossibleState(imp);
        setPuzzleState(null);
        setHazardTraps([]);
        setFloodingState(null);
        setStalker(null);
      } else if (selectedCategory === 'horror' && selectedVariant === 'stalker') {
        const initialStalker = initializeStalker(generated, generated.entrance.r, generated.entrance.c);
        setStalker(initialStalker);
        setPuzzleState(null);
        setHazardTraps([]);
        setFloodingState(null);
        setImpossibleState(null);
      } else {
        setStalker(null);
        setPuzzleState(null);
        setHazardTraps([]);
        setFloodingState(null);
        setImpossibleState(null);
      }
    },
    [selectedCategory, selectedVariant, selectedDifficulty]
  );

  // Start gameplay maze generation
  const handleStartGame = useCallback(() => {
    gameEndHandledRef.current = false;
    const generated = generateMaze(
      seed,
      selectedDifficulty,
      customDims.isCustom ? { cols: customDims.cols, rows: customDims.rows } : null
    );
    rngRef.current = new PRNG(seed);
    setMaze(generated);
    setPlayerPos({ r: generated.entrance.r, c: generated.entrance.c });
    setStepCount(0);
    setTimeSeconds(0);
    setPlayerMovedRecently(false);

    setupChallengeLimits(generated.shortestPathLength);
    initFeatures(generated, rngRef.current);
    setScreen('PLAYING');
  }, [seed, selectedDifficulty, customDims, initFeatures, setupChallengeLimits]);

  // Restart current maze with exact same seed
  const handleRestart = useCallback(() => {
    if (maze) {
      gameEndHandledRef.current = false;
      setStepCount(0);
      setTimeSeconds(0);
      setPlayerMovedRecently(false);
      const reloaded = generateMaze(
        maze.seed,
        selectedDifficulty,
        customDims.isCustom ? { cols: customDims.cols, rows: customDims.rows } : null
      );
      rngRef.current = new PRNG(maze.seed);
      setMaze(reloaded);
      setPlayerPos({ r: reloaded.entrance.r, c: reloaded.entrance.c });

      setupChallengeLimits(reloaded.shortestPathLength);
      initFeatures(reloaded, rngRef.current);
      setScreen('PLAYING');
    }
  }, [maze, selectedDifficulty, customDims, initFeatures, setupChallengeLimits]);

  // Next maze with a fresh deterministic seed
  const handleNextMaze = useCallback(() => {
    gameEndHandledRef.current = false;
    const nextSeed = generateRandomSeed();
    setSeed(nextSeed);
    const generated = generateMaze(
      nextSeed,
      selectedDifficulty,
      customDims.isCustom ? { cols: customDims.cols, rows: customDims.rows } : null
    );
    rngRef.current = new PRNG(nextSeed);
    setMaze(generated);
    setPlayerPos({ r: generated.entrance.r, c: generated.entrance.c });
    setStepCount(0);
    setTimeSeconds(0);
    setPlayerMovedRecently(false);

    setupChallengeLimits(generated.shortestPathLength);
    initFeatures(generated, rngRef.current);
    setScreen('PLAYING');
  }, [selectedDifficulty, customDims, initFeatures, setupChallengeLimits]);

  // Return to menu
  const handleReturnToMenu = useCallback(() => {
    setScreen('MENU');
    setStalker(null);
    setCurrentChamberIndex(4);
    setIsTraveling(false);
  }, []);

  // Victory trigger
  const handleVictory = useCallback(() => {
    if (!maze || screen !== 'PLAYING' || gameEndHandledRef.current) return;
    gameEndHandledRef.current = true;
    sounds.playVictory();
    const runResult = recordRun({
      category: selectedCategory,
      difficultyId: selectedDifficulty,
      seed: maze.seed,
      isCustom: customDims.isCustom,
      challengeMode,
      isDaily: challengeMode === 'daily',
      timeSeconds,
      stepCount,
      shortestPathLength: maze.shortestPathLength,
      won: true,
    });
    setProgression(runResult.progression);
    setNewlyUnlockedAchievements(runResult.newlyUnlocked);

    // Evaluate Phase 14 Character & Cosmetic Unlocks
    const unlockRes = evaluateCharacterUnlocks(charPrefs, runResult.progression);
    if (unlockRes.newlyUnlockedCharacters.length > 0 || unlockRes.newlyUnlockedCosmetics.length > 0) {
      setCharPrefs(unlockRes.updatedPrefs);
    }

    setScreen('VICTORY');
  }, [
    maze,
    selectedCategory,
    selectedDifficulty,
    customDims,
    challengeMode,
    timeSeconds,
    stepCount,
    charPrefs,
    screen,
  ]);

  // Defeat trigger (stalker, spikes, drowning, timeout, or out of moves)
  const handleDefeat = useCallback(
    (cause: 'stalker' | 'spikes' | 'drowning' | 'timeout' | 'out_of_moves' = 'stalker') => {
      if (screen !== 'PLAYING' || gameEndHandledRef.current) return;
      gameEndHandledRef.current = true;
      setDefeatCause(cause);
      sounds.playDefeatSound();
      if (maze) {
        const runResult = recordRun({
          category: selectedCategory,
          difficultyId: selectedDifficulty,
          seed: maze.seed,
          isCustom: customDims.isCustom,
          challengeMode,
          isDaily: challengeMode === 'daily',
          timeSeconds,
          stepCount,
          shortestPathLength: maze.shortestPathLength,
          won: false,
        });
        setProgression(runResult.progression);

        const unlockRes = evaluateCharacterUnlocks(charPrefs, runResult.progression);
        if (unlockRes.newlyUnlockedCharacters.length > 0 || unlockRes.newlyUnlockedCosmetics.length > 0) {
          setCharPrefs(unlockRes.updatedPrefs);
        }
      }
      setScreen('DEFEAT');
    },
    [
      maze,
      selectedCategory,
      selectedDifficulty,
      customDims,
      challengeMode,
      timeSeconds,
      stepCount,
      charPrefs,
      screen,
    ]
  );
  handleDefeatRef.current = handleDefeat;

  // Handle informative feedback when bumping into locked puzzle gates
  const handleDoorBump = useCallback((door: LockedDoor) => {
    let msg = `Locked: ${door.name}!`;
    if (door.unlockType === 'key' && door.color) {
      msg = `Locked: Requires the ${door.color.toUpperCase()} Key!`;
    } else if (door.unlockType === 'plate') {
      msg = `Sealed Portcullis: Stand on the brass Pressure Plate!`;
    } else if (door.unlockType === 'switch') {
      msg = `Mechanism Gate: Engage the purple lever switch!`;
    } else if (door.unlockType === 'sequence') {
      msg = `Glyph Arch: Activate Alpha (A) → Beta (B) → Gamma (G) in order!`;
    }
    setPuzzleState((prev) => (prev ? { ...prev, message: msg } : prev));

    if (doorBumpTimeoutRef.current) clearTimeout(doorBumpTimeoutRef.current);
    doorBumpTimeoutRef.current = window.setTimeout(() => {
      setPuzzleState((prev) => (prev ? { ...prev, message: null } : prev));
    }, 2800);
  }, []);

  // Track player position changes, noise creation, and interactive triggers
  const handlePlayerPosChange = useCallback(
    (r: number, c: number) => {
      setPlayerPos({ r, c });
      setPlayerMovedRecently(true);

      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
      moveTimeoutRef.current = window.setTimeout(() => {
        setPlayerMovedRecently(false);
      }, 800);

      // 1. Puzzle interaction check (keys, plates, switches)
      if (selectedCategory === 'puzzle' && puzzleState) {
        const { nextState, stateChanged } = processPuzzleStep(r, c, puzzleState);
        if (stateChanged) {
          setPuzzleState(nextState);
        }
      }

      // 2. Impossible Geometry portal warp check
      if (selectedCategory === 'impossible' && impossibleState) {
        const warp = checkPortalWarp(r, c, impossibleState, Date.now());
        if (warp.didWarp && warp.targetPos) {
          sounds.playPortalWarp();
          setPlayerPos({ r: warp.targetPos.r, c: warp.targetPos.c });
          setImpossibleState((prev) =>
            prev ? { ...prev, lastTeleportTime: Date.now() } : null
          );
        }
      }

      // 3. Hazard Peril step check
      if (selectedCategory === 'hazard') {
        const peril = checkHazardPeril(r, c, hazardTraps, floodingState);
        if (peril.inPeril && peril.cause) {
          handleDefeat(peril.cause);
        }
      }
    },
    [
      selectedCategory,
      puzzleState,
      impossibleState,
      hazardTraps,
      floodingState,
      handleDefeat,
    ]
  );

  // Stopwatch timer & Time Trial timeout check
  useEffect(() => {
    if (screen === 'PLAYING') {
      const startTime = performance.now() - timeSeconds * 1000;
      timerRef.current = window.setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        setTimeSeconds(elapsed);

        if (
          challengeMode === 'time_trial' &&
          timeTrialLimit !== undefined &&
          elapsed >= timeTrialLimit
        ) {
          handleDefeatRef.current?.('timeout');
        }
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [screen, challengeMode, timeTrialLimit]);

  // Stalker AI loop during active play in Stalker Hunt mode
  useEffect(() => {
    if (
      screen === 'PLAYING' &&
      selectedCategory === 'horror' &&
      selectedVariant === 'stalker' &&
      maze &&
      stalkerRef.current
    ) {
      const horrorParams = HORROR_DIFFICULTY_PARAMS[selectedDifficulty] || HORROR_DIFFICULTY_PARAMS.pathfinder;

      stalkerTimerRef.current = window.setInterval(() => {
        setStalker((prev) => {
          if (!prev || !maze) return prev;

          const { nextStalker, captured, statusChanged } = updateStalkerAI(
            prev,
            maze,
            playerPosRef.current.r,
            playerPosRef.current.c,
            playerMovedRecentlyRef.current,
            {
              sightDistance: horrorParams.sightDistance,
              hearingDistance: horrorParams.hearingDistance,
            },
            rngRef.current
          );

          if (statusChanged) {
            if (nextStalker.status === 'CHASE' || nextStalker.status === 'SUSPICION') {
              sounds.playStalkerAlert();
            } else if (nextStalker.status === 'PATROL' && prev.status === 'SEARCH') {
              sounds.playStalkerLose();
            }
          }

          if (captured) {
            sounds.playDefeatSound();
            setTimeout(() => {
              handleDefeatRef.current?.();
            }, 300);
          }

          return nextStalker;
        });
      }, horrorParams.stalkerStepMs);
    } else {
      if (stalkerTimerRef.current) {
        clearInterval(stalkerTimerRef.current);
        stalkerTimerRef.current = null;
      }
    }

    return () => {
      if (stalkerTimerRef.current) {
        clearInterval(stalkerTimerRef.current);
      }
    };
  }, [screen, selectedCategory, selectedVariant, maze, selectedDifficulty]);

  // Heartbeat loop reads live Stalker distance without restarting on every AI step.
  useEffect(() => {
    if (
      screen === 'PLAYING' &&
      selectedCategory === 'horror' &&
      selectedVariant === 'stalker' &&
      stalkerRef.current
    ) {
      let lastHeartbeatAt = 0;
      heartbeatTimerRef.current = window.setInterval(() => {
        const distance = stalkerRef.current?.distanceToPlayer ?? Infinity;
        if (distance > 10) return;
        const intervalMs = Math.max(450, 400 + distance * 90);
        const now = Date.now();
        if (now - lastHeartbeatAt >= intervalMs) {
          sounds.playHeartbeat(Math.max(0, 1 - distance / 11));
          lastHeartbeatAt = now;
        }
      }, 100);
    } else if (heartbeatTimerRef.current !== null) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }

    return () => {
      if (heartbeatTimerRef.current !== null) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [screen, selectedCategory, selectedVariant]);

  // Hazard Simulation Tick Loop (Flooding tide & timed spike traps)
  useEffect(() => {
    if (screen === 'PLAYING' && selectedCategory === 'hazard' && maze) {
      const interval = window.setInterval(() => {
        // Update traps
        setHazardTraps((prev) => updateHazardTraps(prev, 0.15));

        // Update flooding
        setFloodingState((prev) => {
          if (!prev) return null;
          const currentPlayer = playerPosRef.current;
          const nextFlood = updateFlooding(prev, timeSecondsRef.current, maze);
          // Check if player is in submerged water
          if (nextFlood.submergedCells.has(`${currentPlayer.r},${currentPlayer.c}`)) {
            handleDefeatRef.current?.('drowning');
          }
          return nextFlood;
        });

        // Check if player is on active spike
        setHazardTraps((traps) => {
          const currentPlayer = playerPosRef.current;
          const peril = checkHazardPeril(currentPlayer.r, currentPlayer.c, traps, null);
          if (peril.inPeril && peril.cause) {
            handleDefeatRef.current?.(peril.cause);
          }
          return traps;
        });
      }, 150);

      return () => clearInterval(interval);
    }
  }, [screen, selectedCategory, maze]);

  // Spacebar toggle for Camera Mode
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (screen === 'PLAYING' && (e.code === 'Space' || e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setCameraMode((prev) => (prev === 'follow' ? 'overview' : 'follow'));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [screen]);

  // D-pad control trigger helper
  const handleDpadMove = (dir: Direction) => {
    const fn = (window as unknown as { triggerPlayerMove?: (d: Direction) => void }).triggerPlayerMove;
    if (fn) {
      fn(dir);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-amber-50 text-stone-900 select-none">
      {/* --- State 1: Main Menu & Menu Maze Journey (Always 100% Sunny & Cheerful) --- */}
      {screen === 'MENU' && (
        <>
          <MenuMazeCanvas
            currentChamberIndex={currentChamberIndex}
            isTraveling={isTraveling}
            onTravelComplete={() => setIsTraveling(false)}
          />
          <MainMenu
            currentChamberIndex={currentChamberIndex}
            isTraveling={isTraveling}
            onNavigateToChamber={(target) => {
              setIsTraveling(true);
              setCurrentChamberIndex(target);
            }}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedDifficulty={selectedDifficulty}
            onSelectDifficulty={setSelectedDifficulty}
            customDims={customDims}
            onCustomDimsChange={setCustomDims}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
            seed={seed}
            onSeedChange={setSeed}
            challengeMode={challengeMode}
            onSelectChallengeMode={setChallengeMode}
            onStartGame={handleStartGame}
            onOpenProgression={() => setIsProgressionOpen(true)}
            onOpenThemes={() => setIsThemeModalOpen(true)}
            onOpenWardrobe={() => setIsCharModalOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </>
      )}

      {/* --- State 2: Active Gameplay --- */}
      {(screen === 'PLAYING' || screen === 'VICTORY' || screen === 'DEFEAT') && maze && (
        <>
          {/* Top In-Game HUD */}
          <GameHUD
            category={selectedCategory}
            variant={selectedVariant}
            difficultyId={selectedDifficulty}
            customDims={customDims}
            puzzleState={puzzleState}
            floodingState={floodingState}
            impossibleState={impossibleState}
            stalker={stalker}
            seed={maze.seed}
            stepCount={stepCount}
            timeSeconds={timeSeconds}
            cameraMode={cameraMode}
            showBreadcrumbs={showBreadcrumbs}
            challengeMode={challengeMode}
            timeTrialLimit={timeTrialLimit}
            moveBudget={moveBudget}
            onToggleCamera={() =>
              setCameraMode((prev) => (prev === 'follow' ? 'overview' : 'follow'))
            }
            onToggleBreadcrumbs={() => setShowBreadcrumbs((prev) => !prev)}
            onRestart={handleRestart}
            onReturnToMenu={handleReturnToMenu}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenProgression={() => setIsProgressionOpen(true)}
            onOpenThemes={() => setIsThemeModalOpen(true)}
            onOpenWardrobe={() => setIsCharModalOpen(true)}
          />

          {/* Gameplay Maze Canvas */}
          <MazeRenderer
            maze={maze}
            category={selectedCategory}
            variant={selectedVariant}
            difficultyId={selectedDifficulty}
            theme={activeTheme}
            characterId={charPrefs.activeCharacterId}
            cosmetics={charPrefs.equippedCosmetics[charPrefs.activeCharacterId] || {}}
            puzzleState={puzzleState}
            hazardTraps={hazardTraps}
            floodingState={floodingState}
            impossibleState={impossibleState}
            stalker={stalker}
            showBreadcrumbs={showBreadcrumbs}
            cameraMode={cameraMode}
            onStepTaken={() => {
              setStepCount((prev) => {
                const next = prev + 1;
                if (
                  challengeMode === 'limited_moves' &&
                  moveBudget !== undefined &&
                  next >= moveBudget
                ) {
                  if (playerPos.r !== maze.exit.r || playerPos.c !== maze.exit.c) {
                    setTimeout(() => handleDefeat('out_of_moves'), 60);
                  }
                }
                return next;
              });
            }}
            onVictory={handleVictory}
            onDefeat={handleDefeat}
            onPlayerPosChange={handlePlayerPosChange}
            playerPos={playerPos}
            collectibles={collectibles}
            collectedCollectibleIds={collectedCollectibleIds}
            onCollectibleCollected={handleCollectibleCollected}
            onDoorBump={handleDoorBump}
          />

          {/* Collectible progress */}
          <div className="absolute left-4 top-24 z-30 flex items-center gap-2 rounded-xl border border-amber-300/70 bg-slate-950/90 px-3 py-2 text-xs font-semibold text-white shadow-lg">
            <span>🪙 {collectedCollectibleIds.filter((id) => id.startsWith('coin-')).length}</span>
            <span>🗝️ {collectedCollectibleIds.filter((id) => id.startsWith('key-')).length}</span>
            <span>💎 {collectedCollectibleIds.filter((id) => id.startsWith('relic-')).length}</span>
            <span className="text-slate-400">/ {collectibles.length}</span>
          </div>

          {/* Compact explored-area minimap */}
          <MiniMap maze={maze} playerPos={playerPos} exploredCells={exploredCells} />

          {/* On-screen D-Pad for touch & mouse */}
          <DpadControls onMove={handleDpadMove} />
        </>
      )}

      {/* --- State 3: Victory Modal --- */}
      {screen === 'VICTORY' && maze && (
        <VictoryModal
          timeSeconds={timeSeconds}
          stepCount={stepCount}
          shortestPathLength={maze.shortestPathLength}
          difficultyId={selectedDifficulty}
          customDims={customDims}
          seed={maze.seed}
          challengeMode={challengeMode}
          newlyUnlockedAchievements={newlyUnlockedAchievements}
          onPlayAgain={handleRestart}
          onNextMaze={handleNextMaze}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* --- State 4: Defeat Modal (Stalker, Spikes, Drowning, Timeout, or Out of Moves) --- */}
      {screen === 'DEFEAT' && maze && (
        <DefeatModal
          timeSeconds={timeSeconds}
          stepCount={stepCount}
          difficultyId={selectedDifficulty}
          customDims={customDims}
          seed={maze.seed}
          cause={defeatCause}
          onRetry={handleRestart}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* Progression & Records Modal */}
      <ProgressionModal
        isOpen={isProgressionOpen}
        onClose={() => setIsProgressionOpen(false)}
        progression={progression}
      />

      {/* Settings & Audio Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cameraMode={cameraMode}
        onToggleCamera={() =>
          setCameraMode((prev) => (prev === 'follow' ? 'overview' : 'follow'))
        }
        showBreadcrumbs={showBreadcrumbs}
        onToggleBreadcrumbs={() => setShowBreadcrumbs((prev) => !prev)}
      />

      {/* Phase 13: Themes & Custom Themes Modal */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        themePrefs={themePrefs}
        onThemePrefsChange={setThemePrefs}
      />

      {/* Phase 14: Character Selection & Cosmetic Wardrobe Modal */}
      <CharacterModal
        isOpen={isCharModalOpen}
        onClose={() => setIsCharModalOpen(false)}
        charPrefs={charPrefs}
        onCharPrefsChange={setCharPrefs}
      />
    </div>
  );
}
