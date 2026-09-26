import { defineMeta } from '@platform';
import cover from './cover.webp?url';

/**
 * Blockfront II: the Rebels against the Empire, troopers and heroes, fighting over the command
 * posts of a desert spaceport. Blasters that overheat, sabers that deflect them, and the Force.
 */
export default defineMeta({
  id: 'blockfront',
  title: 'Blockfront II',
  tagline: 'Rebels against the Empire: blasters, sabers and the Force, for the command posts of a desert spaceport.',
  accent: '#ffe81f',
  cover,
  controls: [
    ['LMB', 'fire · saber'],
    ['RMB', 'aim · block'],
    ['R', 'vent the heat'],
    ['Shift', 'sprint'],
    ['C', 'crouch · slide'],
    ['1 2', 'weapons'],
    ['G', 'thermal detonator'],
    ['Q E F', 'hero powers'],
    ['H', 'class · hero · where to spawn'],
    ['Tab', 'scores'],
  ],
  // Controllers: the platform's shooter layout (RT fire, LT aim, X vent, B crouch, L3 sprint), the
  // detonator on RB, the heroes' powers on the D-pad, and the spawn menu on its down.
  gamepad: {
    RB: ['KeyG', 'detonator'],
    Left: ['KeyQ', 'power 1'],
    Up: ['KeyE', 'power 2'],
    Right: ['KeyF', 'power 3'],
    Down: ['KeyH', 'spawn menu'],
  },
  instances: true,
});
