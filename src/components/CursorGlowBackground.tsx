import { useEffect, useRef } from 'react';

interface CursorGlowBackgroundProps {
  className?: string;
}

export function CursorGlowBackground({ className = '' }: CursorGlowBackgroundProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const setPosition = (x: number, y: number) => {
      layer.style.setProperty('--mouse-x', `${x}px`);
      layer.style.setProperty('--mouse-y', `${y}px`);
    };

    const onMove = (e: MouseEvent) => setPosition(e.clientX, e.clientY);

    const onLeave = () => {
      layer.style.setProperty('--mouse-x', '50%');
      layer.style.setProperty('--mouse-y', '40%');
    };

    setPosition(window.innerWidth * 0.25, window.innerHeight * 0.35);

    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={layerRef}
      className={`cursor-glow-layer ${className}`.trim()}
      aria-hidden
    />
  );
}
