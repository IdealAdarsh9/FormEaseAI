import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none 
      prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100
      prose-p:text-slate-800 dark:prose-p:text-slate-300
      prose-li:text-slate-800 dark:prose-li:text-slate-300
      prose-strong:text-slate-900 dark:prose-strong:text-white
      prose-a:text-green-700 dark:prose-a:text-green-400
      prose-table:border-collapse 
      prose-td:border prose-td:border-slate-300 dark:prose-td:border-slate-700
      prose-td:p-2 
      prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-700
      prose-th:bg-slate-100 dark:prose-th:bg-slate-800
      prose-th:p-2
      prose-th:text-slate-900 dark:prose-th:text-slate-200"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({node, ...props}) => <h1 className="text-2xl md:text-3xl mb-4 text-primary-800 dark:text-primary-400 border-b border-slate-200 dark:border-slate-700 pb-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl md:text-2xl mt-8 mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-200" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-2 mb-4" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-500 pl-4 italic bg-slate-100 dark:bg-slate-800/50 py-2 rounded-r-lg text-slate-800 dark:text-slate-300" {...props} />,
          table: ({node, ...props}) => <div className="overflow-x-auto mb-6 rounded-lg border border-slate-300 dark:border-slate-700 shadow-sm"><table className="w-full text-sm text-left" {...props} /></div>,
          th: ({node, ...props}) => <th className="bg-slate-200 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-200 p-3" {...props} />,
          td: ({node, ...props}) => <td className="p-3 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;