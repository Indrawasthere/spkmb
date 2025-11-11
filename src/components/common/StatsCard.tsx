import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  fromColor?: string;
  toColor?: string;
  iconBgOpacity?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  fromColor = "from-blue-500",
  toColor = "to-blue-600",
  iconBgOpacity = "bg-white/20",
}) => {
  return (
    <div
      className={`bg-gradient-to-br ${fromColor} ${toColor} rounded-xl p-6 text-white shadow-sm transition hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-blue-100 text-xs mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`${iconBgOpacity} rounded-full p-4`}>
          <Icon className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
};
