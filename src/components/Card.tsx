import React from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  href?: string;
  children?: React.ReactNode;
}

export function Card({title, icon, href, children}: CardProps) {
  const inner = (
    <>
      {(icon || title) && (
        <div className="apz-card__title">
          {icon ? <span className="apz-card__icon">{icon}</span> : null}
          {title}
        </div>
      )}
      {children ? <div className="apz-card__body">{children}</div> : null}
    </>
  );
  if (href) {
    return (
      <Link to={href} className="apz-card">
        {inner}
      </Link>
    );
  }
  return <div className="apz-card">{inner}</div>;
}

interface CardGroupProps {
  cols?: number;
  children: React.ReactNode;
}

export function CardGroup({cols = 2, children}: CardGroupProps) {
  const n = Math.max(1, Math.min(4, cols));
  return <div className={clsx('apz-card-grid', `cols-${n}`)}>{children}</div>;
}

export default Card;
