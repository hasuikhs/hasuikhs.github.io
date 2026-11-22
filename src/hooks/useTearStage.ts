import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { onMediaChange } from '../lib/mediaQuery';
import { countdownDay } from '../lib/stubScenes';
import { SCROLLED_AFTER } from './useHasScrolled';

// The scroll stage needs room and motion; everything else gets the stacked page. At 600px tall the stage
// ticket is 419px (--th in stage.css) and still holds the hero copy (about 340px with its padding); a
// 1366x768 laptop's browser window (about 620px) gets the stage. Below 600 the copy spills off the ticket.
export const STAGE_QUERY =
  '(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export type TearMode = 'stage' | 'stacked';

// Stacked one-time tear, kept in React state so a re-render (the ticket flipping between
// vertical and horizontal at 768px) does not wipe the classes.
type DropState = 'idle' | 'dropped' | 'torn';
const DROP_CLASS: Record<DropState, string> = { idle: '', dropped: 'is-dropped', torn: 'is-dropped is-torn' };

const STAGE_VARS = [
  '--dxL', '--dxR', '--rotL', '--rotR', '--hero-o', '--hero-y', '--poster-o', '--perf-o',
  '--phone-o', '--phone-s', '--hint-o', '--copy-left', '--copy-w', '--phone-left', '--stub-left', '--sw',
  '--cy-k', '--pc', '--copy-dx', '--act1-o',
];

// Stacked countdown: one step every half second once act one's stub is in view.
const COUNTDOWN_STEP_MS = 500;

// Height of the site header at stage widths (64px, plus a 1px border the clamp ignores).
const HEADER_H = 64;
// The narrowest act copy the open main piece must still hold.
const MIN_COPY_W = 360;
// Act one starts while the tear is still opening; until the ticket is open its copy rides the
// main piece (--copy-dx), fades in with the scroll (--act1-o) and its stub waits for the stub
// piece to stop (data-open).
// The hero copy and act one's copy share the main piece, so they cross-fade: the hero leaves over
// [HERO_OUT, HERO_GONE], act one comes in over [ACT1_IN, ACT1_FULL]. The two overlap for .02 and
// cross at about .35 each, so together they never drop below .7 (the piece is never blank) and
// never both read clearly at once (one is under .5 all through the overlap).
const HERO_OUT = 0.075;
const ACT1_IN = 0.08;
const HERO_GONE = 0.1;
const ACT1_FULL = 0.105;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Stacked tear: how high the stub's bottom edge has to rise before the stub tears off. A short stub
// (the phone ticket's bottom strip) has to sit in the top 65% of the viewport; a stub too tall for that
// (the horizontal ticket's whole right end, in a short window) only has to be all on screen with a little
// room under it, and one taller than the viewport has to bring its bottom edge on screen.
export const stackedTearLine = (viewportH: number, stubH: number) =>
  Math.max(viewportH * 0.65, Math.min(viewportH, stubH + 16));

type StubRect = { top: number; bottom: number; height: number };

export const stubReadyToTear = (rect: StubRect, viewportH: number) =>
  rect.height > 0 && rect.bottom > 0 && rect.top < viewportH && rect.bottom <= stackedTearLine(viewportH, rect.height);

// The tear plays only once the scroll has come to rest with most of the stub on screen: checked the moment
// the stub crossed its line, a flick on a phone played the whole tear off screen.
export const STUB_SETTLE_MS = 140;
const MIN_VISIBLE = 0.6;

export const stubSettledInView = (rect: StubRect, viewportH: number) =>
  stubReadyToTear(rect, viewportH) &&
  (Math.min(rect.bottom, viewportH) - Math.max(rect.top, 0)) / rect.height >= MIN_VISIBLE;

// Phones run the tear quicker (stage.css): the scallops follow the drop sooner too.
const PHONE_QUERY = '(max-width: 767px)';
const TORN_AFTER_MS = 300;
const PHONE_TORN_AFTER_MS = 150;
const smoothstep = (e0: number, e1: number, v: number) => {
  const x = clamp((v - e0) / (e1 - e0));
  return x * x * (3 - 2 * x);
};

const readMode = (): TearMode =>
  typeof window.matchMedia === 'function' && window.matchMedia(STAGE_QUERY).matches ? 'stage' : 'stacked';

