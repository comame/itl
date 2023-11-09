import React from "react";
import { useRouteError } from "react-router-dom";
import { clearPreference } from "../lib/preference";

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<Record<never, never>>,
  { err: null | string }
> {
  constructor(props: React.PropsWithChildren<Record<never, never>>) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(error: any) {
    return { err: error.toString() };
  }

  componentDidCatch(error: any, info: any) {
    clearPreference();
    console.error(error, info);
  }

  render() {
    if (this.state.err !== null) {
      return <div>ERROR! {this.state.err}</div>;
    }
    return <>{this.props.children}</>;
  }
}

export function RouterErrorBoundary() {
  const err = useRouteError();
  clearPreference();
  return <div>ERROR {err?.toString?.()}</div>;
}
