import { defineMeta } from '@platform';
import cover from './cover.webp?url';

/** Bed Wars: four teams on sky islands, each guarding its bed. Bridge out, break theirs; last team standing wins. */
export default defineMeta({
  id: 'bedwars',
  title: 'Bed Wars',
  tagline: 'Guard your bed, bridge out, break theirs. Last team standing wins.',
  accent: '#ff5b5b',
  cover,
  instances: true,
  controls: [
    ['LMB', 'attack · hold to mine'],
    ['RMB', 'place block · use item'],
    ['RMB', 'talk to the shopkeeper'],
  ],
});
