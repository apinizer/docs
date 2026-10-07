import React from 'react';
import {processAdmonitionProps} from '@docusaurus/theme-common';
import {useLocation} from '@docusaurus/router';
import AdmonitionTypes from '@theme/Admonition/Types';
import type {Props} from '@theme/Admonition';

const EN_LABELS: Record<string, string> = {
  info: 'Info',
  tip: 'Tip',
  note: 'Note',
  warning: 'Warning',
  danger: 'Danger',
  caution: 'Caution',
};

function useEnglishAdmonitionLabels(): boolean {
  const {pathname} = useLocation();
  return pathname.startsWith('/en/') || pathname.startsWith('/api-reference/');
}

function getAdmonitionTypeComponent(type: string) {
  const component = AdmonitionTypes[type as keyof typeof AdmonitionTypes];
  if (component) {
    return component;
  }
  console.warn(
    `No admonition component found for admonition type "${type}". Using Info as fallback.`,
  );
  return AdmonitionTypes.info;
}

export default function Admonition(unprocessedProps: Props) {
  let props = processAdmonitionProps(unprocessedProps);
  const englishLabels = useEnglishAdmonitionLabels();

  if (englishLabels && !props.title) {
    props = {
      ...props,
      title: EN_LABELS[props.type] ?? EN_LABELS.info,
    };
  }

  const AdmonitionTypeComponent = getAdmonitionTypeComponent(props.type);
  return <AdmonitionTypeComponent {...props} />;
}
