import React from 'react';

interface StepProps {
  title?: string;
  children?: React.ReactNode;
}

export function Step({title, children}: StepProps) {
  return (
    <div className="apz-step">
      {title && <div className="apz-step__title">{title}</div>}
      <div className="apz-step__body">{children}</div>
    </div>
  );
}

interface StepsProps {
  children: React.ReactNode;
}

export function Steps({children}: StepsProps) {
  return <div className="apz-steps">{children}</div>;
}

export default Steps;
