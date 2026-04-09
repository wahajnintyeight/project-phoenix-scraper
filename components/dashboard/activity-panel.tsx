"use client";

import { Stats } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ActivityPanelProps {
  stats: Stats | null;
  isLoading: boolean;
}

function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function ActivityPanel({ stats, isLoading }: ActivityPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-3 w-20 rounded bg-zinc-800" />
            <div className="mt-1 h-5 w-32 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="font-mono text-sm text-zinc-500">No activity data</p>
      </div>
    );
  }

  const activities = [
    {
      label: "Last Scraped",
      time: stats.last_scraped_at,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      label: "Last Validated",
      time: stats.last_validated_at,
      icon: (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="divide-y divide-zinc-800/50">
      {activities.map((activity, index) => (
        <div
          key={activity.label}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/20"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <span className="text-zinc-500">{activity.icon}</span>
          <div className="flex-1">
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              {activity.label}
            </p>
            <p className="font-mono text-sm text-zinc-300">
              {formatRelativeTime(activity.time)}
            </p>
          </div>
          {activity.time && (
            <span className="font-mono text-xs text-zinc-600">
              {new Date(activity.time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
