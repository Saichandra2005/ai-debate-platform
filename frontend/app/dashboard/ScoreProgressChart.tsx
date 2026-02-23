"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Summary {
  _id: string
  topic: string
  created_at: string
  summary: {
    overall_score: number
  }
}

interface Props {
  summaries: Summary[]
}

export default function ScoreProgressChart({ summaries }: Props) {
  
  const sortedSummaries = [...summaries].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const chartData = sortedSummaries.map((summary, index) => ({
    debate: `#${index + 1}`,
    score: summary.summary?.overall_score ?? 0,
    topic: summary.topic && summary.topic.length > 20 
      ? summary.topic.substring(0, 20) + "..." 
      : (summary.topic || "Unknown"),
  }))

  
  const firstScore = sortedSummaries[0]?.summary?.overall_score ?? 0
  const lastScore = sortedSummaries[sortedSummaries.length - 1]?.summary?.overall_score ?? 0
  const improvement = lastScore - firstScore

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="debate" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            domain={[0, 100]} 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-3 border rounded shadow-lg">
                    <p className="font-semibold">{payload[0].payload.debate}</p>
                    <p className="text-sm text-muted-foreground">{payload[0].payload.topic}</p>
                    <p className="text-lg font-bold text-accent mt-1">
                      Score: {payload[0].value}
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#8b5cf6" 
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {}
      {summaries.length >= 2 && (
        <div className="mt-2 text-center">
          {improvement > 0 ? (
            <p className="text-sm text-green-600 font-medium">
              📈 Improving! Up {improvement} points from first debate
            </p>
          ) : improvement < 0 ? (
            <p className="text-sm text-yellow-600 font-medium">
              📉 Down {Math.abs(improvement)} points from first debate
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              ➡️ Consistent performance
            </p>
          )}
        </div>
      )}
    </div>
  )
}