import React from "react";
import { useRouteError } from "react-router-dom";

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  { err: null | string }
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(error: any) {
    return { err: error.toString() };
  }

  componentDidCatch(error: any, info: any) {
    localStorage.removeItem("queue");
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
  localStorage.removeItem("queue");
  return <div>ERROR {err?.toString?.()}</div>;
}
