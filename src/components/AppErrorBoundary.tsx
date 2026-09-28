import { Component, type ReactNode } from "react";
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <section className="empty-panel" role="alert">
        <h1>This screen could not load</h1>
        <p>
          Your saved cards and progress remain on this device. Reload to try
          again; an offline update may need a connection.
        </p>
        <button
          className="practice-primary-link"
          onClick={() => window.location.reload()}
        >
          Reload Recall
        </button>
        <a href="/">Back to Today</a>
      </section>
    ) : (
      this.props.children
    );
  }
}
