import { Header } from "@/components/dashboard/header";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { ProgressMetricsCard } from "@/components/dashboard/progress-metrics-card";
import { ActiveCoursesCard } from "@/components/dashboard/active-courses-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { TasksCard } from "@/components/dashboard/tasks-card";
import { RecentAchievementsCard } from "@/components/dashboard/recent-achievements-card";
import { StudyTimeAnalysisCard } from "@/components/dashboard/study-time-analysis-card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <WelcomeBanner />
          <ProgressMetricsCard />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PerformanceChart />
            </div>
            <div className="lg:col-span-1">
              <TasksCard />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActiveCoursesCard />
            </div>
            <div className="space-y-6">
              <StudyTimeAnalysisCard />
              <RecentAchievementsCard />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
