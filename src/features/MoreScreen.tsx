import { Link } from "react-router-dom";
export function MoreScreen() {
  return (
    <section className="space-y-6">
      <h1>More</h1>
      <nav className="more-grid" aria-label="More tools">
        {[
          ["/workshop", "Guided workshop"],
          ["/practice", "Engineering practice"],
          ["/paths", "Learning paths"],
          ["/library", "Find cards"],
          ["/capture", "Capture a note"],
          ["/inbox", "Inbox"],
          ["/dotnet", "C# & .NET"],
          ["/settings", "Settings and backups"],
        ].map(([to, label]) => (
          <Link className="content-panel" key={to} to={to}>
            {label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
