import React, {useMemo, useState, type ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import CodeBlock from '@theme-original/CodeBlock';
import type CodeBlockType from '@theme/CodeBlock';
import type {WrapperProps} from '@docusaurus/types';
import {
  SingleLineContext,
  hasLineContinuation,
  isSingleLinePage,
  toSingleLine,
} from '@site/src/components/CodeBlockSingleLine';

type Props = WrapperProps<typeof CodeBlockType>;

export default function CodeBlockWrapper(props: Props): ReactNode {
  const {pathname} = useLocation();
  const [enabled, setEnabled] = useState(false);

  const code = typeof props.children === 'string' ? props.children : null;
  const available =
    code !== null && isSingleLinePage(pathname) && hasLineContinuation(code);

  const value = useMemo(
    () => ({available, enabled, toggle: () => setEnabled((v) => !v)}),
    [available, enabled],
  );

  const children = available && enabled ? toSingleLine(code!) : props.children;

  return (
    <SingleLineContext.Provider value={value}>
      <CodeBlock {...props}>{children}</CodeBlock>
    </SingleLineContext.Provider>
  );
}
