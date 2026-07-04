import React from 'react';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  if (!content) return null;

  // Detect HTML content (native Tiptap format) versus raw legacy markdown text
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return (
      <div 
        className="prose-tiptap"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Fallback: Split by double/multiple newlines to identify block sections
  const blocks = content.split(/\n\n+/);

  return (
    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Headings
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-xl font-bold text-foreground mt-6 mb-3 border-b border-border/50 pb-2">
              {renderInline(trimmed.substring(2))}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-bold text-foreground mt-5 mb-2 border-b border-border/30 pb-1">
              {renderInline(trimmed.substring(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-semibold text-foreground mt-4 mb-2">
              {renderInline(trimmed.substring(4))}
            </h3>
          );
        }

        // 2. Fenced Code Blocks (```code```)
        if (trimmed.startsWith('```')) {
          const lines = trimmed.split('\n');
          const codeLines = lines.slice(1, lines[lines.length - 1] === '```' ? -1 : undefined);
          return (
            <pre key={idx} className="bg-card border border-border p-4 rounded-xl font-mono text-xs text-foreground overflow-x-auto my-3 shadow-inner">
              <code>{codeLines.join('\n')}</code>
            </pre>
          );
        }

        // 3. Blockquotes (>)
        if (trimmed.startsWith('> ')) {
          const cleanText = trimmed
            .split('\n')
            .map((line) => line.replace(/^>\s?/, ''))
            .join('\n');
          return (
            <blockquote key={idx} className="border-l-4 border-primary/50 bg-muted/20 pl-4 py-2.5 italic my-3 rounded-r-lg font-serif text-[15px] text-muted-foreground">
              {renderInline(cleanText)}
            </blockquote>
          );
        }

        // 4. Bullet & Number Lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split('\n');
          const isOrdered = /^\d+\.\s/.test(trimmed);
          const ListTag = isOrdered ? 'ol' : 'ul';

          return (
            <ListTag
              key={idx}
              className={
                isOrdered
                  ? 'list-decimal list-inside space-y-2 pl-2 my-3 text-sm'
                  : 'list-disc list-inside space-y-2 pl-2 my-3 text-sm'
              }
            >
              {items.map((item, itemIdx) => {
                const itemContent = item.replace(/^(-\s|\*\s|\d+\.\s)/, '');
                return <li key={itemIdx}>{renderInline(itemContent)}</li>;
              })}
            </ListTag>
          );
        }

        // Default Paragraph
        const lines = trimmed.split('\n');
        return (
          <p key={idx} className="my-2">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderInline(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses inline formatting tags: Bold (**), Italic (*), Inline Code (`), Links ([label](url))
 */
function renderInline(text: string) {
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    // Inline Code
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="bg-muted border border-border/60 px-1.5 py-0.5 rounded font-mono text-xs text-primary font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    // Bold
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Italic
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-foreground">
          {part.slice(1, -1)}
        </em>
      );
    }
    // Anchor Link
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline underline-offset-4 font-semibold inline-flex items-center gap-0.5"
        >
          {label}
        </a>
      );
    }
    return part;
  });
}
