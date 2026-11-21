import type { CSSProperties } from 'react';

import FeatureIcon from '../components/FeatureIcon';
import BackToTop from '../components/BackToTop';
import { ArrowDownIcon, ChevronDownIcon } from '../components/Icons';
import MaskLines from '../components/MaskLines';
import PhoneScreenshot from '../components/PhoneScreenshot';
import PlayStoreButton from '../components/PlayStoreButton';
import PosterArt from '../components/PosterArt';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import StubLines from '../components/StubLines';
import Ticket from '../components/Ticket';
import { SITE, YEOUN } from '../data/apps';
import type { AppTile } from '../data/apps';
import PAGE_META from '../data/pageMeta.json';
import useDocumentTitle from '../hooks/useDocumentTitle';
import useEntrance from '../hooks/useEntrance';
import useMediaQuery from '../hooks/useMediaQuery';
import useReveal from '../hooks/useReveal';
import useTearStage from '../hooks/useTearStage';
import { countdownLabels } from '../lib/stubScenes';
import { joinDots } from '../lib/text';

type Vars = Record<`--${string}`, string>;
const vars = (v: Vars) => v as CSSProperties;

// '막이 내린 뒤에도, 그 순간은 남는다' -> two headline lines, the comma staying on line one.
const toLines = (text: string): string[] => text.replace(/,\s+/, ',\n').split('\n');