// Hero ticket + three acts.
// stage:   a sticky stage scrubbed by scroll; the ticket tears along its perforation and the
//          acts play in the gap.
// stacked: ordinary flow; the stub tears off once when it is well inside the viewport.
function useTearStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const stubRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);

  const [ mode, setMode ] = useState<TearMode>(readMode);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [ drop, setDrop ] = useState<DropState>('idle');

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia(STAGE_QUERY);
    const onChange = () => setMode(mq.matches ? 'stage' : 'stacked');
    onChange();
    return onMediaChange(mq, onChange);
  }, []);

  // Stage: measure, then scrub every frame the scroll position moves.
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const ticket = ticketRef.current;
    const stub = stubRef.current;
    const heroCopy = heroCopyRef.current;
    if (mode !== 'stage' || !section || !stage || !ticket || !stub || !heroCopy) {
      return undefined;
    }

    const acts = Array.from(stage.querySelectorAll<HTMLElement>('.act'));
    const phoneWrap = stage.querySelector<HTMLElement>('.act__phone-wrap');
    const set = (name: string, value: string) => stage.style.setProperty(name, value);

    // The act stubs' scenes (lib/stubScenes, stage.css): each holds its start ('armed') and plays while its
    // act is on and the ticket open. Act one's countdown follows the scroll position instead.
    const scenes = acts.map((el) => el.querySelector<HTMLElement>('.act__stubs'));
    scenes.forEach((el) => {
      if (el) {
        el.dataset.scene = 'armed';
      }
    });
    const countdownEl = scenes.find((el) => el?.dataset.from) ?? null;
    const countdownFrom = countdownEl ? Number(countdownEl.dataset.from) : 0;

    let dxLmax = 0;
    let dxRmax = 0;
    let collapse = 0;
    // The open ticket = main piece | gap with the phone in its middle | stub, centred with equal
    // side margins. When that is wider than the room between the margins, the main piece gives up
    // width from its left end (the poster band, faded out by then) as it opens: --pc narrows it and
    // slides the face contents out to the left, so the body copy never reflows.
    const measure = () => {
      const vw = stage.clientWidth; // not innerWidth: excludes the scrollbar
      const tw = ticket.offsetWidth;
      const sw = stub.offsetWidth;
      const phoneW = phoneWrap ? phoneWrap.offsetWidth : 0;
      const g = vw >= 1280 ? 48 : 32;
      const s = vw >= 1280 ? 40 : 28;
      const padX = vw >= 1280 ? 48 : 40;
      const T = (vw - tw) / 2; // closed ticket's left edge
      const mainW = tw - sw;
      const gap = phoneW + 2 * s; // the tear opens to the phone plus s on each side
      const maxCollapse = Math.max(0, mainW - (padX + MIN_COPY_W + 32));
      collapse = clamp(tw + gap - (vw - 2 * g), 0, maxCollapse);
      const Wopen = tw - collapse + gap; // open ticket width
      const OL = (vw - Wopen) / 2; // equal margins on both sides
      const mainRightOpen = OL + mainW - collapse;
      dxLmax = OL - (T + collapse); // main-piece travel (negative = left)
      dxRmax = OL + Wopen - T - tw; // stub travel
      set('--copy-left', `${OL + padX}px`);
      set('--copy-w', `${Math.min(520, mainRightOpen - 32 - (OL + padX))}px`);
      set('--phone-left', `${mainRightOpen + s}px`);
      set('--stub-left', `${OL + Wopen - sw}px`);
      set('--sw', `${sw}px`);
    };

    let target = 0;
    let smooth = 0;
    let init = false;
    let raf = 0;
    let lastAct = -1;
    let lastGone = false;
    let lastOpen: boolean | null = null;
    let lastPlaying = -1;
    let lastDay = -1;

    const frame = () => {
      raf = 0;
      const D = section.offsetHeight - stage.clientHeight;
      const top = section.getBoundingClientRect().top;
      target = clamp(-top, 0, D);
      // How much of the header is still above the stage (1 at the top, 0 once stuck); the CSS
      // turns it into --cy-lift.
      set('--cy-k', (clamp(top, 0, HEADER_H) / HEADER_H).toFixed(3));
      smooth = init ? smooth + (target - smooth) * 0.14 : target;
      init = true;
      if (Math.abs(target - smooth) < 0.5) {
        smooth = target;
      }
      const r = D > 0 ? smooth / D : 0;

      const heroOut = smoothstep(HERO_OUT, HERO_GONE, r);
      const act1In = smoothstep(ACT1_IN, ACT1_FULL, r);
      const split = Math.pow(smoothstep(0.04, 0.2, r), 1.3);
      // Gone before --pc has pushed the band's title (18px in) past the piece's left edge.
      const posterOut = smoothstep(0.02, 0.08, r);
      const phoneIn = smoothstep(0.12, 0.22, r);
      const hintOut = smoothstep(0, 0.03, r);
      const tug = Math.sin(Math.PI * split); // rises then settles: pieces end flat

      set('--dxL', `${(dxLmax * split).toFixed(1)}px`);
      set('--dxR', `${(dxRmax * split).toFixed(1)}px`);
      set('--pc', `${(collapse * split).toFixed(1)}px`);
      // The act copy sits where the open main piece will be; this keeps it on the moving piece.
      set('--copy-dx', `${((split - 1) * dxLmax).toFixed(1)}px`);
      set('--rotL', `${(-0.6 * tug).toFixed(3)}deg`);
      set('--rotR', `${(2.5 * tug).toFixed(3)}deg`);
      set('--hero-o', (1 - heroOut).toFixed(3));
      set('--hero-y', `${(-24 * heroOut).toFixed(1)}px`);
      set('--act1-o', act1In.toFixed(3));
      set('--poster-o', (1 - posterOut).toFixed(3));
      set('--perf-o', (1 - smoothstep(0, 0.08, split)).toFixed(3));
      set('--phone-o', phoneIn.toFixed(3));
      set('--phone-s', (0.94 + 0.06 * phoneIn).toFixed(4));
      set('--hint-o', (1 - hintOut).toFixed(3));
      ticket.classList.toggle('is-torn', split > 0.01);

      const gone = heroOut > 0.98;
      if (gone !== lastGone) {
        // The Play badge and the tour link leave the tab order once the hero is gone.
        heroCopy.style.visibility = gone ? 'hidden' : '';
        heroCopy.toggleAttribute('inert', gone);
        lastGone = gone;
      }

      const isOpen = split > 0.98;
      if (isOpen !== lastOpen) {
        stage.dataset.open = isOpen ? '1' : '0';
        lastOpen = isOpen;
      }

      const act = r < ACT1_IN ? 0 : r < 0.47 ? 1 : r < 0.73 ? 2 : 3;
      if (act !== lastAct) {
        stage.dataset.act = String(act);
        acts.forEach((el, i) => el.classList.toggle('is-active', i + 1 === act));
        lastAct = act;
      }

      const playing = isOpen ? act : 0;
      if (playing !== lastPlaying) {
        scenes.forEach((el, i) => {
          if (el) {
            el.dataset.scene = i + 1 === playing ? 'playing' : 'armed';
          }
        });
        lastPlaying = playing;
      }
      if (countdownEl) {
        const day = countdownDay(r, countdownFrom);
        if (day !== lastDay) {
          countdownEl.dataset.day = String(day);
          lastDay = day;
        }
      }

      if (smooth !== target) {
        requestTick();
      }
    };

    const requestTick = () => {
      if (!raf) {
        raf = requestAnimationFrame(frame);
      }
    };
    const onResize = () => {
      measure();
      requestTick();
    };

    measure();
    frame();
    // Once more on the next frame: leaving the stacked mode re-renders the ticket's class list
    // (dropping the stacked tear), which would otherwise wipe .is-torn until the next scroll.
    requestTick();
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', onResize);
    let alive = true;
    document.fonts?.ready.then(() => {
      if (alive) {
        onResize();
      }
    });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', requestTick);
      window.removeEventListener('resize', onResize);
      STAGE_VARS.forEach((name) => stage.style.removeProperty(name));
      delete stage.dataset.act;
      delete stage.dataset.open;
      acts.forEach((el) => el.classList.remove('is-active'));
      scenes.forEach((el) => {
        if (el) {
          delete el.dataset.scene;
          delete el.dataset.day;
        }
      });
      ticket.classList.remove('is-torn');
      heroCopy.style.visibility = '';
      heroCopy.removeAttribute('inert');
    };
  }, [ mode ]);

  // Stacked: tear the stub off once, when the scroll comes to rest with the stub risen into view
  // (stubSettledInView). It arms only after the reader's first scroll: on a tablet the whole ticket fits the
  // first screen, and a tear that plays by itself a second after load is easy to miss. The first scroll is the
  // one the scroll hint leaves at (SCROLLED_AFTER): a scroll event that leaves the page at the top (App's
  // ScrollToTop after a link) is not one, or the stub tore by itself there, on a tall phone over the hint.
  useEffect(() => {
    const ticket = ticketRef.current;
    const stub = stubRef.current;
    if (mode !== 'stacked' || !ticket || !stub) {
      return undefined;
    }
    if (typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_QUERY).matches) {
      return undefined;
    }

    const perf = ticket.querySelector<HTMLElement>('.ticket__perf');
    let settle = 0;
    let tearTimer = 0;
    let armTimer = 0;
    let scrolled = false;
    let perfReady = false;
    let armed = false;
    let done = false;
    const started = Date.now();

    const stopWatching = () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      window.removeEventListener('scrollend', watch);
      window.clearTimeout(settle);
    };

    // One layout read when the scroll settles ('scrollend' where supported, else a short quiet spell);
    // nothing at all once the stub has torn.
    function watch() {
      window.clearTimeout(settle);
      if (done || !stub || !stubSettledInView(stub.getBoundingClientRect(), window.innerHeight)) {
        return;
      }
      done = true;
      stopWatching();
      setDrop('dropped');
      const phone = typeof window.matchMedia === 'function' && window.matchMedia(PHONE_QUERY).matches;
      tearTimer = window.setTimeout(() => setDrop('torn'), phone ? PHONE_TORN_AFTER_MS : TORN_AFTER_MS);
    }

    function request() {
      if (!done) {
        window.clearTimeout(settle);
        settle = window.setTimeout(watch, STUB_SETTLE_MS);
      }
    }

    const arm = () => {
      if (armed || !scrolled || !perfReady) {
        return;
      }
      armed = true;
      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request);
      window.addEventListener('scrollend', watch);
      request();
    };

    const onScroll = () => {
      if (window.scrollY <= SCROLLED_AFTER) {
        return;
      }
      scrolled = true;
      window.removeEventListener('scroll', onScroll);
      arm();
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Wait until the load entrance has drawn the perforation, so the rewind does not fight it.
    const check = () => {
      if (!perf || perf.classList.contains('is-in') || Date.now() - started > 3200) {
        perfReady = true;
        arm();
      } else {
        armTimer = window.setTimeout(check, 200);
      }
    };
    armTimer = window.setTimeout(check, 1200);

    return () => {
      window.removeEventListener('scroll', onScroll);
      stopWatching();
      window.clearTimeout(armTimer);
      window.clearTimeout(tearTimer);
      setDrop('idle');
    };
  }, [ mode ]);

  // Stacked (tablet widths and short windows; phones hide the act stubs): each act stub plays its scene
  // once, when it is well inside the viewport. Without motion or IntersectionObserver the stubs keep their
  // end state, which is what the CSS draws by default.
  useEffect(() => {
    const section = sectionRef.current;
    if (mode !== 'stacked' || !section || typeof window.IntersectionObserver !== 'function') {
      return undefined;
    }
    if (typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_QUERY).matches) {
      return undefined;
    }

    const scenes = Array.from(section.querySelectorAll<HTMLElement>('.act__stubs'));
    const timers: number[] = [];
    scenes.forEach((el) => {
      el.dataset.scene = 'armed';
    });

    const play = (el: HTMLElement) => {
      el.dataset.scene = 'playing';
      const from = Number(el.dataset.from);
      if (from > 0) {
        el.dataset.day = String(from);
        for (let step = 1; step <= from; step += 1) {
          timers.push(window.setTimeout(() => {
            el.dataset.day = String(from - step);
          }, step * COUNTDOWN_STEP_MS));
        }
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = scenes.find((scene) => scene === entry.target);
          if (el && entry.isIntersecting) {
            io.unobserve(el);
            play(el);
          }
        });
      },
      { threshold: 1, rootMargin: '0px 0px -20% 0px' }
    );
    scenes.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
      scenes.forEach((el) => {
        delete el.dataset.scene;
        delete el.dataset.day;
      });
    };
  }, [ mode ]);

  // The '#acts' links (menu and hero button): in the stage, scroll straight to act one instead of
  // jumping to the anchor.
  const onActsClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (modeRef.current !== 'stage' || !section || !stage) {
      return;
    }
    event.preventDefault();
    const D = section.offsetHeight - stage.clientHeight;
    const top = section.getBoundingClientRect().top + window.scrollY + 0.21 * D;
    window.scrollTo({ top, behavior: 'smooth' });
    stage.querySelector<HTMLElement>('.act--1 .act__title')?.focus({ preventScroll: true });
  }, []);

  return { mode, dropClass: DROP_CLASS[drop], onActsClick, sectionRef, stageRef, ticketRef, stubRef, heroCopyRef };
}

export default useTearStage;
