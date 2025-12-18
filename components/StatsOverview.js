import { Activity, CheckCircle, XCircle } from "lucide-react";

export default function StatsOverview({ deployments }) {
  // Calculate stats from deployments
  const totalDeployments = deployments.length;
  const runningBots = deployments.filter((d) => d.status === "running").length;
  const failedBots = deployments.filter((d) => d.status === "failed").length;

  const stats = [
    {
      label: "Total Deployments",
      value: totalDeployments,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      label: "Running Bots",
      value: runningBots,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      label: "Failed Bots",
      value: failedBots,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg md:rounded-xl shadow-md dark:shadow-gray-700/40 hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mt-0.5 md:mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 md:p-3 rounded-full ${stat.bgColor}`}>
                <Icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
