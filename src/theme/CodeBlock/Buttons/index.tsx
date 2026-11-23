import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useLocation} from '@docusaurus/router';
import {translate} from '@docusaurus/Translate';
import {useCodeBlockContext} from '@docusaurus/theme-common/internal';
import CopyButton from '@theme/CodeBlock/Buttons/CopyButton';
import WordWrapButton from '@theme/CodeBlock/Buttons/WordWrapButton';
import Button from '@theme/CodeBlock/Buttons/Button';
import IconWordWrap from '@theme/Icon/WordWrap';
import type {Props} from '@theme/CodeBlock/Buttons';
import {
  isSingleLinePage,
  useSingleLine,
} from '@site/src/components/CodeBlockSingleLine';

import styles from './styles.module.css';

/** Word wrap toggle that is always visible (stock one hides unless scrollable). */
function AlwaysVisibleWordWrapButton(): ReactNode {
  const {wordWrap} = useCodeBlockContext();
  const title = translate({
    id: 'theme.CodeBlock.wordWrapToggle',
    message: 'Toggle word wrap',
    description:
      'The title attribute for toggle word wrapping button of code block lines',
  });
  return (
    <Button
      onClick={() => wordWrap.toggle()}
      className={clsx(wordWrap.isEnabled && styles.activeButton)}
      aria-label={title}
      title={title}>
      <IconWordWrap className={styles.icon} aria-hidden="true" />
    </Button>
  );
}

/** Switches `\`-continued commands between multi-line and single-line. */
function SingleLineButton(): ReactNode {
  const singleLine = useSingleLine();
  const {pathname} = useLocation();
  if (!singleLine || !singleLine.available) {
    return null;
  }
  const isEn = /^\/en(\/|$)/.test(pathname);
  const title = singleLine.enabled
    ? isEn
      ? 'Show multi-line (split with \\)'
      : 'Çok satırlı göster (\\ ile bölünmüş)'
    : isEn
      ? 'Convert to single line (remove \\)'
      : 'Tek satıra çevir (\\ kaldır)';
  return (
    <Button
      onClick={singleLine.toggle}
      className={clsx(singleLine.enabled && styles.activeButton)}
      aria-label={title}
      title={title}
      aria-pressed={singleLine.enabled}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true">
        {/* three lines collapsing into one */}
        <path d="M4 12h16" />
        <path d="M16 8l4 4-4 4" />
        <path d="M4 7h6" opacity="0.5" />
        <path d="M4 17h6" opacity="0.5" />
      </svg>
    </Button>
  );
}

function ButtonGroup({className}: Props): ReactNode {
  const {pathname} = useLocation();
  const customPage = isSingleLinePage(pathname);
  return (
    <div className={clsx(className, styles.buttonGroup)}>
      {customPage && <SingleLineButton />}
      {customPage ? <AlwaysVisibleWordWrapButton /> : <WordWrapButton />}
      <CopyButton />
    </div>
  );
}

// Code block buttons are not server-rendered on purpose
// (same behaviour as the stock Docusaurus component).
export default function CodeBlockButtons({className}: Props): ReactNode {
  return <BrowserOnly>{() => <ButtonGroup className={className} />}</BrowserOnly>;
}
