import React, { useState, useCallback } from 'react';
import { Copy, Check, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-[#171a2b] hover:bg-[#1a1a2a] text-[#8a90ad] hover:text-[#d6dbf0] transition-all duration-200 opacity-0 group-hover/code:opacity-100 border border-[#2a2f45]"
      title="Kopieren"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Process inline: **bold**, *italic*, `code`, [link](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      nodes.push(<strong key={match.index} className="font-semibold text-white">{match[2]}</strong>);
    } else if (match[3]) {
      nodes.push(<em key={match.index}>{match[4]}</em>);
    } else if (match[5]) {
      nodes.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded-md bg-[#171a2b] text-[#c4b5fd] text-[0.88em] font-mono border border-[#2a2f45]">
          {match[6]}
        </code>
      );
    } else if (match[7]) {
      nodes.push(
        <a key={match.index} href={match[9]} className="text-astra-cyan hover:text-[#a5edff] underline underline-offset-2 transition-colors">
          {match[8]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length > 0 ? nodes : [text];
}

function renderTable(lines: string[]): React.ReactNode {
  const headerCells = lines[0].split('|').map((c) => c.trim()).filter(Boolean);
  const rows = lines.slice(2).filter((l) => l.trim()).map((line) =>
    line.split('|').map((c) => c.trim()).filter(Boolean)
  );

  return (
    <div className="overflow-x-auto my-5 rounded-xl border border-[#2a2f45]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#212131] bg-[#171a2b]">
            {headerCells.map((cell, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-[#d6dbf0] whitespace-nowrap">
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-[#212131] last:border-0 hover:bg-[#1a1a2a] transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-[#d6dbf0]">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      const code = codeLines.join('\n');
      elements.push(
        <div key={elements.length} className="group/code relative my-5">
          {lang && (
            <div className="absolute top-0 left-0 px-3 py-1 text-[0.7rem] font-mono text-zinc-500 uppercase tracking-wider">
              {lang}
            </div>
          )}
          <pre className={cn("rounded-xl bg-[#0f1220] border border-[#2a2f45] overflow-x-auto", lang ? "pt-8 pb-4 px-4" : "p-4") }>
            <code className="text-[0.85rem] leading-relaxed text-[#d6dbf0] font-mono">{code}</code>
          </pre>
          <CopyButton text={code} />
        </div>
      );
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].match(/^\|?\s*---/)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<React.Fragment key={elements.length}>{renderTable(tableLines)}</React.Fragment>);
      continue;
    }

    // Blockquote / callout
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      const quoteText = quoteLines.join(' ');
      const isWarning = quoteText.toLowerCase().includes('hinweis') || quoteText.toLowerCase().includes('achtung');
      const Icon = isWarning ? AlertTriangle : Info;
      const borderColor = isWarning ? 'border-l-amber-500/60' : 'border-l-[#4b46c8]/60';
      const iconColor = isWarning ? 'text-amber-400' : 'text-[#7de3ff]';
      elements.push(
        <div key={elements.length} className={cn("my-5 pl-4 py-3 pr-4 border-l-2 rounded-r-lg bg-[#131625] border border-[#2a2f45]", borderColor)}>
          <div className="flex gap-2.5 items-start">
            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", iconColor)} />
            <p className="text-[0.9rem] text-[#d6dbf0] leading-relaxed">{renderInline(quoteText)}</p>
          </div>
        </div>
      );
      continue;
    }

    // Unordered list
    if (line.match(/^- /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^- /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={elements.length} className="my-4 space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 text-[0.9rem] text-[#d6dbf0] leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-astra-purple shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={elements.length} className="my-4 space-y-2 counter-reset-item">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-3 text-[0.9rem] text-[#d6dbf0] leading-relaxed">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-astra-purple/15 text-[#b4adff] text-xs font-bold shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={elements.length} className="my-3 text-[0.9rem] text-zinc-300 leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className={cn("docs-content", className)}>{elements}</div>;
};
