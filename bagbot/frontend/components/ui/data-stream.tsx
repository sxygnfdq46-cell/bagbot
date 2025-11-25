import React from 'react';

interface DataStreamProps {
  data?: Array<{ label: string; value: string | number }>;
  isStreaming?: boolean;
  className?: string;
}

export const DataStream: React.FC<DataStreamProps> = ({
  data = [],
  isStreaming = false,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {data.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
        >
          <span className="text-sm text-gray-400">{item.label}</span>
          <span className="text-sm font-semibold text-cyan-400">{item.value}</span>
        </div>
      ))}
      {isStreaming && (
        <div className="flex items-center gap-2 text-sm text-cyan-400">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>Streaming data...</span>
        </div>
      )}
    </div>
  );
};
