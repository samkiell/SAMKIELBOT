import React from "react";

const Skeleton = ({ className }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
    />
  );
};

export const BotCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 h-[280px] flex flex-col justify-between">
    <div>
      <div className="flex justify-between items-start mb-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-7 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-2/3" />
    </div>

    <div className="space-y-3 mt-6">
      <div className="flex justify-between gap-4">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
      >
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    ))}
  </div>
);

export const ListSkeleton = ({ count = 5 }) => (
  <div className="space-y-4">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700"
      >
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);

export const CommunityBotSkeleton = () => (
  <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
    <Skeleton className="h-1.5 w-full" />
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-3 w-3 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
    <div>
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
    <Skeleton className="h-12 w-12 rounded-lg" />
  </div>
);

export const NodeHealthSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-5 w-16 rounded" />
    </div>
    <div className="space-y-3">
      <div className="flex justify-between mb-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-10" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 flex gap-4">
      {[...Array(cols)].map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-4 flex gap-4">
          {[...Array(cols)].map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
