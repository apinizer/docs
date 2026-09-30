import React from 'react';
import {processAdmonitionProps} from '@docusaurus/theme-common';
import {useLocation} from '@docusaurus/router';
import AdmonitionTypes from '@theme/Admonition/Types';

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

export default function Admonition(unprocessedProps: Record<string, unknown>) {
  let props = processAdmonitionProps(unprocessedProps);
  const englishLabels = useEnglishAdmonitionLabels();

  if (englishLabels && !props.title) {
    props = {
      ...props,
      title: EN_LABELS[props.type as string] ?? EN_LABELS.info,
    };
  }

  const AdmonitionTypeComponent = getAdmonitionTypeComponent(props.type as string);
  return <AdmonitionTypeComponent {...props} />;
}
