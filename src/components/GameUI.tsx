import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Achievement, Player } from '../types';
import { getMuted, setMuted, getVolume, setVolume } from '../sounds';

interface GameUIProps {
  gameState: GameState;
  score: number;
  highScore: number;
  level: number;
  player: Player;
  achievements: Achievement[];
  recentAchievement: Achievement | null;
  onStartGame: () => void;
  onResumeGame: () => void;
  onPauseGame: () => void;
  onRestartGame: () => void;
  onQuitGame: () => void;
  warningAlert: string | null;
}

export default function GameUI({
  gameState,
  score,
  highScore,
  level,
  player,
  achievements,
  recentAchievement,
  onStartGame,
  onResumeGame,
  onPauseGame,
  onRestartGame,
  onQuitGame,
  warningAlert,
}: GameUIProps) {
  const [mutedState, setMutedState] = React.useState(getMuted());
  const [volState, setVolState] = React.useState(getVolume());

  const handleMuteToggle = () => {
    const next = !getMuted();
    setMuted(next);
    setMutedState(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setVolState(val);
    if (val > 0 && mutedState) {
      setMuted(false);
      setMutedState(false);
    }
  };

  // Safe percentage calculation for progress bars
  const hpPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
  
  return (
    <div id="game-ui-overlay" className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6 font-sans">
      
      {/* 1. HUD HEADERS (Visible only when playing or paused) */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div id="hud-top" className="w-full flex items-center justify-between pointer-events-auto bg-white/5 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-4 md:gap-6">
            {/* Score Stats */}
            <div className="flex flex-col">
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-400 font-bold leading-none">CURRENT SCORE</span>
              <span className="text-lg md:text-2xl font-mono leading-none mt-1 text-white drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                {String(score).padStart(6, '0')}
              </span>
            </div>
            <div className="h-8 w-px bg-white/15 hidden sm:block"></div>
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400 font-bold leading-none">HIGH SCORE</span>
              <span className="text-base md:text-xl font-mono leading-none mt-1 text-slate-300 opacity-80">
                {String(highScore).padStart(6, '0')}
              </span>
            </div>
          </div>

          {/* Armor, Buffs & Levels */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Buff States overlay */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-pink-500 font-bold leading-none">ARMOR INTEGRITY</span>
              <div className="flex gap-1 mt-0.5">
                {Array.from({ length: player.maxHealth }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-1.5 md:w-5 md:h-2 rounded-full transition-all duration-300 ${
                      idx < player.health
                        ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              
              {/* Buff Indicators badge below */}
              <div className="flex gap-1.5 mt-1">
                {player.shieldLife > 0 && (
                  <span className="text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded-md font-bold uppercase tracking-tight animate-pulse">
                    SHIELD ACTIVE
                  </span>
                )}
                {player.tripleShotTime > 0 && (
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-md font-bold uppercase tracking-tight">
                    TRIPLE ACTIVE ({Math.ceil(player.tripleShotTime / 1000)}s)
                  </span>
                )}
              </div>
            </div>

            {/* Level status indicator and Pause action */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-center min-w-[55px] md:min-w-[65px]">
                <span className="text-[8px] md:text-[9px] uppercase block opacity-70 text-cyan-400 font-bold tracking-wider leading-none">LEVEL</span>
                <span className="text-sm md:text-base font-bold font-mono text-cyan-200">{String(level).padStart(2, '0')}</span>
              </div>

              {gameState === 'playing' && (
                <button
                  id="btn-hud-pause"
                  onClick={onPauseGame}
                  className="p-2 md:p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer active:scale-95 transition"
                  title="暂停游戏"
                >
                  <i className="fa-solid fa-pause text-xs md:text-sm"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. ESCAPING ENEMY ALERT / FLOATING NOTIFICATION */}
      <AnimatePresence>
        {warningAlert && (
          <motion.div
            id="warning-alert-panel"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="self-center my-auto bg-red-950/75 backdrop-blur-md border border-red-500/30 text-red-200 py-2 px-5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.3)] pointer-events-none text-xs md:text-sm uppercase tracking-wider"
          >
            <i className="fa-solid fa-triangle-exclamation text-red-400 animate-flash text-base"></i>
            <span>{warningAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CORE OVERLAY MENUS (Start, Pause, Gameover) */}
      <div className="grow flex items-center justify-center py-6 w-full pointer-events-auto">
        <AnimatePresence mode="wait">
          
          {/* START MENU */}
          {gameState === 'start' && (
            <motion.div
              id="menu-start"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-md w-full bg-slate-950/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-center flex flex-col gap-6"
            >
              {/* Game Title Design */}
              <div className="flex flex-col items-center gap-1.5 relative">
                <div className="absolute -top-10 text-white/5 text-7xl font-extrabold select-none pointer-events-none uppercase tracking-[0.2em] font-mono whitespace-nowrap">
                  STARFORGE
                </div>
                <div className="text-3xl md:text-4xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-200 to-pink-500 drop-shadow-[0_0_12px_rgba(6,182,212,0.4)] font-sans">
                  战星前线 // STARFORGE
                </div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-cyan-400 font-mono font-bold">
                  TACTICAL SPACE SIMULATOR
                </div>
              </div>

              {/* Game Brief description */}
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-sm mx-auto font-sans opacity-90">
                驾驭人类最高阶重型装甲战术机，突围无尽深邃星空，狙击外星帝国侵袭军团。夺取离子双核护盾与三向激光武器补给，解锁巅峰战斗勋勋。
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  id="btn-play-game"
                  onClick={onStartGame}
                  className="w-full py-3 px-6 font-bold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.55)] border border-white/15 cursor-pointer active:scale-98 transition transform duration-150 flex items-center justify-center gap-2 group text-base"
                >
                  <i className="fa-solid fa-plane-departure animate-pulse group-hover:translate-x-0.5 transition"></i>
                  <span>起航出征 / LAUNCH SIMULATION</span>
                </button>

                {/* Sound Settings Bar */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-white/5 rounded-lg border border-white/5 text-xs text-slate-300 gap-4">
                  <button
                    id="btn-toggle-sound"
                    onClick={handleMuteToggle}
                    className="flex items-center gap-2 hover:text-white cursor-pointer"
                  >
                    <i className={`fa-solid ${mutedState ? 'fa-volume-mute text-pink-500' : 'fa-volume-high text-cyan-400'} text-base w-4 text-center`}></i>
                    <span className="font-semibold text-[11px]">{mutedState ? '音频静音 / MUTED' : '战功音效 / AUDIO ON'}</span>
                  </button>
                  <div className="flex items-center gap-2 grow">
                    <input
                      id="volume-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volState}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Achievements Scroll Panel */}
              <div className="flex flex-col gap-2.5 text-left border-t border-white/10 pt-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between items-center">
                  <span>成就系统勋章库 / UNLOCKED ARCHIVES</span>
                  <span className="text-pink-400 text-[10px] font-mono">
                    {achievements.filter(a => a.unlocked).length} / {achievements.length} ACHIEVED
                  </span>
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {achievements.map((ach) => (
                    <div 
                      key={ach.id} 
                      className={`flex gap-2.5 p-2 rounded-lg border items-center transition-all ${
                        ach.unlocked 
                          ? 'bg-cyan-500/5 border-cyan-500/20 shadow-[inset_0_0_8px_rgba(6,182,212,0.05)]' 
                          : 'bg-slate-950/40 border-white/5 text-slate-500'
                      }`}
                    >
                      <div className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs ${
                        ach.unlocked ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20' : 'bg-slate-900/60 border border-white/5'
                      }`}>
                        <i className={`fa-solid ${ach.icon}`}></i>
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-[10px] truncate ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}>{ach.name}</p>
                        <p className="text-[9px] text-slate-400 leading-none truncate mt-0.5">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Highscore */}
              {highScore > 0 && (
                <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                  SYSTEM MAX SCORE RECORD: <span className="text-cyan-400 font-bold">{highScore.toLocaleString()}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* PAUSED MENU */}
          {gameState === 'paused' && (
            <motion.div
              id="menu-paused"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-sm w-full bg-slate-950/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-center flex flex-col gap-5"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xl animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <i className="fa-solid fa-pause"></i>
                </div>
                <h3 className="text-xl font-bold text-white tracking-widest mt-1">战事暂缓 // SUSPENDED</h3>
                <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest font-bold">SYSTEM PAUSE ACTIVE</p>
              </div>

              <div className="bg-slate-900/40 p-3.5 rounded-lg border border-white/5 flex flex-col gap-2 text-xs text-left">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">CURRENT SCORE:</span>
                  <span className="text-white font-bold">{score}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">THREAT LEVEL:</span>
                  <span className="text-cyan-400 font-bold">LEVEL {level}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">ARMOR STATUS:</span>
                  <span className="text-pink-400 font-bold">{player.health} / {player.maxHealth} LIVES</span>
                </div>
              </div>

              <div className="flex gap-3 mt-1">
                <button
                  id="btn-pause-resume"
                  onClick={onResumeGame}
                  className="flex-1 py-2 rounded-xl text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold uppercase tracking-wider cursor-pointer border border-white/10 shadow-md active:scale-95 transition"
                >
                  继续战斗 RESUME
                </button>
                <button
                  id="btn-pause-quit"
                  onClick={onQuitGame}
                  className="flex-1 py-2 rounded-xl text-xs bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold uppercase tracking-wider cursor-pointer border border-white/5 active:scale-95 transition"
                >
                  终止任务 QUIT
                </button>
              </div>
            </motion.div>
          )}

          {/* GAMEOVER MENU */}
          {gameState === 'gameover' && (
            <motion.div
              id="menu-gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-md w-full bg-slate-950/80 backdrop-blur-xl border border-pink-500/20 p-6 md:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.95)] text-center flex flex-col gap-5"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-pink-500/10 text-pink-500 border border-pink-500/25 text-2xl mb-1 shadow-[0_0_15px_rgba(236,72,153,0.25)]">
                  <i className="fa-solid fa-radiation animate-spin-slow"></i>
                </div>
                <h3 className="text-2xl font-black text-pink-500 tracking-wider uppercase">战机毁灭 // SYSTEM FAIL</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">MISSION INCOMPLETE // CORE DESTROYED</p>
              </div>

              {/* Final Score stats block */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-4 rounded-xl border border-white/5 font-mono">
                <div className="text-center border-r border-white/5">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">FINAL SCORE</span>
                  <span className="text-2xl font-extrabold text-white mt-0.5 block">{score.toLocaleString()}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-bold">MAX STAGE LEVEL</span>
                  <span className="text-2xl font-extrabold text-cyan-400 mt-0.5 block">LV {level}</span>
                </div>
              </div>

              {/* Achievements unlocked this run */}
              <div className="flex flex-col gap-2.5 text-left bg-white/5 p-3.5 rounded-xl border border-white/5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                  <i className="fa-solid fa-award"></i>
                  <span>达成军事荣誉勋章 / EARNED BADGES</span>
                </h4>
                <div className="grid grid-cols-1 gap-2 max-h-28 overflow-y-auto pr-1">
                  {achievements.filter(a => a.unlocked).length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-2">无战术勋章解锁，雷达等待下次战功表现</p>
                  ) : (
                    achievements.map((ach) => ach.unlocked && (
                      <div key={ach.id} className="flex gap-2.5 p-2 rounded bg-cyan-500/5 border border-cyan-500/10 items-center">
                        <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300 text-[10px]">
                          <i className={`fa-solid ${ach.icon}`}></i>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-white leading-tight">{ach.name}</p>
                          <p className="text-[9px] text-slate-400 leading-tight truncate mt-0.5">{ach.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  id="btn-gameover-replay"
                  onClick={onRestartGame}
                  className="w-full py-3 px-6 font-bold text-white bg-gradient-to-r from-pink-600 via-blue-600 to-indigo-600 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.55)] border border-white/10 cursor-pointer active:scale-98 transition transform duration-150 flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-redo"></i>
                  <span>重组队列出动 / DEPLOY CORE UNIT</span>
                </button>
                
                <button
                  id="btn-gameover-quit"
                  onClick={onQuitGame}
                  className="w-full py-2 text-xs bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold uppercase tracking-widest cursor-pointer border border-white/5 rounded-xl active:scale-98 transition"
                >
                  返回战区终端 / TERMINAL
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* 4. FLOATING TOASTER NOTIFICATION FOR ACHIEVEMENTS */}
      <div className="absolute top-22 md:top-24 left-1/2 transform -translate-x-1/2 w-full max-w-sm pointer-events-none flex flex-col gap-2 z-30">
        <AnimatePresence>
          {recentAchievement && (
            <motion.div
              id="achievement-popup-toast"
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="bg-slate-900/90 backdrop-blur-md border border-amber-500/40 p-3.5 rounded-xl flex items-center gap-3.5 shadow-[0_10px_30px_rgba(245,158,11,0.25)] pointer-events-auto"
            >
              <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 text-base md:text-lg animate-bounce border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                <i className={`fa-solid ${recentAchievement.icon}`}></i>
              </div>
              <div className="grow min-w-0">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <i className="fa-solid fa-medal"></i> 成就勋章已解锁！
                </div>
                <h4 className="font-extrabold text-sm text-yellow-100 font-sans">{recentAchievement.name}</h4>
                <p className="text-[11px] text-slate-300 leading-tight">{recentAchievement.description}</p>
              </div>
              <div className="text-slate-500 text-[10px] self-start mt-0.5">
                <i className="fa-solid fa-check-circle text-emerald-400 text-sm"></i>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
