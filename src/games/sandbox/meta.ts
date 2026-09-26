import { defineMeta } from '@platform';
import cover from './cover.webp?url';

/** Creative building in an endless procedural world: the platform with no rules on top. */
export default defineMeta({
  id: 'sandbox',
  title: 'Sandbox',
  tagline: 'Build anything in an endless world',
  accent: '#7fd46b',
  cover,
  controls: [
    ['Space ×2', 'fly'],
    ['LMB', 'break'],
    ['RMB', 'place'],
    ['E', 'blocks'],
    ['MMB', 'pick the block you look at'],
  ],
});
