import { defineMeta } from '@platform';
import cover from './cover.webp?url';

/** Starfighter: dogfight TIE squadrons in an X-wing, then knock out a Star Destroyer's shields and its bridge. */
export default defineMeta({
  id: 'starfighter',
  title: 'Starfighter',
  tagline: 'Dogfight TIEs and take down a Star Destroyer',
  accent: '#ff5a4a',
  cover,
  instances: true,
  controls: [
    ['Mouse', 'steer'],
    ['LMB', 'lasers'],
    ['RMB', 'torpedo'],
    ['W / S', 'boost / brake'],
    ['Q / E', 'barrel roll'],
    ['A / D', 'bank'],
  ],
});
