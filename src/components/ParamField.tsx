import React from 'react';

/**
 * Minimal Mintlify ParamField/ResponseField stubs.
 *
 * The original ~30 occurrences should eventually be migrated to proper
 * markdown tables (see TODO markers in those files), but until then these
 * stubs let the build succeed and render something readable.
 */
interface FieldProps {
  path?: string;
  query?: string;
  body?: string;
  header?: string;
  name?: string;
  type?: string;
  required?: boolean;
  default?: string;
  children?: React.ReactNode;
}

function FieldRow({label, value}: {label: string; value: React.ReactNode}) {
  if (!value && value !== false) return null;
  return (
    <div style={{display: 'flex', gap: '0.5rem'}}>
      <strong style={{minWidth: '6rem'}}>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

function FieldShell(props: FieldProps & {label: string}) {
  const name = props.path || props.query || props.body || props.header || props.name || '';
  return (
    <div
      style={{
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: 6,
        padding: '0.6rem 0.9rem',
        margin: '0.4rem 0',
      }}
    >
      <div style={{fontWeight: 600, marginBottom: '0.3rem'}}>
        <code>{name}</code>
        {props.type ? <span style={{marginLeft: '0.5rem', color: 'var(--ifm-color-emphasis-700)'}}>({props.type})</span> : null}
        {props.required ? <span style={{marginLeft: '0.5rem', color: 'var(--ifm-color-danger)', fontSize: '0.85rem'}}>required</span> : null}
      </div>
      <FieldRow label="Default" value={props.default} />
      {props.children ? <div style={{marginTop: '0.3rem'}}>{props.children}</div> : null}
    </div>
  );
}

export function ParamField(props: FieldProps) {
  return <FieldShell {...props} label="param" />;
}

export function ResponseField(props: FieldProps) {
  return <FieldShell {...props} label="response" />;
}

export default ParamField;
