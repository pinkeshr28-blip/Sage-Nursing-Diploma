import type { Database } from "@/lib/database.types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function NotificationList({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: Notification[];
}) {
  return (
    <>
      <div className="card">
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>
      <div className="card">
        {items.length === 0 && <p className="muted">No notifications yet.</p>}
        {items.map((f) => (
          <div className="feed-item" key={f.id}>
            <span
              className={`pill ${
                f.kind === "sage" ? "pill-sage" : f.kind === "coral" ? "pill-coral" : "pill-gold"
              }`}
              style={{ minWidth: 8, padding: 4 }}
            >
              &nbsp;
            </span>
            <div style={{ flex: 1 }}>
              <div>
                <strong>{f.subject}</strong>
              </div>
              <div className="feed-meta">
                From {f.from_email} → To {f.to_email} ·{" "}
                {new Date(f.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div style={{ marginTop: 2 }}>{f.body}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
