"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

type LiquidMorphGalleryProps = { images: string[]; title: string };

const gradients = [
  "radial-gradient(circle at 25% 20%, rgba(246,139,30,.24), transparent 45%), radial-gradient(circle at 80% 80%, rgba(30,41,59,.12), transparent 48%)",
  "radial-gradient(circle at 75% 25%, rgba(59,130,246,.18), transparent 45%), radial-gradient(circle at 20% 80%, rgba(246,139,30,.16), transparent 50%)",
  "radial-gradient(circle at 40% 70%, rgba(16,185,129,.16), transparent 48%), radial-gradient(circle at 85% 15%, rgba(245,158,11,.16), transparent 45%)",
];

export function LiquidMorphGallery({ images, title }: LiquidMorphGalleryProps) {
  const items = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [idle, setIdle] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const lastActivity = useRef(Date.now());

  const zoomX = useMotionValue(0);
  const zoomY = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 180, damping: 22 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 180, damping: 22 });
  const lensX = useSpring(zoomX, { stiffness: 220, damping: 24 });
  const lensY = useSpring(zoomY, { stiffness: 220, damping: 24 });

  const touch = useCallback(() => {
    lastActivity.current = Date.now();
    setInteracted(true);
    setIdle(false);
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const idle = window.setInterval(() => {
      const now = Date.now();
      const waiting = now - lastActivity.current >= 5000;
      setIdle(waiting);
      if (!paused && waiting) setActive((v) => (v + 1) % items.length);
    }, 3000);
    return () => window.clearInterval(idle);
  }, [items.length, paused]);

  useEffect(() => {
    thumbRefs.current[active]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  const select = (index: number, e?: React.MouseEvent<HTMLButtonElement>) => {
    touch();
    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
    }
    setActive(index);
  };

  const onMainMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    zoomX.set((px - 50) * 0.5);
    zoomY.set((py - 50) * 0.5);
    rotateX.set((50 - py) / 12);
    rotateY.set((px - 50) / 12);
  };

  const resetMain = () => {
    zoomX.set(0); zoomY.set(0); rotateX.set(0); rotateY.set(0);
  };

  if (!items.length) {
    return <div className="grid min-h-[390px] place-items-center rounded-2xl border bg-neutral-50 text-sm text-neutral-400">No product images</div>;
  }

  return (
    <div className="space-y-4" onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); resetMain(); }}>
      <motion.div style={{ rotateX, rotateY, perspective: 1000 }} className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,.10)]">
        <div className="pointer-events-none absolute inset-0 opacity-90" style={{ backgroundImage: gradients[active % gradients.length] }} />
        <div className="absolute left-0 right-0 top-0 z-20 h-1 overflow-hidden bg-black/5">
          {idle && !paused && items.length > 1 && <motion.div key={active} className="h-full origin-left bg-[#f68b1e]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3, ease: "linear" }} />}
        </div>
        <div className="group relative flex min-h-[390px] items-center justify-center overflow-hidden p-5" onMouseMove={onMainMove} onMouseLeave={resetMain}>
          <AnimatePresence mode="wait">
            <motion.img
              key={items[active]}
              src={items[active]}
              alt={title}
              className="relative z-10 max-h-[390px] w-full select-none object-contain"
              initial={{ scale: 0.85, borderRadius: 999, filter: "blur(10px)", opacity: 0 }}
              animate={{ scale: 1, borderRadius: 12, filter: "blur(0px)", opacity: 1 }}
              exit={{ scale: 0.85, borderRadius: 999, filter: "blur(10px)", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, duration: 0.6 }}
              style={{ transform: "translate3d(0,0,0)" }}
              draggable={false}
            />
          </AnimatePresence>
          <motion.div className="pointer-events-none absolute z-30 hidden h-16 w-16 rounded-full border border-white bg-white/10 shadow-[0_0_0_1px_rgba(0,0,0,.15)] backdrop-blur-sm md:block" style={{ left: "50%", top: "50%", x: lensX, y: lensY }} />
          {items.length > 1 && <>
            <button type="button" aria-label="Previous image" onClick={() => { touch(); setActive((v) => (v - 1 + items.length) % items.length); }} className="absolute left-4 z-40 rounded-full bg-white/90 p-3 opacity-0 shadow-md transition group-hover:opacity-100"><ChevronLeft /></button>
            <button type="button" aria-label="Next image" onClick={() => { touch(); setActive((v) => (v + 1) % items.length); }} className="absolute right-4 z-40 rounded-full bg-white/90 p-3 opacity-0 shadow-md transition group-hover:opacity-100"><ChevronRight /></button>
          </>}
          <div className="absolute bottom-4 right-4 z-30 rounded-full bg-white/90 p-2 text-neutral-700 shadow"><ZoomIn size={16} /></div>
        </div>
      </motion.div>

      <div ref={filmRef} className="relative overflow-x-auto rounded-full bg-[#111] p-2 shadow-lg snap-x snap-mandatory" style={{ backgroundImage: "radial-gradient(circle, #777 0 2px, transparent 2.5px)", backgroundSize: "14px 8px", backgroundPosition: "0 0" }}>
        <div className="flex min-w-max items-center gap-3 px-3 py-2">
          {items.map((src, i) => (
            <motion.button
              key={src + i}
              ref={(el) => { thumbRefs.current[i] = el; }}
              type="button"
              onClick={(e) => select(i, e)}
              onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - r.left - r.width / 2) / 7; const y = (e.clientY - r.top - r.height / 2) / 7; e.currentTarget.style.transform = "translate3d(" + x + "px," + y + "px,0) scale(" + (i === active ? 1.1 : .9) + ")"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translate3d(0,0,0) scale(" + (i === active ? 1.1 : .9) + ")"; }}
              className={"relative h-20 w-20 shrink-0 snap-center overflow-hidden rounded-xl bg-white transition-transform " + (i === active ? "ring-2 ring-white" : "opacity-60")}
            >
              <img src={src} alt={title + " view " + (i + 1)} className="h-full w-full object-cover" draggable={false} />
              {i === active && <motion.span layoutId="liquid-indicator" className="absolute bottom-0 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#f68b1e]" transition={{ type: "spring", stiffness: 300, damping: 25 }} />}
              {ripple?.id && i === active && ripple.id > 0 && <motion.span key={ripple.id} className="pointer-events-none absolute rounded-full bg-black/15" style={{ left: ripple.x - 6, top: ripple.y - 6, width: 12, height: 12 }} initial={{ scale: 0, opacity: .45 }} animate={{ scale: 8, opacity: 0 }} transition={{ duration: .5 }} />}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}