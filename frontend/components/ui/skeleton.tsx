import { HTMLAttributes } from 'react';

export default function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`premium-skeleton rounded-xl ${className}`.trim()}
      {...props}
    />
  );
}
