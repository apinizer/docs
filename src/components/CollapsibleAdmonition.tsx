import React from 'react';
import clsx from 'clsx';
import {Details as DetailsGeneric} from '@docusaurus/theme-common/Details';
import {ThemeClassNames} from '@docusaurus/theme-common';
import WarningIcon from '@theme/Admonition/Icon/Warning';
import DangerIcon from '@theme/Admonition/Icon/Danger';
import InfoIcon from '@theme/Admonition/Icon/Info';
import styles from './CollapsibleAdmonition.module.css';

type AdmonitionType = 'warning' | 'danger' | 'info';

interface CollapsibleAdmonitionProps {
  type?: AdmonitionType;
  /** Bold heading shown on the collapsed box. */
  title: string;
  /** One-line description of what it is and when it applies. */
  summary?: string;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

const ICONS = {
  warning: WarningIcon,
  danger: DangerIcon,
  info: InfoIcon,
};

/**
 * An admonition (warning / danger / info) that looks like the regular
 * `:::warning` box but is collapsed by default and expands on click.
 */
export function CollapsibleAdmonition({
  type = 'warning',
  title,
  summary,
  defaultOpen = false,
  children,
}: CollapsibleAdmonitionProps) {
  const Icon = ICONS[type];
  return (
    <DetailsGeneric
      open={defaultOpen}
      className={clsx(
        'alert',
        `alert--${type}`,
        ThemeClassNames.common.admonition,
        ThemeClassNames.common.admonitionType(type),
        styles.box,
      )}
      summary={
        <summary className={styles.summary}>
          <span className={styles.icon}>
            <Icon />
          </span>
          <span className={styles.text}>
            <span className={styles.title}>{title}</span>
            {summary && <span className={styles.description}>{summary}</span>}
          </span>
        </summary>
      }>
      <div className={styles.content}>{children}</div>
    </DetailsGeneric>
  );
}

export default CollapsibleAdmonition;
