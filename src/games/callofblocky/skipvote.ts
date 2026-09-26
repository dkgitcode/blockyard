import type { GameContext, Player, WidgetHandle } from '@platform';
import { match } from './match';

/**
 * The vote to skip. Someone who doesn't fancy the match that's on (its mode, its map, or the two
 * together) presses V (or types /skip), and once more than half of the people in the game have,
 * it's skipped: `server.ts` moves on to the next match, the one that would have followed it
 * (the rotation's next, in a public room). Only people vote, and only people count toward the
 * half: never bots, and nobody watching from the home page (they aren't in the game until they
 * press Play). Pressing V again takes your vote back.
 *
 * A vote is for the match on now. It opens a few seconds in (time to see what's on, and a skip
 * can't run on into the match after it), shuts once the match is over, and starts from nothing
 * with each match, skipped or played out. Between The Briefcase's rounds it stays open: that's
 * when people have a moment to vote. Someone leaving takes their vote with them, and everyone
 * left is counted again: the votes still in may be a majority now. Each vote goes up in the feed
 * with the count, and a card at the left (hud.ts) keeps the count while any are in.
 */

/** Seconds into a match before the vote opens. */
const OPENS = 10;
/** Seconds between one person's changes of mind (V hammered can't fill the feed). */
const SETTLE = 2;

/** What the vote needs from the rest of the server. */
export interface SkipHost {
  /** A name's colour in the feed (their side's, in a team mode). */
  color(p: Player): string;
  /** The vote passed: skip the match on now. */
  skip(): void;
}

export class SkipVote {
  /** Who's voted to skip the match on now (player ids). */
  private votes = new Set<string>();
  /** When the match began, and when each person last voted or took it back (`game.clock.now`). */
  private since = 0;
  private changed = new Map<string, number>();
  private card: WidgetHandle | null = null;

  constructor(
    private game: GameContext,
    private host: SkipHost,
  ) {}

  /** The people in the match: they vote, and the majority is theirs. */
  private people(): Player[] {
    return [...match.fighters.values()].map((f) => f.player).filter((p) => !p.bot);
  }

  /** The votes it takes: more than half of the people. */
  private need(): number {
    return Math.floor(this.people().length / 2) + 1;
  }

  /** No votes in, and no card: a match begins, or it's over. */
  reset() {
    this.votes.clear();
    this.changed.clear();
    this.since = this.game.clock.now;
    this.card?.remove();
    this.card = null;
  }

  /** V (or /skip): their vote in, or taken back. Null if it was; else why not, for them to read. */
  toggle(p: Player): string | null {
    const now = this.game.clock.now;
    if (p.bot || !match.fighters.has(p.id)) return 'Only people in the match vote';
    if (match.phase !== 'playing') return "This one's over: the next is on in a moment";
    const wait = OPENS - (now - this.since);
    if (wait > 0) return `The vote to skip opens in ${Math.ceil(wait)} s`;
    if (now - (this.changed.get(p.id) ?? -Infinity) < SETTLE) return 'Hang on a second';
    const yes = !this.votes.has(p.id);
    if (yes) this.votes.add(p.id);
    else this.votes.delete(p.id);
    this.changed.set(p.id, now);
    const what = `${match.mode.name} on ${match.map.name}`;
    this.game.hud.feed([{ text: p.name, color: this.host.color(p) }, yes ? ` voted to skip ${what}` : ' took back their vote to skip', ` (${this.votes.size}/${this.need()})`]);
    this.count();
    return null;
  }

  /** Someone joined: one more person to count (the vote takes more now). */
  joined(p: Player) {
    if (!p.bot) this.count();
  }

  /** Someone left: their vote goes with them, and everyone left is counted again. */
  left(p: Player) {
    this.votes.delete(p.id);
    this.changed.delete(p.id);
    if (!p.bot) this.count();
  }

  /**
   * Count the votes again (one in or out, someone come or gone): a majority skips the match; short
   * of one, the card shows where it stands, and goes when nobody's voting.
   */
  private count() {
    if (match.phase !== 'playing') return;
    const n = this.votes.size;
    const need = this.need();
    if (n >= need) {
      this.reset();
      this.host.skip();
      return;
    }
    if (!n) {
      this.card?.remove();
      this.card = null;
      return;
    }
    const pips = Array.from({ length: need }, (_, i) => (i < n ? 'on' : 'off'));
    this.card = this.game.hud.widget('skipvote', { what: `${match.mode.name} · ${match.map.name}`, votes: n, need, pips });
    for (const p of this.people()) p.hud.widget('skipvote', { voted: this.votes.has(p.id) });
  }
}
