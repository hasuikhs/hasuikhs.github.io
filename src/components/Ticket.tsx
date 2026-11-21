import type { ReactNode, Ref } from 'react';

type TicketProps = {
  orientation: 'h' | 'v';
  poster?: ReactNode;
  body: ReactNode;
  // Without a stub the ticket is a whole card (no perforation, no punch holes).
  stub?: ReactNode;
  className?: string;
  bodyClassName?: string;
  ticketRef?: Ref<HTMLDivElement>;
  stubRef?: Ref<HTMLDivElement>;
};

// The app's ticket card at page scale: poster | body | perforation | stub.
function Ticket({
  orientation,
  poster,
  body,
  stub,
  className,
  bodyClassName,
  ticketRef,
  stubRef,
}: TicketProps) {
  const classes = [
    'ticket',
    orientation === 'v' ? 'ticket--v' : '',
    stub ? '' : 'ticket--solo',
    className ?? '',
  ].filter(Boolean).join(' ');

  return (
    <div className={ classes } ref={ ticketRef }>
      <div className="ticket__piece ticket__piece--main">
        <div className="ticket__face">
          { poster && <div className="ticket__poster">{ poster }</div> }
          <div className={ `ticket__body${bodyClassName ? ` ${bodyClassName}` : ''}` }>{ body }</div>
        </div>
      </div>
      { stub && (
        <div className="ticket__piece ticket__piece--stub" ref={ stubRef }>
          <div className="ticket__face">
            <span className="ticket__perf" aria-hidden="true" />
            { stub }
          </div>
        </div>
      ) }
    </div>
  );
}

export default Ticket;
