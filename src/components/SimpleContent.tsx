import { Fragment } from "react";

interface SimpleContentProps {
  content: string;
  className?: string;
}

const SimpleContent = ({ content, className = "" }: SimpleContentProps) => (
  <div className={className}>
    {content.split("\n\n").filter(Boolean).map((block, index) => {
      const text = block.trim();
      if (text.startsWith("**") && text.endsWith("**")) {
        return <h3 key={index} className="mb-3 mt-6 text-xl font-bold text-primary first:mt-0">{text.replace(/\*\*/g, "")}</h3>;
      }
      if (text.split("\n").every((line) => /^- /.test(line))) {
        return <ul key={index} className="mb-4 list-disc space-y-1 pl-6">{text.split("\n").map((line) => <li key={line}>{line.slice(2)}</li>)}</ul>;
      }
      if (text.split("\n").every((line) => /^\d+\. /.test(line))) {
        return <ol key={index} className="mb-4 list-decimal space-y-1 pl-6">{text.split("\n").map((line) => <li key={line}>{line.replace(/^\d+\. /, "")}</li>)}</ol>;
      }
      return <p key={index} className="mb-4 last:mb-0">{text.split("\n").map((line, lineIndex) => <Fragment key={`${line}-${lineIndex}`}>{lineIndex > 0 && <br />}{line}</Fragment>)}</p>;
    })}
  </div>
);

export default SimpleContent;
