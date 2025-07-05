"use client";

import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";

const weeklyData = [
  { day: "Lun", score: 75 },
  { day: "Mar", score: 82 },
  { day: "Mié", score: 78 },
  { day: "Jue", score: 90 },
  { day: "Vie", score: 88 },
  { day: "Sáb", score: 95 },
  { day: "Dom", score: 92 },
];

const monthlyData = [
  { week: "S1", score: 80 },
  { week: "S2", score: 75 },
  { week: "S3", score: 88 },
  { week: "S4", score: 92 },
];

const chartConfig = {
  score: {
    label: "Puntaje",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function PerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento</CardTitle>
        <CardDescription>
          Tu progreso en las últimas semanas y meses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensual</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly">
            <div className="h-[350px] w-full pt-4">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart
                  accessibilityLayer
                  data={weeklyData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--card))", radius: 8 }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="score" fill="var(--color-score)" radius={8} />
                </BarChart>
              </ChartContainer>
            </div>
          </TabsContent>
          <TabsContent value="monthly">
            <div className="h-[350px] w-full pt-4">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <BarChart
                  accessibilityLayer
                  data={monthlyData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--card))", radius: 8 }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="score" fill="var(--color-score)" radius={8} />
                </BarChart>
              </ChartContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
