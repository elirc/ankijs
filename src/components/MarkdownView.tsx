import { Children, isValidElement, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/cn";
function codeText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) =>
      typeof child === "string"
        ? child
        : isValidElement<{ children?: ReactNode }>(child)
          ? codeText(child.props.children)
          : "",
    )
    .join("");
}
export function highlightCode(text: string) {
  const pieces = text.split(
    /(\/\/[^\n]*|#[^\n]*|--[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:const|let|var|function|return|if|else|await|async|throw|new|class|public|private|using|SELECT|FROM|WHERE|UPDATE|INSERT|INTO|SET|CREATE|TABLE|BEGIN|COMMIT|ROLLBACK|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g,
  );
  return pieces.map((part, i) =>
    i % 2 ? (
      <span
        key={i}
        className={
          /^(\/\/|#|--)/.test(part)
            ? "code-comment"
            : /^['"]/.test(part)
              ? "code-string"
              : /^\d/.test(part)
                ? "code-number"
                : "code-keyword"
        }
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}
function CodeBlock({ children }: { children?: ReactNode }) {
  const text = codeText(children);
  const [message, setMessage] = useState("");
  return (
    <div className="code-block">
      <button
        type="button"
        className="copy-code"
        onClick={() => {
          if (!navigator.clipboard) {
            setMessage("Select the code to copy it.");
            return;
          }
          void navigator.clipboard.writeText(text).then(
            () => setMessage("Copied"),
            () => setMessage("Copy unavailable. Select the code instead."),
          );
        }}
      >
        Copy code
      </button>
      {message && <span role="status">{message}</span>}
      <pre>
        <code>{highlightCode(text)}</code>
      </pre>
    </div>
  );
}
export function MarkdownView({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <div className={cn("markdown max-w-none text-text", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
        }}
      >
        {source || " "}
      </ReactMarkdown>
    </div>
  );
}
