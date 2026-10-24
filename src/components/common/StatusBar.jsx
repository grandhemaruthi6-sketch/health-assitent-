import React, { useState, useEffect } from 'react';

export const StatusBar = ({ isDark = false }) => {
  const [time, setTime] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTime(`${hours % 12 || 12}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`w-full px-6 pt-3 pb-2 flex justify-between items-center text-xs font-semibold select-none sticky top-0 z-40 transition-colors ${
        isDark ? 'text-white bg-slate-900/90 backdrop-blur-md' : 'text-slate-900 bg-white/95 backdrop-blur-md'
      }`}
      data-purpose="iphone-status-bar"
    >
      {/* Current Time */}
      <span className="font-semibold tracking-tight text-[13px] w-12 text-left pl-1">
        {time}
      </span>
      
      {/* iPhone 17 Pro Max Dynamic Island */}
      <div className="w-[122px] h-[30px] bg-black rounded-full flex items-center justify-between px-3 shadow-md mx-auto -mt-0.5 transition-all duration-300">
        {/* Left Sensor */}
        <div className="w-2.5 h-2.5 rounded-full bg-[#0a1128] border border-blue-950/80 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
        </div>
        {/* Center Activity Pill */}
        <div className="flex items-center space-x-0.5 opacity-70">
          <div className="w-0.5 h-2 bg-teal-400 rounded-full"></div>
          <div className="w-0.5 h-3 bg-teal-300 rounded-full animate-pulse"></div>
        </div>
        {/* Right Camera Lens Reflection */}
        <div className="w-2.5 h-2.5 rounded-full bg-[#0a1128] border border-blue-950/80 flex items-center justify-center">
          <div className="w-1 h-1 rounded-full bg-indigo-400/50"></div>
        </div>
      </div>

      {/* Connectivity & Battery */}
      <div className="flex items-center space-x-1.5 w-14 justify-end">
        <span className="text-[10px] font-bold tracking-tighter opacity-80">5G</span>

        {/* Signal */}
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <rect x="2" y="16" width="3" height="6" rx="1" />
          <rect x="7" y="12" width="3" height="10" rx="1" />
          <rect x="12" y="8" width="3" height="14" rx="1" />
          <rect x="17" y="4" width="3" height="18" rx="1" />
        </svg>

        {/* Battery */}
        <div className="flex items-center">
          <div className={`w-[21px] h-[11px] border rounded-[3px] p-[1.5px] flex items-center ${isDark ? 'border-white' : 'border-slate-800'}`}>
            <div className={`h-full w-[85%] rounded-[1.5px] ${isDark ? 'bg-white' : 'bg-slate-800'}`}></div>
          </div>
          <div className={`w-[1px] h-[4px] rounded-r-[1px] ml-[1px] ${isDark ? 'bg-white' : 'bg-slate-800'}`}></div>
        </div>
      </div>
    </div>
  );
};