function Yeoun() {
  useDocumentTitle(PAGE_META.yeoun.title);
  const isPhone = useMediaQuery('(max-width: 767px)');
  const tear = useTearStage();
  const stacked = tear.mode === 'stacked';
  useEntrance('yeoun');
  useReveal(`${tear.mode}-${isPhone}`);

  // In the stage the acts are driven by scroll position, so only the stacked page reveals them.
  const actReveal = (style?: Vars) => (stacked ? { 'data-reveal': '', style: style && vars(style) } : {});
  const actRevealLines = stacked ? { 'data-reveal-lines': '' } : {};

  const { acts, archive, closing } = YEOUN;
  const dir = YEOUN.screenshotDir;

  const tileBody = (tile: AppTile) => (
    <>
      <h4 className="tile__title">
        <FeatureIcon name={ tile.icon } />
        { tile.title }
      </h4>
      <p className="tile__body">{ joinDots(tile.body) }</p>
      <p className="tile__meta">{ tile.meta }</p>
    </>
  );

  return (
    <>
      <a className="skip-link" href="#main">{ SITE.skipLink }</a>
      <SiteHeader anchors={ YEOUN.nav } onActsClick={ tear.onActsClick } />
      <main id="main">
        <section className="tear" id="tour" data-testid="tear" data-mode={ tear.mode } ref={ tear.sectionRef }>
          <div className="tear__stage" ref={ tear.stageRef }>
            <div className="tear__ticket">
              <div className="ticket__enter appear appear--rise" style={ { ...vars({ '--d': '.05s' }), animationDuration: '1s' } }>
                <Ticket
                  orientation={ isPhone ? 'v' : 'h' }
                  className={ `ticket--hero ticket--draw${tear.dropClass ? ` ${tear.dropClass}` : ''}` }
                  ticketRef={ tear.ticketRef }
                  stubRef={ tear.stubRef }
                  poster={ <PosterArt compact={ isPhone } /> }
                  body={ (
                    <div className="hero-copy" ref={ tear.heroCopyRef }>
                      <p className="hero__eyebrow appear appear--soft" style={ vars({ '--d': '.25s' }) }>{ YEOUN.eyebrow }</p>
                      <h1 className="hero__title display">
                        <MaskLines lines={ toLines(YEOUN.catchphrase) } delays={ [ '.35s', '.47s' ] } />
                      </h1>
                      <p className="hero__lede appear appear--soft" style={ { ...vars({ '--d': '.6s' }), animationDuration: '1s' } }>
                        { joinDots(YEOUN.heroLede) }
                      </p>
                      <div className="hero__cta appear appear--btn" style={ vars({ '--d': '.72s' }) }>
                        <PlayStoreButton href={ YEOUN.playStoreUrl } height={ isPhone ? 44 : 48 } eager />
                        <a className="hero__more" href="#acts" onClick={ tear.onActsClick }>
                          { YEOUN.heroMore }
                          <ArrowDownIcon />
                        </a>
                      </div>
                    </div>
                  ) }
                  stub={ (
                    <div className="hero-stub" aria-hidden="true" data-testid="hero-stub">
                      <p className="stub appear appear--fade" style={ { ...vars({ '--d': '.8s' }), animationDuration: '.6s' } }>
                        <StubLines stub={ YEOUN.heroStub } />
                      </p>
                    </div>
                  ) }
                />
              </div>
            </div>

            <p className="tear__hint" aria-hidden="true" data-testid="tear-hint">
              <span className="tear__hint-inner appear appear--fade" style={ { ...vars({ '--d': '1s' }), animationDuration: '.6s' } }>
                <ChevronDownIcon className="tear__hint-chevron" />
              </span>
            </p>

            <div className="acts" id="acts">
              <div className="acts__inner container">
                <div className="acts__head">
                  <p className="acts__eyebrow" { ...actReveal() }>{ YEOUN.actsEyebrow }</p>
                  <h2 className={ `acts__title display${stacked ? '' : ' sr-only'}` } { ...actReveal({ '--y': '40px' }) }>
                    { YEOUN.actsHeading }
                  </h2>
                </div>

                { acts.map((act, i) => (
                  <article key={ act.id } className={ `act act--${i + 1}` } aria-labelledby={ `act-${act.id}` }>
                    <div className="act__copy">
                      <p className="act__label" { ...actReveal() }>{ act.label }</p>
                      <h3
                        id={ `act-${act.id}` }
                        className="act__title display"
                        tabIndex={ i === 0 ? -1 : undefined }
                        { ...actRevealLines }
                      >
                        <MaskLines lines={ act.titleLines } />
                      </h3>
                      <p className="act__body" { ...actReveal() }>{ joinDots(act.body) }</p>
                      <ul className="act__points" { ...actReveal() }>
                        { act.points.map((point) => <li key={ point }>{ joinDots(point) }</li>) }
                      </ul>
                      <div className="act__bars" aria-hidden="true">
                        { acts.map((other, b) => (
                          <span key={ other.id } className={ `act__bar${b === i ? ' is-current' : ''}` } />
                        )) }
                      </div>
                    </div>
                    <div className="act__phone-wrap" { ...actReveal({ '--y': '60px', '--dur': '.9s' }) }>
                      <div className="act__phone">
                        <PhoneScreenshot dir={ dir } screenshot={ act.screenshot } />
                      </div>
                    </div>
                    { /* The stub's scene state ([data-scene], [data-day]) lives on this wrapper: useTearStage. */ }
                    <div
                      className={ `act__stubs${act.scene ? ` act__stubs--${act.scene.kind}` : ''}` }
                      aria-hidden="true"
                      data-testid={ `act-stubs-${act.id}` }
                      data-from={ act.scene?.kind === 'countdown' ? act.scene.from : undefined }
                    >
                      <div className="act__stub">
                        <p className="stub">
                          <StubLines
                            stub={ act.stub }
                            countdown={ act.scene?.kind === 'countdown' ? countdownLabels(act.scene.from, YEOUN.heroStub.badge ?? '') : undefined }
                            flipFrom={ act.scene?.kind === 'rating' ? YEOUN.heroStub.badge : undefined }
                          />
                        </p>
                      </div>
                    </div>
                  </article>
                )) }
              </div>
            </div>
          </div>
        </section>

        <section className="archive section-pad" id="archive" aria-labelledby="archive-title">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow" data-reveal="">{ archive.eyebrow }</p>
              <h2 className="h2 display" id="archive-title" data-reveal-lines="">
                <MaskLines lines={ archive.titleLines } />
              </h2>
              <p className="lede archive__lede" data-reveal="" style={ vars({ '--rd': '100ms' }) }>{ archive.lede }</p>
            </div>
            { archive.groups.map((group) => (
              <div className="tile-group" key={ group.label }>
                <h3 className="tile-group__label">{ group.label }</h3>
                { isPhone ? (
                  <ul className="tile-cards">
                    { group.tiles.map((tile, i) => (
                      <li key={ tile.title } className="tile" data-reveal="" style={ vars({ '--rd': `${i * 100}ms`, '--y': '20px' }) }>
                        <Ticket
                          orientation="h"
                          className="ticket--tile"
                          poster={ <PhoneScreenshot dir={ dir } screenshot={ tile.screenshot } variant="poster" /> }
                          body={ tileBody(tile) }
                        />
                      </li>
                    )) }
                  </ul>
                ) : (
                  <ul className="tiles">
                    { group.tiles.map((tile, i) => (
                      <li key={ tile.title } className="tile" data-reveal="" style={ vars({ '--rd': `${i * 100}ms`, '--y': '20px' }) }>
                        <div className="tile__poster">
                          <PhoneScreenshot dir={ dir } screenshot={ tile.screenshot } variant="poster" />
                        </div>
                        { tileBody(tile) }
                      </li>
                    )) }
                  </ul>
                ) }
              </div>
            )) }
            <div className="tile-group">
              <h3 className="tile-group__label" id="archive-more">{ archive.more.label }</h3>
              <ul className="feature-list" aria-labelledby="archive-more">
                { archive.more.items.map((item, i) => (
                  <li key={ item.title } className="feature-list__item" data-reveal="" style={ vars({ '--rd': `${(i % 3) * 80}ms`, '--y': '16px' }) }>
                    <h4 className="feature-list__title">
                      <FeatureIcon name={ item.icon } />
                      { item.title }
                    </h4>
                    <p className="feature-list__detail">{ joinDots(item.detail) }</p>
                  </li>
                )) }
              </ul>
            </div>
          </div>
        </section>

        <section className="notice section-pad" id="notice" aria-labelledby="notice-title">
          <div className="container">
            <div className="notice__card">
              <div className="notice__head">
                <h2 className="notice__title" id="notice-title">{ YEOUN.noticeTitle }</h2>
              </div>
              <div className="notice__cols">
                <div className="notice__col" data-reveal="">
                  <h3 className="notice__col-title">{ YEOUN.recommendedTitle }</h3>
                  <ol className="notice__list">
                    { YEOUN.recommendedFor.map((item) => <li key={ item }>{ joinDots(item) }</li>) }
                  </ol>
                </div>
                <div className="notice__col" data-reveal="" style={ vars({ '--rd': '150ms' }) }>
                  <h3 className="notice__col-title">{ YEOUN.notesTitle }</h3>
                  <ol className="notice__list">
                    { YEOUN.notes.map((note) => <li key={ note }>{ joinDots(note) }</li>) }
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="closing section-pad" id="closing" aria-labelledby="closing-title">
          <div className="container closing__inner">
            <Ticket
              orientation={ isPhone ? 'v' : 'h' }
              className="ticket--closing"
              body={ (
                <>
                  <p className="eyebrow closing__eyebrow">{ closing.eyebrow }</p>
                  <h2 className="h2 display" id="closing-title" data-reveal-lines="">
                    <MaskLines lines={ closing.titleLines } />
                  </h2>
                  <p className="lede closing__sub">{ joinDots(closing.sub) }</p>
                  <PlayStoreButton href={ YEOUN.playStoreUrl } height={ 48 } className="closing__badge" />
                </>
              ) }
              stub={ (
                <p className="closing-stub" aria-hidden="true">
                  <span className="closing-stub__name display">{ YEOUN.closingStub.value }</span>
                  <span className="micro">{ YEOUN.closingStub.sub }</span>
                </p>
              ) }
            />
          </div>
        </section>
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}

export default Yeoun;
