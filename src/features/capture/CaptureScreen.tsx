import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { readDraft, storeDraft } from "../../lib/drafts";
import { Save } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { TextArea } from "../../components/TextArea";
import { captureNote, listInbox } from "../../db/repos/noteRepo";

export function CaptureScreen() {
  const [searchParams] = useSearchParams();
  const sharedText = useMemo(() => {
    return ["title", "text", "url"]
      .map((key) => searchParams.get(key)?.trim())
      .filter(Boolean)
      .join("\n");
  }, [searchParams]);
  const [body, setBody] = useState(() => sharedText || readDraft("capture"));
  const [toast, setToast] = useState<string | null>(null);
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const inboxCount = useLiveQuery(
    async () => (await listInbox()).length,
    [],
    0,
  );

  useEffect(() => {
    if (sharedText) setBody(sharedText);
    window.setTimeout(() => textRef.current?.focus(), 0);
  }, [sharedText]);

  async function save() {
    if (!body.trim() || busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    const snapshot = body;
    try {
      await captureNote(snapshot);
      setBody((current) => {
        if (current === snapshot) {
          storeDraft("capture", "");
          return "";
        }
        return current;
      });
      setToast("Saved to inbox");
      textRef.current?.focus();
    } catch {
      setError(
        "Could not save. Your draft is still here. Retry when storage is available.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Capture</h1>
        <p className="text-muted">{inboxCount} notes in inbox</p>
      </div>
      <TextArea
        ref={textRef}
        autoFocus
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          if (!storeDraft("capture", event.target.value))
            setError(
              "Draft recovery is unavailable. Keep this page open until you save.",
            );
        }}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void save();
          }
        }}
        className="min-h-[52dvh] rounded-2xl p-5 text-lg leading-relaxed shadow-sm"
        placeholder="Write the thought before it fades."
        aria-label="Capture note"
      />
      {error && <p role="alert">{error}</p>}
      <p className="text-muted">Drafts are kept on this device until saved.</p>
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          icon={Save}
          disabled={saving || !body.trim()}
          onClick={() => void save()}
        >
          Save
        </Button>
        {toast ? (
          <p className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {toast}
          </p>
        ) : (
          <p className="hidden text-sm text-muted md:block">
            Ctrl+Enter saves and keeps you writing
          </p>
        )}
      </div>
    </div>
  );
}
