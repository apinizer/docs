import React from 'react';

interface FrameProps {
  caption?: string;
  children?: React.ReactNode;
}

export function Frame({caption, children}: FrameProps) {
  return (
    <figure className="apz-frame">
      {children}
      {caption && <figcaption className="apz-frame__caption">{caption}</figcaption>}
    </figure>
  );
}

export default Frame;
