/**
 * Game types and configurations for Space Fighter.
 */

export type GameState = 'start' | 'playing' | 'paused' | 'gameover';

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  shieldLife: number; // 0 = no shield, 1 = active shield
  invulnerableTime: number; // duration in ms remaining
  tripleShotTime: number; // duration in ms remaining
  score: number;
}

export type EnemyType = 'basic' | 'fast' | 'heavy';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  width: number;
  height: number;
  speedX: number;
  speedY: number;
  health: number;
  maxHealth: number;
  scoreValue: number;
  color: string;
  shootTimer: number;
  shootInterval: number; // in ms
  pulseAngle: number; // for pulsing glow animations
}

export type PowerupType = 'triple' | 'shield' | 'repair';

export interface Powerup {
  id: string;
  type: PowerupType;
  x: number;
  y: number;
  width: number;
  height: number;
  speedY: number;
  pulseScale: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speedX: number;
  speedY: number;
  isEnemy: boolean;
  damage: number;
  color: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  glow: boolean;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speedY: number;
  alpha: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string; // Font Awesome icon class like "fa-trophy"
  progress?: number;
  target?: number;
}

// Float warnings (when enemies escape) or score points popup
export interface VisualFeedback {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  type: 'score' | 'warning' | 'levelUp' | 'powerup';
}
