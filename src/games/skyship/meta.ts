import { defineMeta } from '@platform';
import cover from './cover.webp?url';

/** Skyship: crew an airship across the sky islands and light the five beacons. */
export default defineMeta({
  id: 'skyship',
  title: 'Skyship',
  tagline: 'Crew an airship across the sky islands and light the five beacons.',
  accent: '#e0663a',
  cover,
  instances: true,
  controls: [
    ['E', 'take or leave the helm'],
    ['W / S', 'ahead / astern'],
    ['A / D', 'turn'],
    ['Space / Shift', 'climb / sink'],
    ['Wheel', 'zoom out from the helm'],
  ],
});
