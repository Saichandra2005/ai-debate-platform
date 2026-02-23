"use client"

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts"

interface CategoryAverages {
  logical_reasoning: number
  vocabulary_usage: number
  argument_strength: number
  topic_relevance: number
  composure: number
}

interface Props {
  averages: CategoryAverages
}

export default function CategoryBreakdownChart({ averages }: Props) {
  const data = [
    {
      category: "Logical Reasoning",
      score: averages.logical_reasoning,
      fullMark: 100,
    },
    {
      category: "Vocabulary",
      score: averages.vocabulary_usage,
      fullMark: 100,
    },
    {
      category: "Argument Strength",
      score: averages.argument_strength,
      fullMark: 100,
    },
    {
      category: "Topic Relevance",
      score: averages.topic_relevance,
      fullMark: 100,
    },
    {
      category: "Composure",
      score: averages.composure,
      fullMark: 100,
    },
  ]

  
  const hasData = data.some(item => item.score > 0)

  if (!hasData) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="mb-2">No category data available</p>
          <p className="text-sm">Complete new debates to see breakdown</p>
        </div>
      </div>
    )
  }

  
  const strongest = data.reduce((max, item) => 
    item.score > max.score ? item : max
  , data[0])
  
  const weakest = data.reduce((min, item) => 
    item.score < min.score ? item : min
  , data[0])

  return (
    <div className="w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2 border rounded shadow-lg">
                    <p className="font-semibold text-sm">{payload[0].payload.category}</p>
                    <p className="text-lg font-bold text-accent">
                      {payload[0].value}/100
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {}
      <div className="mt-4 space-y-2 text-sm w-full px-4">
        <div className="flex items-start justify-between gap-4 w-full">
          <span className="text-muted-foreground whitespace-nowrap">Strongest:</span>
          <span className="font-semibold text-green-600 text-right truncate">
            {strongest.category} ({strongest.score})
          </span>
        </div>
        <div className="flex items-start justify-between gap-4 w-full">
          <span className="text-muted-foreground whitespace-nowrap">Needs Work:</span>
          <span className="font-semibold text-yellow-600 text-right truncate">
            {weakest.category} ({weakest.score})
          </span>
        </div>
      </div>
    </div>
  )
}