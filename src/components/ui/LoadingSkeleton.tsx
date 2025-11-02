import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
  height?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  rows = 5,
  height = 'h-4'
}) => {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={`bg-gray-200 rounded ${height} dark:bg-gray-700`}></div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
