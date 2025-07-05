"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartData = [
  { subject: "Matemáticas", hours: 12, fill: "hsl(var(--chart-1))" },
  { subject: "Ciencia", hours: 8, fill: "hsl(var(--chart-2))" },
  { subject: "Historia", hours: 5, fill: "hsl(var(--chart-3))" },
  { subject: "Programación", hours: 15, fill: "hsl(var(--chart-4))" },
];

const chartConfig = {
  hours: {
    label: "Horas",
  },
  Matemáticas: {
    label: "Matemáticas",
    color: "hsl(var(--chart-1))",
  },
  Ciencia: {
    label: "Ciencia",
    color: "hsl(var(--chart-2))",
  },
  Historia: {
    label: "Historia",
    color: "hsl(var(--chart-3))",
  },
  Programación: {
    label: "Programación",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function StudyTimeAnalysisCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis de Tiempo</CardTitle>
        <CardDescription>Distribución de horas de estudio.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <Pie
              data={chartData}
              dataKey="hours"
              nameKey="subject"
              innerRadius={50}
              outerRadius={80}
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="subject" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
