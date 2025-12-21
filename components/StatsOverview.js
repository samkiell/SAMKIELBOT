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
    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-3 md:p-6 rounded-xl shadow-md dark:shadow-gray-700/40 hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700/50"
          >
            <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-1 md:gap-4">
              <div className="text-center md:text-left">
                <p className="text-[10px] md:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider md:normal-case">
                  {stat.label.split(" ")[0]}{" "}
                  <span className="hidden md:inline">
                    {stat.label.split(" ")[1]}
                  </span>
                </p>
                <p className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-2 md:p-3 rounded-xl ${stat.bgColor} flex-shrink-0`}
              >
                <Icon className={`w-4 h-4 md:w-6 md:h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
