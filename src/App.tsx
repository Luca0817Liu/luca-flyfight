import React, { useEffect, useRef, useState } from 'react';
import { GameState, Player, Enemy, Bullet, Powerup, Particle, Star, Achievement, VisualFeedback } from './types';
import { playSound } from './sounds';
import Sidebar from './components/Sidebar';
import GameUI from './components/GameUI';

const SPACE_SPEED = 2; // base background scroll speed

export default function App() {
  // Game state
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('cosmic_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [level, setLevel] = useState<number>(1);
  const [warningAlert, setWarningAlert] = useState<string | null>(null);

  // Active player state
  const [player, setPlayer] = useState<Player>({
    x: 400,
    y: 500,
    width: 48,
    height: 48,
    speed: 6,
    health: 5,
    maxHealth: 5,
    shieldLife: 0,
    invulnerableTime: 0,
    tripleShotTime: 0,
    score: 0,
  });

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first_blood', name: '第一滴血 (First Blood)', description: '初涉空战，消灭第 1 架敌机！', unlocked: false, icon: 'fa-skull' },
    { id: 'surf_frenzy', name: '战机狂热 (Frenzy)', description: '积分突破 1,000 大关。', unlocked: false, icon: 'fa-fire' },
    { id: 'full_firepower', name: '火力全开 (Arsenal)', description: '获取并触发三向子弹补给。', unlocked: false, icon: 'fa-bolt' },
    { id: 'ion_shield', name: '离子屏障 (Shield)', description: '装备高能粒子能量护盾进行防御。', unlocked: false, icon: 'fa-shield-halved' },
    { id: 'survivor_3', name: '深空生存员 (Survivor)', description: '在漫天弹幕中穿梭，成功晋升至第 3 关。', unlocked: false, icon: 'fa-hourglass-half' },
    { id: 'level_master', name: '宇宙主宰 (Conqueror)', description: '征服群星，成功突破至第 5 关！', unlocked: false, icon: 'fa-trophy' },
    { id: 'narrow_escape', name: '九死一生 (Close Call)', description: '在血量仅剩 1 点时，击沉重型巡洋母舰！', unlocked: false, icon: 'fa-bolt-lightning' },
  ]);

  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  // Stats trackers
  const enemiesDefeatedRef = useRef<number>(0);
  const currentHPRef = useRef<number>(5);

  // Canvas layout dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game loop entity collections
  const entitiesRef = useRef<{
    player: Player;
    enemies: Enemy[];
    bullets: Bullet[];
    powerups: Powerup[];
    particles: Particle[];
    stars: Star[];
    feedbacks: VisualFeedback[];
    keys: { [key: string]: boolean };
    lastEnemySpawnTime: number;
    spawnInterval: number; // in ms
    touchState: { isDown: boolean; startX: number; startY: number; shipStartX: number; shipStartY: number };
  }>({
    player: {
      x: 400,
      y: 500,
      width: 48,
      height: 48,
      speed: 6,
      health: 5,
      maxHealth: 5,
      shieldLife: 0,
      invulnerableTime: 0,
      tripleShotTime: 0,
      score: 0,
    },
    enemies: [],
    bullets: [],
    powerups: [],
    particles: [],
    stars: [],
    feedbacks: [],
    keys: {},
    lastEnemySpawnTime: 0,
    spawnInterval: 1800,
    touchState: { isDown: false, startX: 0, startY: 0, shipStartX: 0, shipStartY: 0 },
  });

  const lastShotTimeRef = useRef<number>(0);
  const shootCooldown = 180; // shoot once every 180ms
  const activeLevelRef = useRef<number>(1);
  const activeScoreRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);

  // Update refs to be used inside anim loop smoothly
  useEffect(() => {
    entitiesRef.current.player = player;
  }, [player]);

  useEffect(() => {
    activeLevelRef.current = level;
  }, [level]);

  useEffect(() => {
    activeScoreRef.current = score;
  }, [score]);

  // Adjust highscore matching
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('cosmic_highscore', score.toString());
    }
  }, [score, highScore]);

  // Handle ResizeObserver as requested
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const boundedW = Math.max(380, width);
        const boundedH = Math.max(500, height);
        setDimensions({ width: boundedW, height: boundedH });

        // Relocate player to make sure they remain inside boundaries after sizing
        const p = entitiesRef.current.player;
        p.x = Math.max(20, Math.min(boundedW - p.width - 20, p.x));
        p.y = Math.max(20, Math.min(boundedH - p.height - 20, p.y));
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Generate background parallax stars
  useEffect(() => {
    const stars: Star[] = [];
    const starCount = 80;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 2 + 0.5,
        speedY: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
    entitiesRef.current.stars = stars;
  }, [dimensions.width, dimensions.height]);

  // Toast Unlock Achievements
  const triggerUnlock = (id: string) => {
    setAchievements((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx !== -1 && !prev[idx].unlocked) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], unlocked: true, unlockedAt: new Date().toLocaleTimeString() };
        playSound('achievement');
        // Toast notification trigger
        setRecentAchievement(updated[idx]);
        setTimeout(() => setRecentAchievement(null), 4000);
        return updated;
      }
      return prev;
    });
  };

  // Keyboard registers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling when hitting space bar or arrows to ensure browser integrity
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Pause toggle
      if (e.code === 'KeyP') {
        if (gameState === 'playing') {
          handlePause();
        } else if (gameState === 'paused') {
          handleResume();
        }
        return;
      }

      entitiesRef.current.keys[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      entitiesRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // General interactions setup
  const startGame = () => {
    // Reset state parameters
    setScore(0);
    setLevel(1);
    setWarningAlert(null);
    enemiesDefeatedRef.current = 0;

    const startP: Player = {
      x: dimensions.width / 2 - 24,
      y: dimensions.height - 100,
      width: 48,
      height: 48,
      speed: 6.5,
      health: 5,
      maxHealth: 5,
      shieldLife: 0,
      invulnerableTime: 1500, // starting safe space
      tripleShotTime: 0,
      score: 0,
    };
    currentHPRef.current = 5;
    setPlayer(startP);

    entitiesRef.current.player = startP;
    entitiesRef.current.enemies = [];
    entitiesRef.current.bullets = [];
    entitiesRef.current.powerups = [];
    entitiesRef.current.particles = [];
    entitiesRef.current.feedbacks = [];
    entitiesRef.current.lastEnemySpawnTime = Date.now();
    entitiesRef.current.spawnInterval = 2000;

    setGameState('playing');
  };

  const handlePause = () => {
    setGameState('paused');
  };

  const handleResume = () => {
    setGameState('playing');
  };

  const handleQuit = () => {
    setGameState('start');
  };

  // Setup game loop update and draw animations
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      updateGame(dt);
      drawGame(ctx);

      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [gameState, dimensions]);

  // Main game logic and delta time (dt) calculations
  const updateGame = (dt: number) => {
    const now = Date.now();
    const data = entitiesRef.current;
    const p = data.player;

    // A. Invul and Buff Timers calculations
    if (p.invulnerableTime > 0) {
      p.invulnerableTime -= dt;
      if (p.invulnerableTime < 0) p.invulnerableTime = 0;
    }
    if (p.tripleShotTime > 0) {
      p.tripleShotTime -= dt;
      if (p.tripleShotTime < 0) p.tripleShotTime = 0;
    }

    // B. Player Keyboard Movement
    let dx = 0;
    let dy = 0;

    if (data.keys['ArrowUp'] || data.keys['KeyW']) dy -= 1;
    if (data.keys['ArrowDown'] || data.keys['KeyS']) dy += 1;
    if (data.keys['ArrowLeft'] || data.keys['KeyA']) dx -= 1;
    if (data.keys['ArrowRight'] || data.keys['KeyD']) dx += 1;

    // Normalizing diagonals
    if (dx !== 0 && dy !== 0) {
      const scale = 0.7071;
      dx *= scale;
      dy *= scale;
    }

    p.x += dx * p.speed;
    p.y += dy * p.speed;

    // Clamps boundaries
    p.x = Math.max(10, Math.min(dimensions.width - p.width - 10, p.x));
    p.y = Math.max(10, Math.min(dimensions.height - p.height - 10, p.y));

    // C. Keyboard Shoot Triggers
    if (data.keys['Space']) {
      triggerFire(now);
    }

    // D. Star background scrolling updates
    data.stars.forEach((s) => {
      s.y += s.speedY;
      if (s.y > dimensions.height) {
        s.y = -10;
        s.x = Math.random() * dimensions.width;
      }
    });

    // E. Leveling Calculations
    const currentScore = activeScoreRef.current;
    let calculatedLevel = 1;
    if (currentScore >= 4500) {
      calculatedLevel = 5;
    } else if (currentScore >= 2400) {
      calculatedLevel = 4;
    } else if (currentScore >= 1100) {
      calculatedLevel = 3;
    } else if (currentScore >= 400) {
      calculatedLevel = 2;
    }

    if (calculatedLevel > activeLevelRef.current) {
      setLevel(calculatedLevel);
      playSound('levelUp');
      
      // Floating level badge feedback representation
      data.feedbacks.push({
        id: Math.random().toString(),
        x: dimensions.width / 2,
        y: dimensions.height / 2 - 40,
        text: `LEVEL ${calculatedLevel} - 战区升级 !`,
        color: '#22d3ee',
        alpha: 1.0,
        scale: 1.4,
        type: 'levelUp',
      });

      // Clear simple screen enemies for neat transition as requested
      data.enemies.forEach((en) => {
        spawnExplosion(en.x + en.width / 2, en.y + en.height / 2, en.color, 12);
      });
      data.enemies = [];

      // Give a small HP repair reward for clearing stages
      if (p.health < p.maxHealth) {
        p.health = Math.min(p.maxHealth, p.health + 1);
        currentHPRef.current = p.health;
        setPlayer({ ...p });
        
        data.feedbacks.push({
          id: Math.random().toString(),
          x: p.x + p.width / 2,
          y: p.y - 15,
          text: '装甲修复 +1',
          color: '#f43f5e',
          alpha: 1.0,
          scale: 1.0,
          type: 'powerup',
        });
      }

      // Manage spawn ratios
      data.spawnInterval = Math.max(800, 2000 - calculatedLevel * 250);
    }

    // Checking achievements triggered by level ups
    if (calculatedLevel >= 3) {
      triggerUnlock('survivor_3');
    }
    if (calculatedLevel >= 5) {
      triggerUnlock('level_master');
    }

    // F. Spawning Enemies Wave
    const spawnTimerDiff = now - data.lastEnemySpawnTime;
    if (spawnTimerDiff >= data.spawnInterval) {
      spawnEnemy();
      data.lastEnemySpawnTime = now;
    }

    // G. Entities Updates (Bullets, Enemies, Powerups, Particles, Floating warning feedbacks)
    
    // 1. Bullets
    for (let i = data.bullets.length - 1; i >= 0; i--) {
      const b = data.bullets[i];
      b.x += b.speedX;
      b.y += b.speedY;

      // Filter off-screen
      if (b.y < -30 || b.y > dimensions.height + 30 || b.x < -30 || b.x > dimensions.width + 30) {
        data.bullets.splice(i, 1);
      }
    }

    // 2. Enemies
    for (let i = data.enemies.length - 1; i >= 0; i--) {
      const en = data.enemies[i];
      
      // Basic logic movement
      en.x += en.speedX;
      en.y += en.speedY;

      // Pulse angle increment
      en.pulseAngle += 0.05;

      // Fast Interceptors sine wavings
      if (en.type === 'fast') {
        en.x += Math.sin(en.pulseAngle) * 3;
      }

      // Clamps left/right screen bounces
      if (en.x < 10 || en.x > dimensions.width - en.width - 10) {
        en.speedX *= -1;
      }

      // Shoot trigger
      en.shootTimer += dt;
      if (en.shootTimer >= en.shootInterval) {
        en.shootTimer = 0;
        // Heavy fires double twin lasers
        if (en.type === 'heavy') {
          data.bullets.push({
            id: Math.random().toString(),
            x: en.x + en.width * 0.25,
            y: en.y + en.height,
            width: 4,
            height: 14,
            speedX: 0,
            speedY: 4.5,
            isEnemy: true,
            damage: 1,
            color: '#a855f7',
          });
          data.bullets.push({
            id: Math.random().toString(),
            x: en.x + en.width * 0.75,
            y: en.y + en.height,
            width: 4,
            height: 14,
            speedX: 0,
            speedY: 4.5,
            isEnemy: true,
            damage: 1,
            color: '#a855f7',
          });
        } else {
          data.bullets.push({
            id: Math.random().toString(),
            x: en.x + en.width / 2,
            y: en.y + en.height,
            width: 3.5,
            height: 12,
            speedX: 0,
            speedY: 4,
            isEnemy: true,
            damage: 1,
            color: en.type === 'fast' ? '#f59e0b' : '#ef4444',
          });
        }
        playSound('enemyLaser');
      }

      // Check Slippage when escaping past bottom - warning and deduct points as requested
      if (en.y > dimensions.height) {
        // deduct points
        setScore((prev) => Math.max(0, prev - 15));
        
        // Feed text warns
        data.feedbacks.push({
          id: Math.random().toString(),
          x: en.x + en.width / 2,
          y: dimensions.height - 35,
          text: `逃脱罚分 -15`,
          color: '#f87171',
          alpha: 1.0,
          scale: 0.9,
          type: 'warning',
        });

        // Trigger on-screen warn toaster
        setWarningAlert(`敌机脱逃，阵线受损！防漏扣分`);
        setTimeout(() => setWarningAlert(null), 2500);

        data.enemies.splice(i, 1);
      }
    }

    // 3. Powerups logic updates
    for (let i = data.powerups.length - 1; i >= 0; i--) {
      const po = data.powerups[i];
      po.y += po.speedY;

      // Sine pulse scale animations
      po.pulseScale = 1 + Math.sin(now / 150) * 0.12;

      // Colls collision with player
      if (detectCollision(po, p)) {
        playSound('powerup');
        applyPowerup(po.type);

        data.feedbacks.push({
          id: Math.random().toString(),
          x: po.x,
          y: po.y - 10,
          text: po.type === 'triple' ? 'TRIPLE LASER! 火力全开' : po.type === 'shield' ? 'DEPOLOYED SHIELD! 护盾覆盖' : 'ARMOR REPAIRED! 装甲修复',
          color: po.type === 'triple' ? '#10b981' : po.type === 'shield' ? '#3b82f6' : '#ef4444',
          alpha: 1.0,
          scale: 1.1,
          type: 'powerup',
        });

        // Clean out
        data.powerups.splice(i, 1);
        continue;
      }

      if (po.y > dimensions.height + 40) {
        data.powerups.splice(i, 1);
      }
    }

    // 4. Particles update
    for (let i = data.particles.length - 1; i >= 0; i--) {
      const pa = data.particles[i];
      pa.x += pa.vx;
      pa.y += pa.vy;
      pa.alpha -= pa.decay;
      if (pa.alpha <= 0) {
        data.particles.splice(i, 1);
      }
    }

    // 5. Floating text feedback values
    for (let i = data.feedbacks.length - 1; i >= 0; i--) {
      const f = data.feedbacks[i];
      f.y -= 0.8;
      f.alpha -= 0.015;
      if (f.alpha <= 0) {
        data.feedbacks.splice(i, 1);
      }
    }

    // H. Collisions Detections
    handleCollisions();

    // Trigger state changes to force React to repaint heads up display (HUD)
    setPlayer({ ...p });
  };

  // Setup bullet shoots
  const triggerFire = (now: number) => {
    const data = entitiesRef.current;
    const p = data.player;

    if (now - lastShotTimeRef.current >= shootCooldown) {
      lastShotTimeRef.current = now;
      playSound('laser');

      if (p.tripleShotTime > 0) {
        // Fire three distinct lasers
        // Center
        data.bullets.push({
          id: Math.random().toString(),
          x: p.x + p.width / 2,
          y: p.y - 5,
          width: 3.5,
          height: 15,
          speedX: 0,
          speedY: -9,
          isEnemy: false,
          damage: 1,
          color: '#10b981',
        });
        // Left slant
        data.bullets.push({
          id: Math.random().toString(),
          x: p.x + p.width / 4,
          y: p.y,
          width: 3.5,
          height: 15,
          speedX: -2.3,
          speedY: -8.5,
          isEnemy: false,
          damage: 1,
          color: '#10b981',
        });
        // Right slant
        data.bullets.push({
          id: Math.random().toString(),
          x: p.x + (p.width * 3) / 4,
          y: p.y,
          width: 3.5,
          height: 15,
          speedX: 2.3,
          speedY: -8.5,
          isEnemy: false,
          damage: 1,
          color: '#10b981',
        });
      } else {
        // Standard single center laser
        data.bullets.push({
          id: Math.random().toString(),
          x: p.x + p.width / 2,
          y: p.y - 10,
          width: 3.5,
          height: 14,
          speedX: 0,
          speedY: -8.5,
          isEnemy: false,
          damage: 1,
          color: '#22d3ee',
        });
      }
    }
  };

  // Spawn hostile ships
  const spawnEnemy = () => {
    const data = entitiesRef.current;
    const rand = Math.random();
    let type: 'basic' | 'fast' | 'heavy' = 'basic';

    const currentLevel = activeLevelRef.current;

    // Distribute enemy types on level multipliers
    if (currentLevel >= 3) {
      if (rand < 0.25) {
        type = 'heavy';
      } else if (rand < 0.55) {
        type = 'fast';
      }
    } else if (currentLevel >= 2) {
      if (rand < 0.35) {
        type = 'fast';
      }
    }

    let config = {
      width: 40,
      height: 40,
      health: 1,
      color: '#ef4444',
      speedY: 1.5 + currentLevel * 0.2,
      speedX: (Math.random() - 0.5) * 1.5,
      scoreValue: 50,
      shootInterval: 2200 - currentLevel * 100,
    };

    if (type === 'fast') {
      config = {
        width: 34,
        height: 34,
        health: 1,
        color: '#fbbf24',
        speedY: 2.8 + currentLevel * 0.25,
        speedX: (Math.random() - 0.5) * 2.5,
        scoreValue: 100,
        shootInterval: 1800 - currentLevel * 120,
      };
    } else if (type === 'heavy') {
      config = {
        width: 60,
        height: 52,
        health: 4,
        color: '#a855f7',
        speedY: 0.8 + currentLevel * 0.1,
        speedX: (Math.random() - 0.5) * 0.8,
        scoreValue: 250,
        shootInterval: 2800 - currentLevel * 150,
      };
    }

    const enemyX = Math.random() * (dimensions.width - config.width - 20) + 10;

    data.enemies.push({
      id: Math.random().toString(),
      type,
      x: enemyX,
      y: -config.height - 10,
      width: config.width,
      height: config.height,
      speedX: config.speedX,
      speedY: config.speedY,
      health: config.health,
      maxHealth: config.health,
      scoreValue: config.scoreValue,
      color: config.color,
      shootInterval: config.shootInterval,
      shootTimer: Math.random() * config.shootInterval * 0.5, // stagger initial fires
      pulseAngle: Math.random() * Math.PI,
    });
  };

  // Collect powerups behaviors
  const applyPowerup = (type: 'triple' | 'shield' | 'repair') => {
    const data = entitiesRef.current;
    const p = data.player;

    if (type === 'triple') {
      p.tripleShotTime = 12000; // 12 seconds buffer
      triggerUnlock('full_firepower');
    } else if (type === 'shield') {
      p.shieldLife = 1; // 1 stack of shield
      triggerUnlock('ion_shield');
    } else if (type === 'repair') {
      p.health = Math.min(p.maxHealth, p.health + 2);
      currentHPRef.current = p.health;
    }
    setPlayer({ ...p });
  };

  // Simple collision detector matching bounding squares
  const detectCollision = (
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  };

  // Bullets, enemies, and player collisions handling
  const handleCollisions = () => {
    const data = entitiesRef.current;
    const p = data.player;

    // 1. Bullet Collisions
    for (let bIdx = data.bullets.length - 1; bIdx >= 0; bIdx--) {
      const b = data.bullets[bIdx];

      if (!b.isEnemy) {
        // Player's laser strikes enemies
        for (let eIdx = data.enemies.length - 1; eIdx >= 0; eIdx--) {
          const en = data.enemies[eIdx];

          if (detectCollision(b, en)) {
            // Hit! Remove single bullet and damage enemy
            data.bullets.splice(bIdx, 1);

            en.health -= b.damage;
            playSound('hit');

            // Sparkle hit sparks
            spawnExplosion(b.x, b.y, '#ffffff', 4);

            if (en.health <= 0) {
              // Destroyed!
              playSound('explosion');
              spawnExplosion(en.x + en.width / 2, en.y + en.height / 2, en.color, en.type === 'heavy' ? 24 : 10);
              
              // Increment scorecard
              enemiesDefeatedRef.current += 1;
              if (enemiesDefeatedRef.current >= 1) {
                triggerUnlock('first_blood');
              }

              // Special "Close Call" check: killed heavy cruiser with exactly 1 HP left
              if (en.type === 'heavy' && currentHPRef.current === 1) {
                triggerUnlock('narrow_escape');
              }

              const addedScore = en.scoreValue;
              setScore((prev) => {
                const nextScore = prev + addedScore;
                if (nextScore >= 1000) {
                  triggerUnlock('surf_frenzy');
                }
                return nextScore;
              });

              // Push score float representation
              data.feedbacks.push({
                id: Math.random().toString(),
                x: en.x + en.width / 2,
                y: en.y,
                text: `+${addedScore}`,
                color: en.type === 'heavy' ? '#c084fc' : en.type === 'fast' ? '#fcd34d' : '#f87171',
                alpha: 1.0,
                scale: 1.0,
                type: 'score',
              });

              // Powerup drop chance
              const dropChance = 0.22; // 22% rate
              if (Math.random() < dropChance) {
                const types: ('triple' | 'shield' | 'repair')[] = ['triple', 'shield', 'repair'];
                const selectedType = types[Math.floor(Math.random() * types.length)];
                data.powerups.push({
                  id: Math.random().toString(),
                  type: selectedType,
                  x: en.x + en.width / 2 - 14,
                  y: en.y,
                  width: 28,
                  height: 28,
                  speedY: 2.0,
                  pulseScale: 1.0,
                });
              }

              data.enemies.splice(eIdx, 1);
            }
            break; // exit enemy scan for this player laser
          }
        }
      } else {
        // Enemy's bullet strikes player spaceship
        if (p.invulnerableTime === 0 && detectCollision(b, p)) {
          // hit!
          data.bullets.splice(bIdx, 1);
          damagePlayer(b.damage);
        }
      }
    }

    // 2. Enemy crashes straight into player ship body
    for (let eIdx = data.enemies.length - 1; eIdx >= 0; eIdx--) {
      const en = data.enemies[eIdx];
      if (p.invulnerableTime === 0 && detectCollision(en, p)) {
        // Explode the enemy spaceship instantly
        playSound('explosion');
        spawnExplosion(en.x + en.width / 2, en.y + en.height / 2, en.color, en.type === 'heavy' ? 24 : 10);
        
        data.enemies.splice(eIdx, 1);

        // Crash damages player
        damagePlayer(en.type === 'heavy' ? 2 : 1);
      }
    }
  };

  // Apply damage onto player ship
  const damagePlayer = (dmg: number) => {
    const data = entitiesRef.current;
    const p = data.player;

    if (p.shieldLife > 0) {
      playSound('hit');
      p.shieldLife -= 1;
      p.invulnerableTime = 1200; // briefly safe
      
      data.feedbacks.push({
        id: Math.random().toString(),
        x: p.x + p.width / 2,
        y: p.y - 15,
        text: '护盾吸收中阻挡！',
        color: '#60a5fa',
        alpha: 1.0,
        scale: 1.0,
        type: 'warning',
      });
    } else {
      playSound('hit');
      p.health -= dmg;
      currentHPRef.current = p.health;
      p.invulnerableTime = 1800; // invulnerable duration
      
      spawnExplosion(p.x + p.width / 2, p.y + p.height / 2, '#ef4444', 8);

      data.feedbacks.push({
        id: Math.random().toString(),
        x: p.x + p.width / 2,
        y: p.y - 15,
        text: `受损 -${dmg}`,
        color: '#f43f5e',
        alpha: 1.0,
        scale: 1.1,
        type: 'warning',
      });

      if (p.health <= 0) {
        p.health = 0;
        currentHPRef.current = 0;
        playSound('explosion');
        // Mega blast particle visual representation
        spawnExplosion(p.x + p.width / 2, p.y + p.height / 2, '#3b82f6', 36);
        spawnExplosion(p.x + p.width / 2, p.y + p.height / 2, '#fa0000', 36);
        setGameState('gameover');
      }
    }
    setPlayer({ ...p });
  };

  // Spark explosions
  const spawnExplosion = (x: number, y: number, color: string, count: number) => {
    const data = entitiesRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 1.2;
      data.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 3.5 + 1.0,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.012,
        glow: true,
      });
    }
  };

  // --- DRAW CANVAS RENDERING LOGIC ---
  const drawGame = (ctx: CanvasRenderingContext2D) => {
    const data = entitiesRef.current;
    
    // Clear backbuffer with subtle black space gradient
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // 1. Draw Parallax Star background
    data.stars.forEach((s) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Draw active floating Warning feedbacks
    data.feedbacks.forEach((f) => {
      ctx.save();
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = f.color;
      
      let fontSetting = 'bold 12px sans-serif';
      if (f.type === 'levelUp') {
        fontSetting = 'bold 22px sans-serif';
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 15;
      } else if (f.type === 'powerup') {
        fontSetting = 'bold 11px sans-serif';
      }
      ctx.font = fontSetting;
      ctx.textAlign = 'center';
      
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    });

    // 3. Draw active powerups
    data.powerups.forEach((po) => {
      ctx.save();
      const centerX = po.x + po.width / 2;
      const centerY = po.y + po.height / 2;
      const radius = (po.width / 2) * po.pulseScale;

      // Glow attributes
      ctx.shadowBlur = 12;
      
      // Select appropriate theme colors
      let pColor = '#10b981'; // triple shot
      let iconSymbol = '⚡';
      if (po.type === 'shield') {
        pColor = '#3b82f6';
        iconSymbol = '🛡️';
      } else if (po.type === 'repair') {
        pColor = '#f43f5e';
        iconSymbol = '🔧';
      }

      ctx.shadowColor = pColor;
      ctx.fillStyle = `${pColor}25`;
      ctx.strokeStyle = pColor;
      ctx.lineWidth = 2;

      // Draw shiny octagon container box
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Interior pulse circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = pColor;
      ctx.fill();

      // Simple visual text letters inner
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconSymbol, centerX, centerY);

      ctx.restore();
    });

    // 4. Draw shooter bullets
    data.bullets.forEach((b) => {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = b.color;
      ctx.fillStyle = b.color;

      ctx.beginPath();
      // Draw capsule rocket pill shapes
      ctx.roundRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height, b.width / 2);
      ctx.fill();
      ctx.restore();
    });

    // 5. Draw enemy fighter ships
    data.enemies.forEach((en) => {
      ctx.save();
      ctx.shadowBlur = en.type === 'heavy' ? 15 : 10;
      ctx.shadowColor = en.color;

      const cx = en.x + en.width / 2;
      const cy = en.y + en.height / 2;

      if (en.type === 'basic') {
        // Red sleek insect glider
        ctx.fillStyle = en.color;
        ctx.beginPath();
        // Nose pointer
        ctx.moveTo(cx, en.y + en.height);
        // Left wing tips
        ctx.lineTo(en.x, en.y);
        ctx.lineTo(cx - 5, en.y + en.height * 0.4);
        ctx.lineTo(cx + 5, en.y + en.height * 0.4);
        ctx.lineTo(en.x + en.width, en.y);
        ctx.closePath();
        ctx.fill();

        // Engine flame
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(cx - 5, en.y);
        ctx.lineTo(cx, en.y - 8);
        ctx.lineTo(cx + 5, en.y);
        ctx.fill();
      } 
      else if (en.type === 'fast') {
        // Gold swept forward interceptor
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.moveTo(cx, en.y + en.height); // nose
        ctx.lineTo(en.x, en.y + 10);
        ctx.lineTo(en.x + en.width * 0.22, en.y + en.height * 0.4);
        ctx.lineTo(cx, en.y); // tail
        ctx.lineTo(en.x + en.width * 0.78, en.y + en.height * 0.4);
        ctx.lineTo(en.x + en.width, en.y + 10);
        ctx.closePath();
        ctx.fill();

        // Twin thruster sparks
        ctx.fillStyle = '#ff5100';
        ctx.fillRect(en.x + en.width * 0.3, en.y - 3, 3, 5);
        ctx.fillRect(en.x + en.width * 0.6, en.y - 3, 3, 5);
      } 
      else if (en.type === 'heavy') {
        // Giant neon purple hex command cruiser
        ctx.fillStyle = '#1e1b4b'; // dark Indigo core
        ctx.strokeStyle = en.color;
        ctx.lineWidth = 2.5;

        // Outer hexagon frame
        ctx.beginPath();
        ctx.moveTo(cx, en.y + en.height); // nose point
        ctx.lineTo(en.x, en.y + en.height * 0.7);
        ctx.lineTo(en.x, en.y + en.height * 0.2);
        ctx.lineTo(cx, en.y); // raw rear
        ctx.lineTo(en.x + en.width, en.y + en.height * 0.2);
        ctx.lineTo(en.x + en.width, en.y + en.height * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Neon core eye
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.arc(cx, cy, en.width * 0.16, 0, Math.PI * 2);
        ctx.fill();

        // Heavy shield remaining HP visual indicators
        const barW = en.width * 0.8;
        const barH = 3.5;
        const barX = cx - barW / 2;
        const barY = en.y - 10;
        
        ctx.fillStyle = '#334155';
        ctx.fillRect(barX, barY, barW, barH);

        const hpW = barW * (en.health / en.maxHealth);
        ctx.fillStyle = en.color;
        ctx.fillRect(barX, barY, hpW, barH);
      }

      ctx.restore();
    });

    // 6. Draw glowing kinetic particles (explosions and thruster trails)
    data.particles.forEach((pa) => {
      ctx.save();
      if (pa.glow) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = pa.color;
      }
      ctx.globalAlpha = pa.alpha;
      ctx.fillStyle = pa.color;
      ctx.beginPath();
      ctx.arc(pa.x, pa.y, pa.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 7. Draw Player spaceship
    const p = data.player;
    const px = p.x + p.width / 2;
    const py = p.y + p.height / 2;

    // Do not paint player ship if flashing invulnerable tick
    const isVisible = p.invulnerableTime === 0 || Math.floor(p.invulnerableTime / 100) % 2 === 0;

    if (isVisible) {
      ctx.save();
      // Configure rich glowing aura for the sleek state-of-the-art stealth jet
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#06b6d4'; // neon cyan shadow glow

      // New Chameleon Aurora/Iridescent Shifting Plasma exhaust sparks
      if (Math.random() < 0.72) {
        const plasmaColors = ['#06b6d4', '#4f46e5', '#3b82f6', '#ec4899', '#f59e0b'];
        const randomColor = plasmaColors[Math.floor(Math.random() * plasmaColors.length)];
        data.parti      // --- 1. ENGINE NOZZLE PLUMES & EXHAUST SPECTRA (Procedurally aligned beneath the ship)
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#38bdf8'; // High-voltage blue glow

      const plumeY = p.y + p.height * 0.86;
      const leftNozzleX = px - 6;
      const rightNozzleX = px + 6;
      const plumeLen = Math.random() * 12 + 10;

      // Draw twin high-energy exhaust plumes (from cylindrical nozzles)
      // Left engine plume
      const leftPlume = ctx.createLinearGradient(leftNozzleX, plumeY, leftNozzleX, plumeY + plumeLen);
      leftPlume.addColorStop(0, '#ffffff'); // ultra-clean hot core
      leftPlume.addColorStop(0.3, 'rgba(56, 189, 248, 0.8)');
      leftPlume.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = leftPlume;
      ctx.beginPath();
      ctx.moveTo(leftNozzleX - 4, plumeY);
      ctx.lineTo(leftNozzleX + 4, plumeY);
      ctx.lineTo(leftNozzleX, plumeY + plumeLen);
      ctx.closePath();
      ctx.fill();

      // Right engine plume
      const rightPlume = ctx.createLinearGradient(rightNozzleX, plumeY, rightNozzleX, plumeY + plumeLen);
      rightPlume.addColorStop(0, '#ffffff');
      rightPlume.addColorStop(0.3, 'rgba(56, 189, 248, 0.8)');
      rightPlume.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = rightPlume;
      ctx.beginPath();
      ctx.moveTo(rightNozzleX - 4, plumeY);
      ctx.lineTo(rightNozzleX + 4, plumeY);
      ctx.lineTo(rightNozzleX, plumeY + plumeLen);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Clean tech-sketch particles following the white-plume thermal cycle
      if (Math.random() < 0.65) {
        data.particles.push({
          x: px + (Math.random() - 0.5) * 14,
          y: p.y + p.height,
          vx: (Math.random() - 0.5) * 1.2,
          vy: Math.random() * 2.2 + SPACE_SPEED + 0.6,
          radius: Math.random() * 2.2 + 0.8,
          color: Math.random() < 0.4 ? '#ffffff' : '#38bdf8',
          alpha: 0.85,
          decay: 0.045,
          glow: true,
        });
      }

      // --- 2. VECTOR STYLE & COLOR CONFIGS (Pure blueprint style: clean whites/silvers with crisp dark charcoal ink)
      // Fill colors mimic the technical render paper style
      const basePlateFill = '#ffffff'; // Pristine white armor
      const shadePlateFill = '#f1f5f9'; // Soft silver-grey shadows
      const darkPlateFill = '#e2e8f0'; // Medium mechanics slate
      const outlineInk = '#020617'; // Crisp near-black ink pen outline

      ctx.strokeStyle = outlineInk;
      ctx.lineWidth = 1.35;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';


      // --- 3. DUAL HORIZONTAL TAILPLANES / STABILIZERS (Layered low/backwards)
      ctx.fillStyle = basePlateFill;
      
      // Left rear stabiliser
      ctx.beginPath();
      ctx.moveTo(px - 6, p.y + p.height * 0.72);
      ctx.lineTo(p.x + 3, p.y + p.height * 0.94); // outer pointer
      ctx.lineTo(p.x, p.y + p.height * 0.94);
      ctx.lineTo(px - 5, p.y + p.height * 0.82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right rear stabiliser
      ctx.beginPath();
      ctx.moveTo(px + 6, p.y + p.height * 0.72);
      ctx.lineTo(p.x + p.width - 3, p.y + p.height * 0.94); // outer pointer
      ctx.lineTo(p.x + p.width, p.y + p.height * 0.94);
      ctx.lineTo(px + 5, p.y + p.height * 0.82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();


      // --- 4. SWEPT-BACK MAIN WINGS (Aviation technical structure with internal panel lines)
      // LEFT SWEEPING WING
      ctx.fillStyle = basePlateFill;
      ctx.beginPath();
      ctx.moveTo(px - 5, p.y + p.height * 0.42); // joint at under-cockpit shoulder
      ctx.lineTo(p.x - 15, p.y + p.height * 0.76); // sharp forward sweep leading edge
      ctx.lineTo(p.x - 14, p.y + p.height * 0.81); // wing tip cap
      ctx.lineTo(px - 5, p.y + p.height * 0.71); // back slice trailing edge towards body
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Internal technical wing panel detail lines
      ctx.beginPath();
      ctx.moveTo(px - 10, p.y + p.height * 0.52);
      ctx.lineTo(p.x - 10, p.y + p.height * 0.77);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px - 8, p.y + p.height * 0.65);
      ctx.lineTo(p.x - 4, p.y + p.height * 0.79);
      ctx.stroke();

      // RIGHT SWEEPING WING
      ctx.fillStyle = basePlateFill;
      ctx.beginPath();
      ctx.moveTo(px + 5, p.y + p.height * 0.42);
      ctx.lineTo(p.x + p.width + 15, p.y + p.height * 0.76);
      ctx.lineTo(p.x + p.width + 14, p.y + p.height * 0.81);
      ctx.lineTo(px + 5, p.y + p.height * 0.71);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Internal wing panel lines
      ctx.beginPath();
      ctx.moveTo(px + 10, p.y + p.height * 0.52);
      ctx.lineTo(p.x + p.width + 10, p.y + p.height * 0.77);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(px + 8, p.y + p.height * 0.65);
      ctx.lineTo(p.x + p.width + 4, p.y + p.height * 0.79);
      ctx.stroke();


      // --- 5. TWIN CYLINDRICAL TURBOFAN ENGINE NACELLES (Distinct cylinders running along back)
      // Left engine cylinder
      ctx.fillStyle = shadePlateFill;
      ctx.beginPath();
      ctx.ellipse(px - 6, p.y + p.height * 0.68, 3.8, 11, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Left engine rear exhaust nozzle rim
      ctx.fillStyle = darkPlateFill;
      ctx.fillRect(px - 9, p.y + p.height * 0.79, 6, 7);
      ctx.strokeRect(px - 9, p.y + p.height * 0.79, 6, 7);

      // Right engine cylinder
      ctx.fillStyle = shadePlateFill;
      ctx.beginPath();
      ctx.ellipse(px + 6, p.y + p.height * 0.68, 3.8, 11, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right engine rear exhaust nozzle rim
      ctx.fillStyle = darkPlateFill;
      ctx.fillRect(px + 3, p.y + p.height * 0.79, 6, 7);
      ctx.strokeRect(px + 3, p.y + p.height * 0.79, 6, 7);


      // --- 6. CENTRAL FUSELAGE PLATING (Main body with pointy nose cone)
      ctx.fillStyle = basePlateFill;
      ctx.beginPath();
      ctx.moveTo(px, p.y + 1); // pointy nosecone tip
      ctx.lineTo(px - 5, p.y + p.height * 0.17); // expand to nose cone joint
      ctx.lineTo(px - 5, p.y + p.height * 0.31); // shoulder joint
      ctx.lineTo(px - 6, p.y + p.height * 0.74); // fuselage side
      ctx.lineTo(px - 3, p.y + p.height * 0.81); // back body taper
      ctx.lineTo(px + 3, p.y + p.height * 0.81);
      ctx.lineTo(px + 6, p.y + p.height * 0.74);
      ctx.lineTo(px + 5, p.y + p.height * 0.31);
      ctx.lineTo(px + 5, p.y + p.height * 0.17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Nosecone split line
      ctx.beginPath();
      ctx.moveTo(px - 5, p.y + p.height * 0.10);
      ctx.lineTo(px + 5, p.y + p.height * 0.10);
      ctx.stroke();

      // Centerline alignment/symmetry guideline
      ctx.beginPath();
      ctx.strokeStyle = '#e2e8f0'; // Very clean slate-grey interior panel line
      ctx.moveTo(px, p.y + p.height * 0.10);
      ctx.lineTo(px, p.y + p.height * 0.81);
      ctx.stroke();
      ctx.strokeStyle = outlineInk; // Restore ink stroke color


      // --- 7. LEFT AND RIGHT AIR INTAKES WITH SLATS (Next to cockpit)
      // Left intake scoop
      ctx.fillStyle = darkPlateFill;
      ctx.beginPath();
      ctx.moveTo(px - 9, p.y + p.height * 0.31);
      ctx.lineTo(px - 5, p.y + p.height * 0.31);
      ctx.lineTo(px - 5, p.y + p.height * 0.43);
      ctx.lineTo(px - 9, p.y + p.height * 0.43);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Left intake technical slats
      ctx.beginPath();
      ctx.moveTo(px - 9, p.y + p.height * 0.35);
      ctx.lineTo(px - 5, p.y + p.height * 0.35);
      ctx.moveTo(px - 9, p.y + p.height * 0.39);
      ctx.lineTo(px - 5, p.y + p.height * 0.39);
      ctx.stroke();

      // Right intake scoop
      ctx.fillStyle = darkPlateFill;
      ctx.beginPath();
      ctx.moveTo(px + 5, p.y + p.height * 0.31);
      ctx.lineTo(px + 9, p.y + p.height * 0.31);
      ctx.lineTo(px + 9, p.y + p.height * 0.43);
      ctx.lineTo(px + 5, p.y + p.height * 0.43);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right intake technical slats
      ctx.beginPath();
      ctx.moveTo(px + 5, p.y + p.height * 0.35);
      ctx.lineTo(px + 9, p.y + p.height * 0.35);
      ctx.moveTo(px + 5, p.y + p.height * 0.39);
      ctx.lineTo(px + 9, p.y + p.height * 0.39);
      ctx.stroke();


      // --- 8. ELONGATED MULTI-PANE BLACK-LINE PILOTS CANOPY (The key aesthetic part)
      // Nested bubble design of the cockpit frame
      ctx.fillStyle = basePlateFill;
      ctx.beginPath();
      ctx.moveTo(px, p.y + p.height * 0.13); // forward glass point
      ctx.bezierCurveTo(px - 3.4, p.y + p.height * 0.19, px - 3.4, p.y + p.height * 0.47, px, p.y + p.height * 0.52);
      ctx.bezierCurveTo(px + 3.4, p.y + p.height * 0.47, px + 3.4, p.y + p.height * 0.19, px, p.y + p.height * 0.13);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner canopy border
      ctx.beginPath();
      ctx.moveTo(px, p.y + p.height * 0.15);
      ctx.bezierCurveTo(px - 2.4, p.y + p.height * 0.20, px - 2.4, p.y + p.height * 0.45, px, p.y + p.height * 0.50);
      ctx.bezierCurveTo(px + 2.4, p.y + p.height * 0.45, px + 2.4, p.y + p.height * 0.20, px, p.y + p.height * 0.15);
      ctx.closePath();
      ctx.stroke();

      // Front cross-split pane windshield lines
      ctx.beginPath();
      ctx.moveTo(px - 2.3, p.y + p.height * 0.23);
      ctx.quadraticCurveTo(px, p.y + p.height * 0.25, px + 2.3, p.y + p.height * 0.23);
      ctx.stroke();

      // Rear cross-split pane lines
      ctx.beginPath();
      ctx.moveTo(px - 2.3, p.y + p.height * 0.42);
      ctx.quadraticCurveTo(px, p.y + p.height * 0.44, px + 2.3, p.y + p.height * 0.42);
      ctx.stroke();

      // Diagnostic technical diagonal flare glare marks on the canopy glass
      ctx.save();
      ctx.strokeStyle = '#94a3b8'; // Delicate blueprint shadow slate
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(px - 1.2, p.y + p.height * 0.26);
      ctx.lineTo(px + 0.8, p.y + p.height * 0.40);
      ctx.moveTo(px - 1.8, p.y + p.height * 0.31);
      ctx.lineTo(px + 1.4, p.y + p.height * 0.45);
      ctx.stroke();
      ctx.restore();

      // Restore outer ship canvas context
      ctx.restore();
    }

    // E. Draw active high-energy shield ring overlay
      if (p.shieldLife > 0) {
        ctx.save();
        ctx.beginPath();
        const shieldRadius = p.width * 0.75;
        ctx.arc(px, py, shieldRadius, 0, Math.PI * 2);
        
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#3b82f6';
        
        // Transparent cyan shield filling
        ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  // --- RESPONSIVE TOUCH CONTROL TRACKING FOR MOBILE VALIDATION ---
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    const data = entitiesRef.current;
    
    // Save start position
    data.touchState.isDown = true;
    data.touchState.startX = touch.clientX;
    data.touchState.startY = touch.clientY;
    data.touchState.shipStartX = data.player.x;
    data.touchState.shipStartY = data.player.y;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    const data = entitiesRef.current;
    if (!data.touchState.isDown) return;

    // Calculate move delta
    const dx = touch.clientX - data.touchState.startX;
    const dy = touch.clientY - data.touchState.startY;

    // Move player relative to drag offset - speed multiplier
    data.player.x = data.touchState.shipStartX + dx * 1.15;
    data.player.y = data.touchState.shipStartY + dy * 1.15;

    // Boundary constraints clamp
    data.player.x = Math.max(10, Math.min(dimensions.width - data.player.width - 10, data.player.x));
    data.player.y = Math.max(10, Math.min(dimensions.height - data.player.height - 10, data.player.y));

    // Autofire when sliding fingers
    triggerFire(Date.now());
  };

  const handleTouchEnd = () => {
    entitiesRef.current.touchState.isDown = false;
  };

  return (
    <div className="flex h-screen w-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 font-sans select-none overflow-hidden antialiased">
      
      {/* 1. Main Game viewport container */}
      <main 
        id="game-panel-main" 
        className="grow h-full flex items-center justify-center relative p-3 md:p-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Canvas Frame Container */}
        <div 
          ref={containerRef}
          id="canvas-container" 
          className="relative w-full h-full max-w-[950px] max-h-[720px] aspect-[4/3] rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.15)] bg-slate-950 border border-white/10 flex items-center justify-center transition-all duration-500"
        >
          {/* HTML5 Graphics Canvas */}
          <canvas
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            className="block w-full h-full absolute inset-0 bg-slate-950"
          />

          {/* Interactive Responsive HUD & Menu Overlays */}
          <GameUI
            gameState={gameState}
            score={score}
            highScore={highScore}
            level={level}
            player={player}
            achievements={achievements}
            recentAchievement={recentAchievement}
            onStartGame={startGame}
            onResumeGame={handleResume}
            onPauseGame={handlePause}
            onRestartGame={startGame}
            onQuitGame={handleQuit}
            warningAlert={warningAlert}
          />
        </div>
      </main>

      {/* 2. Tactical Sidebar controls guide panel - visible on lg viewports */}
      <Sidebar />
    </div>
  );
}
