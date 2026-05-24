import React from 'react';

interface AccordionProps {
  title?: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({title, children, defaultOpen = false}: AccordionProps) {
  return (
    <details open={defaultOpen} className="apz-accordion">
      {title && <summary>{title}</summary>}
      <div className="apz-accordion__body">{children}</div>
    </details>
  );
}

export function AccordionGroup({children}: {children: React.ReactNode}) {
  return <div className="apz-accordion-group">{children}</div>;
}

export default Accordion;
