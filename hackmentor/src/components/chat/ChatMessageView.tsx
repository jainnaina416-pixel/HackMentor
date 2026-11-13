import React, { useState } from "react";
import type { SourceCitation } from "../../types";

interface ChatMessageViewProps {
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  isStreaming?: boolean;
}

/**
 * Parses raw text to strip any unwanted internal metadata, JSON stringification,
 * or leaked system tokens, returning only the final natural-language assistant response.
 */
export function sanitizeChatContent(raw: unknown): string {
  if (raw == null) return "";
  let text = typeof raw === "string" ? raw : String(raw);

  // If it's a JSON block, extract the actual natural language message
  const trimmed = text.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null) {
        if (typeof parsed.message === "string") text = parsed.message;
        else if (typeof parsed.response === "string") text = parsed.response;
        else if (typeof parsed.content === "string") text = parsed.content;
        else if (typeof parsed.text === "string") text = parsed.text;
        else if (typeof parsed.answer === "string") text = parsed.answer;
      }
    } catch {
      // not JSON, keep text
    }
  }

  // Strip any leaked raw JSON citations payload at the tail of streaming
  text = text.replace(/\{"sources":\s*\[.*\](?:,\s*"conversation_id":\s*"[^"]*")?\}/g, "");
  // Strip raw SSE data tags if any leaked
  text = text.replace(/^data:\s*/gm, "");
  // Strip any internal conversation IDs or source IDs leaking in brackets
  text = text.replace(/\[(?:doc_[a-zA-Z0-9_-]+|conv_[a-zA-Z0-9_-]+|src_[a-zA-Z0-9_-]+)\]/g, "");

  return text.trim();
}

/**
 * Lightweight, zero-dependency Markdown renderer supporting:
 * - Code blocks (```lang ... ```)
 * - Tables (| Header | Header |)
 * - Headings (###, ##, #)
 * - Unordered lists (*, -)
 * - Ordered lists (1., 2.)
 * - Inline formatting (bold, italic, inline code, links)
 */
export function MarkdownRenderer({ content }: { content: string }) {
  const sanitized = sanitizeChatContent(content);
  if (!sanitized) return null;

  // Split on triple backtick code blocks first
  const parts = sanitized.split(/(```[\s\S]*?```)/g);

  return (
    <div className="chat-markdown">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const firstLineEnd = part.indexOf("\n");
          let code = "";
          let lang = "";
          if (firstLineEnd !== -1) {
            lang = part.slice(3, firstLineEnd).trim();
            code = part.slice(firstLineEnd + 1, -3);
          } else {
            code = part.slice(3, -3);
          }
          return (
            <div key={index} className="chat-code-block">
              {lang && <div className="chat-code-lang">{lang}</div>}
              <pre>
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Process standard markdown blocks (tables, headings, paragraphs, lists)
        return <MarkdownBlocks key={index} text={part} />;
      })}
    </div>
  );
}

function MarkdownBlocks({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Markdown Table check
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      elements.push(renderTable(tableLines, elements.length));
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(<h4 key={elements.length} className="chat-h4">{renderInline(line.slice(4))}</h4>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h3 key={elements.length} className="chat-h3">{renderInline(line.slice(3))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<h2 key={elements.length} className="chat-h2">{renderInline(line.slice(2))}</h2>);
      i++;
      continue;
    }

    // Unordered List
    if (/^(\*|-)\s+/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^(\*|-)\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^(\*|-)\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={elements.length} className="chat-ul">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={elements.length} className="chat-ol">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Standard Paragraph
    elements.push(
      <p key={elements.length} className="chat-p">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

function renderTable(tableLines: string[], key: number): React.ReactNode {
  if (tableLines.length < 2) return null;
  const parseRow = (rowStr: string) =>
    rowStr
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

  const headerCells = parseRow(tableLines[0]);
  // line 1 is typically |---|---| separator
  const dataRows = tableLines.slice(2).map(parseRow);

  return (
    <div key={key} className="chat-table-wrapper">
      <table className="chat-table">
        <thead>
          <tr>
            {headerCells.map((h, idx) => (
              <th key={idx}>{renderInline(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td key={cIdx}>{renderInline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(str: string): React.ReactNode {
  // Parse inline elements: `code`, **bold**, *italic*, [link](url)
  // Split on markdown inline tags
  const tokens = str.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);

  return tokens.map((tok, idx) => {
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return (
        <code key={idx} className="chat-inline-code">
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return <strong key={idx}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith("*") && tok.endsWith("*")) {
      return <em key={idx}>{tok.slice(1, -1)}</em>;
    }
    const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, text, url] = linkMatch;
      return (
        <a
          key={idx}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-link"
        >
          {text}
        </a>
      );
    }
    return tok;
  });
}

/**
 * Separate component for rendering human-readable, clean citations.
 * Never displays internal document IDs, source_id, or embedding metadata.
 */
export function CitationsList({ sources }: { sources: SourceCitation[] }) {
  const [open, setOpen] = useState(false);

  // Filter out any invalid items
  const validSources = (sources || []).filter(
    (s) => s && typeof s === "object" && (s.title || s.excerpt || s.url)
  );

  if (!validSources.length) return null;

  return (
    <div className="chat-citations">
      <button
        type="button"
        className="chat-citations-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="chat-citations-icon">📚</span>
        <span>
          {validSources.length} Referenced {validSources.length === 1 ? "Source" : "Sources"}
        </span>
        <span className="chat-citations-arrow">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="chat-citations-content">
          {validSources.map((source, index) => {
            const title = source.title || "Hackathon Reference";
            return (
              <div key={index} className="chat-citation-item">
                <div className="chat-citation-header">
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chat-citation-title chat-citation-link"
                    >
                      {title} ↗
                    </a>
                  ) : (
                    <span className="chat-citation-title">{title}</span>
                  )}
                  {typeof source.relevance === "number" && (
                    <span className="chat-citation-badge">
                      {Math.round(source.relevance * 100)}% match
                    </span>
                  )}
                </div>
                {source.excerpt && (
                  <div className="chat-citation-excerpt">
                    "{source.excerpt.replace(/\s+/g, " ").trim()}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Main Message Component that keeps answers and citations cleanly separated.
 */
export function ChatMessageView({ role, content, sources, isStreaming }: ChatMessageViewProps) {
  return (
    <div className={`chat-message-container ${role}`}>
      <div className={`bubble ${role}`}>
        <MarkdownRenderer content={content} />
        {isStreaming && <span className="chat-cursor" />}
      </div>
      {role === "assistant" && sources && sources.length > 0 && (
        <CitationsList sources={sources} />
      )}
    </div>
  );
}
