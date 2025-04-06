// مكون إبراز النص في البحث
import { ReactNode } from 'react';

interface HighlightedTextProps {
  text: string;
  searchQuery: string;
  className?: string;
}

export function HighlightedText({ text, searchQuery, className = '' }: HighlightedTextProps) {
  if (!searchQuery || !text) return <span className={className}>{text}</span>;
  
  const lowerSearchQuery = searchQuery.toLowerCase().trim();
  if (!lowerSearchQuery) return <span className={className}>{text}</span>;
  
  const index = text.toLowerCase().indexOf(lowerSearchQuery);
  if (index === -1) return <span className={className}>{text}</span>;
  
  const before = text.substring(0, index);
  const match = text.substring(index, index + lowerSearchQuery.length);
  const after = text.substring(index + lowerSearchQuery.length);
  
  return (
    <span className={className}>
      {before}
      <span className="bg-yellow-200 text-black font-medium px-1 rounded">{match}</span>
      {after}
    </span>
  );
}