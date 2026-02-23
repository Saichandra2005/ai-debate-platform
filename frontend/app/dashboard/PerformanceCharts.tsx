"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DebateRecord } from "@/types/debate"

interface Props {
  debates: DebateRecord[]
}

export default function PerformanceCharts({ debates }: Props) {
  
  const chartData = debates
    .slice()
    .reverse()
    .map((d, index) => ({
      index: index + 1,
      drift: d.drift_score,
      difficulty: d.difficulty_level,
    }))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {}
      <Card>
        <CardHeader>
          <CardTitle>Semantic Drift Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="drift"
                stroke="#ef4444"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Progression</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="difficulty"
                stroke="#22c55e"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
