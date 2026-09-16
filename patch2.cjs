const fs = require('fs');
let code = fs.readFileSync('src/components/LexisGame.tsx', 'utf8');

code = code.replace(/max-w-\[320px\]/, 'max-w-md');

// Also need to make the keyboard bigger with glows
// Right now it's:
// w-full max-w-[400px] flex flex-col gap-2
// And keys are: h-12 text-sm sm:text-base

code = code.replace(
  /<div className="w-full max-w-\[400px\] flex flex-col gap-2">/,
  `<div className="w-full max-w-[500px] flex flex-col gap-2.5 sm:gap-3">`
);

code = code.replace(
  /className=\{`flex-1 h-12 rounded-lg border flex items-center justify-center font-bold text-sm sm:text-base hover:opacity-80 active:scale-95 transition-all \$\{keyStyle\}`\}/g,
  "className={`flex-1 h-14 sm:h-16 rounded-xl border-2 flex items-center justify-center font-black text-lg sm:text-xl hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] active:scale-95 active:translate-y-0 transition-all ${keyStyle}`}"
);

code = code.replace(
  /className="px-2 sm:px-3 bg-white\/10 text-white font-bold rounded-lg text-xs hover:bg-white\/20 active:scale-95 transition-all"/g,
  `className="px-3 sm:px-4 bg-white/10 text-white font-black rounded-xl text-sm sm:text-base border-2 border-white/5 hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:bg-white/20 active:scale-95 active:translate-y-0 transition-all"`
);

// We should also adjust the keyboard color classes so they glow too
code = code.replace(
  /if \(status === 'correct'\) keyStyle = "bg-\[#00ff66\] text-black font-black";/g,
  `if (status === 'correct') keyStyle = "bg-[#00ff66] border-[#00ff66] text-black font-black shadow-[0_0_15px_rgba(0,255,102,0.4)]";`
);
code = code.replace(
  /else if \(status === 'present'\) keyStyle = "bg-\[#ffb700\] text-black font-black";/g,
  `else if (status === 'present') keyStyle = "bg-[#ffb700] border-[#ffb700] text-black font-black shadow-[0_0_15px_rgba(255,183,0,0.4)]";`
);
code = code.replace(
  /else if \(status === 'absent'\) keyStyle = "bg-black\/80 text-white\/30";/g,
  `else if (status === 'absent') keyStyle = "bg-[#161b26] border-[#161b26] text-white/30";`
);

fs.writeFileSync('src/components/LexisGame.tsx', code);
