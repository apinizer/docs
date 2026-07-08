import React from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import {icons as lucideIcons} from 'lucide-react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  href?: string;
  horizontal?: boolean;
  children?: React.ReactNode;
}

/**
 * Mintlify allowed `icon` to be either a Lucide name string ("shield"), a
 * FontAwesome name ("wand-magic-sparkles"), or a React node. We render
 * Lucide names directly; FontAwesome-only names get a best-effort fallback
 * to a similar Lucide icon (see `FA_TO_LUCIDE`), and anything we can't map
 * is dropped silently so the card body still reads cleanly.
 */
const FA_TO_LUCIDE: Record<string, string> = {
  'wand-magic-sparkles': 'Sparkles',
  'chart-line': 'LineChart',
  'chart-bar': 'ChartBar',
  'chart-pie': 'ChartPie',
  'chart-column': 'ChartColumn',
  'sliders': 'SlidersHorizontal',
  'envelope': 'Mail',
  'layer-group': 'Layers',
  'file-lines': 'FileText',
  'network-wired': 'Network',
  'square-poll-vertical': 'ChartBar',
  'diagram-project': 'GitFork',
  'magnifying-glass': 'Search',
  'circle-info': 'Info',
  'circle-check': 'CheckCircle',
  'circle-xmark': 'XCircle',
  'triangle-exclamation': 'AlertTriangle',
  'gear': 'Settings',
  'gears': 'Settings2',
  'screwdriver-wrench': 'Wrench',
  'arrow-right-arrow-left': 'ArrowLeftRight',
  'arrows-rotate': 'RefreshCw',
  'plus-circle': 'PlusCircle',
  'circle-plus': 'PlusCircle',
  'user-shield': 'ShieldCheck',
  'user-gear': 'UserCog',
  'user-plus': 'UserPlus',
  'users-gear': 'UsersRound',
  'building-shield': 'ShieldCheck',
  'book-open': 'BookOpen',
  'bolt': 'Zap',
  'circle-question': 'HelpCircle',
};

function kebabToPascal(name: string): string {
  return name
    .split(/[-_]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join('');
}

function resolveIcon(name: string): React.ComponentType<{size?: number; strokeWidth?: number}> | null {
  // Direct kebab → PascalCase Lucide name.
  const pascal = kebabToPascal(name);
  if (pascal in lucideIcons) {
    return (lucideIcons as Record<string, React.ComponentType<{size?: number; strokeWidth?: number}>>)[pascal];
  }
  // FontAwesome alias map.
  const mapped = FA_TO_LUCIDE[name.toLowerCase()];
  if (mapped && mapped in lucideIcons) {
    return (lucideIcons as Record<string, React.ComponentType<{size?: number; strokeWidth?: number}>>)[mapped];
  }
  return null;
}

function renderIcon(icon: React.ReactNode): React.ReactNode {
  if (typeof icon !== 'string') return icon;
  const IconComp = resolveIcon(icon);
  if (!IconComp) return null;
  return <IconComp size={20} strokeWidth={1.75} />;
}

export function Card({title, icon, href, horizontal, children}: CardProps) {
  const renderedIcon = renderIcon(icon);
  const inner = (
    <>
      {(renderedIcon || title) && (
        <div className={clsx('apz-card__title', horizontal && 'apz-card__title--horizontal')}>
          {renderedIcon ? <span className="apz-card__icon">{renderedIcon}</span> : null}
          {title ? <span>{title}</span> : null}
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
