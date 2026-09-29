// The Mouse Calendar: the library keeps its own years, much shorter than ours, so players
// see spring, summer, autumn and winter roll by in a single sitting.
// `t` is library time in seconds (it ticks while you play, plus a little while you're away).

export const SEASON_SPEEDS = {
  relaxed: 8 * 60, // a Mouse Year every 32 minutes
  normal: 4 * 60, //  a Mouse Year every 16 minutes
  speedy: 2 * 60, //  a Mouse Year every 8 minutes
};
export const SPEED_ORDER = ['relaxed', 'normal', 'speedy'];
export const SPEED_LABEL = { relaxed: 'Relaxed', normal: 'Normal', speedy: 'Speedy' };

export function calendarAt(t, seasonSec) {
  const yearSec = seasonSec * 4;
  const year = Math.floor(t / yearSec) + 1;
  const inYear = ((t % yearSec) + yearSec) % yearSec;
  const idx = Math.min(3, Math.floor(inYear / seasonSec));
  const into = inYear - idx * seasonSec;
  return { year, idx, progress: into / seasonSec, left: seasonSec - into, seasonSec };
}
