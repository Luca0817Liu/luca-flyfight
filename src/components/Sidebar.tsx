import React from 'react';

export default function Sidebar() {
  return (
    <aside className="w-80 hidden lg:flex flex-col gap-6 p-6 h-full border-l border-white/5 bg-black/40 backdrop-blur-md shrink-0 overflow-y-auto">
      {/* Sidebar Header */}
      <div className="flex items-center gap-3 pb-5 border-b border-white/10">
        <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
          <i className="fa-solid fa-satellite-dish text-base"></i>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold block">战术终端</span>
          <h2 className="font-extrabold text-sm text-white tracking-wider">TACTICAL CONSOLE</h2>
        </div>
      </div>

      {/* Control Guide Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          操作控制 / Flight Controls
        </h3>
        <ul className="flex flex-col gap-2 text-xs text-slate-300">
          <li className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-arrows-up-down-left-right text-cyan-400 w-4"></i>
              战机移动 / Move
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-950 border border-slate-800 rounded text-slate-300 shadow">
              WASD / 方向键
            </kbd>
          </li>
          <li className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-bolt text-cyan-400 w-4"></i>
              激光开火 / Fire
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-950 border border-slate-800 rounded text-slate-300 shadow">
              SPACE 空格键
            </kbd>
          </li>
          <li className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-circle-pause text-cyan-400 w-4"></i>
              暂停战局 / Pause
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-950 border border-slate-800 rounded text-slate-300 shadow">
              P 键
            </kbd>
          </li>
          <li className="flex flex-col gap-1.5 p-2.5 rounded bg-cyan-950/20 border border-cyan-500/10 text-[11px] text-cyan-100/70">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
              <i className="fa-solid fa-mobile-screen-button"></i>
              移动触控支持
            </span>
            移动端或拖拽屏幕将自动激活引擎与自适应连射。
          </li>
        </ul>
      </div>

      {/* Power-ups Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          装配系统 / Military Tech
        </h3>
        <div className="flex flex-col gap-2.5">
          {/* Triple laser */}
          <div className="flex gap-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <i className="fa-solid fa-bolt text-sm"></i>
            </div>
            <div>
              <h4 className="font-bold text-xs text-cyan-200">三向重炮 (Triple Laser)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                捕获该能量球，战机将同时激发3束毁灭级超频交叉激光，破坏力爆棚，持续12秒。
              </p>
            </div>
          </div>

          {/* Energy Shield */}
          <div className="flex gap-3 p-3 rounded-xl bg-pink-500/5 border border-pink-500/15">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-pink-500/15 text-pink-400 border border-pink-500/30">
              <i className="fa-solid fa-shield-halved text-sm"></i>
            </div>
            <div>
              <h4 className="font-bold text-xs text-pink-200">离子护盾 (Energy Shield)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                战体附加一层晶体环形防御场，可完全抵御吸收一次致命撞击或外来流弹。
              </p>
            </div>
          </div>

          {/* Core Repair */}
          <div className="flex gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <i className="fa-solid fa-wrench text-sm"></i>
            </div>
            <div>
              <h4 className="font-bold text-xs text-emerald-200">纳米修复 (Repair Matrix)</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                注入纳米钢体合金，补充恢复受损的主体装甲量（HP），续航必备。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enemies Intel Section */}
      <div className="flex flex-col gap-3 pb-6">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          威胁目标 / Threat Archives
        </h3>
        <div className="flex flex-col gap-2 text-[11px] text-slate-400">
          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
            <span className="text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 inline-block rounded-full shadow-[0_0_8px_#ef4444]"></span>
              重影先锋舰 (Scout)
            </span>
            <span className="font-mono text-[10px] text-slate-500">HP 1 // Rank C</span>
          </div>
          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
            <span className="text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 inline-block rounded-full shadow-[0_0_8px_#f59e0b] animate-pulse"></span>
              幽灵猎手机 (Interceptor)
            </span>
            <span className="font-mono text-[10px] text-slate-500">HP 1 // Rank B</span>
          </div>
          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
            <span className="text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 inline-block rounded-full shadow-[0_0_8px_#a855f7]"></span>
              歼星母舰级别 (Cruiser)
            </span>
            <span className="font-mono text-[10px] text-slate-500">HP 4 // Rank S</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
