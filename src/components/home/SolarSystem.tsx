'use client';

import { useState } from 'react';

interface PlanetDef {
  id: string;
  name: string;
  meaning: string;
  keywords: string;
  radius: number;
  duration: number;
  size: number;
  initialDeg: number;
}

const VEDIC_PLANETS: PlanetDef[] = [
  { id: 'moon',    name: 'Moon',    meaning: 'Mind & Emotions',      keywords: 'Intuition · Nurturing · Inner World',    radius: 44,  duration: 7,  size: 10, initialDeg: 45  },
  { id: 'mars',    name: 'Mars',    meaning: 'Courage & Drive',      keywords: 'Action · Ambition · Competitive Edge',  radius: 66,  duration: 11, size: 9,  initialDeg: 150 },
  { id: 'mercury', name: 'Mercury', meaning: 'Intelligence & Speech', keywords: 'Communication · Analysis · Commerce',   radius: 90,  duration: 15, size: 8,  initialDeg: 240 },
  { id: 'jupiter', name: 'Jupiter', meaning: 'Wisdom & Expansion',   keywords: 'Dharma · Prosperity · Teachers',        radius: 115, duration: 20, size: 12, initialDeg: 60  },
  { id: 'venus',   name: 'Venus',   meaning: 'Love & Beauty',        keywords: 'Relationships · Art · Pleasure',        radius: 140, duration: 28, size: 9,  initialDeg: 310 },
  { id: 'saturn',  name: 'Saturn',  meaning: 'Discipline & Karma',   keywords: 'Service · Patience · Longevity',        radius: 166, duration: 38, size: 8,  initialDeg: 200 },
  { id: 'rahu',    name: 'Rahu',    meaning: 'Ambition & Innovation', keywords: 'Transformation · Foreign · Material',  radius: 190, duration: 46, size: 8,  initialDeg: 100 },
  { id: 'ketu',    name: 'Ketu',    meaning: 'Liberation & Wisdom',  keywords: 'Spirituality · Detachment · Moksha',    radius: 210, duration: 54, size: 8,  initialDeg: 280 },
];

export function SolarSystem() {
  const [active, setActive] = useState<PlanetDef | null>(null);

  return (
    <div className="ss-wrapper">
      <div
        className="ss-system"
        role="img"
        aria-label="Animated Vedic solar system with 9 planetary bodies. Use Tab to navigate planets."
      >
        {/* Sun — center body */}
        <div className="ss-sun" aria-hidden="true">
          <div className="ss-sun-halo" />
          <div className="ss-sun-core" />
          <span className="ss-sun-label">Sun</span>
        </div>

        {/* Decorative orbit track rings */}
        {VEDIC_PLANETS.map(p => (
          <div
            key={`track-${p.id}`}
            className="ss-track"
            style={{ width: p.radius * 2, height: p.radius * 2 }}
            aria-hidden="true"
          />
        ))}

        {/* Animated planet orbits */}
        {VEDIC_PLANETS.map(p => {
          const delay = `${(-p.initialDeg / 360) * p.duration}s`;
          return (
            <div
              key={`orbit-${p.id}`}
              className="ss-orbit"
              style={{
                '--orbit-dur': `${p.duration}s`,
                '--orbit-delay': delay,
              } as React.CSSProperties}
              aria-hidden="true"
            >
              <div className="ss-planet-arm" style={{ width: p.radius }}>
                <button
                  type="button"
                  className={`ss-planet ss-planet--${p.id}`}
                  style={{ '--planet-sz': `${p.size}px` } as React.CSSProperties}
                  onMouseEnter={() => setActive(p)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => setActive(prev => prev?.id === p.id ? null : p)}
                  aria-label={`${p.name}: ${p.meaning}. ${p.keywords}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Planet info panel */}
      <div className={`ss-panel${active ? ' ss-panel--active' : ''}`} aria-live="polite">
        {active ? (
          <div className="ss-panel-content">
            <p className="ss-panel-name">{active.name}</p>
            <p className="ss-panel-meaning">{active.meaning}</p>
            <p className="ss-panel-keywords">{active.keywords}</p>
          </div>
        ) : (
          <p className="ss-panel-hint">Hover or tap a planet to explore its meaning</p>
        )}
      </div>
    </div>
  );
}
