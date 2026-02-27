"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, AlertCircle, Lightbulb, Target } from "lucide-react"

interface Summary {
  overall_score: number
  breakdown: {
    logical_reasoning: number
    vocabulary_usage: number
    argument_strength: number
    topic_relevance: number
    composure: number
  }
  strengths: string[]
  weaknesses: string[]
  mistakes: string[]
  recommendations: string[]
  improvement_areas: string[]
  judge_comment: string
}

function SummaryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const topic = searchParams.get("topic") || ""
  const idsParam = searchParams.get("ids") || ""
  const debateIds = idsParam.split(",").filter(Boolean)

  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!topic || debateIds.length === 0) {
      setError("No debate data found")
      setLoading(false)
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    // Generate summary from backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/debate/summary`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        topic: topic,
        debate_ids: debateIds
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.summary) {
          setSummary(data.summary)
        } else {
          setError("Failed to generate summary")
        }
      })
      .catch(err => {
        console.error("Summary error:", err)
        setError("Failed to load summary")
      })
      .finally(() => setLoading(false))
  }, [topic, debateIds, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analyzing your debate performance...</p>
        </div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{error || "No summary available"}</p>
        <Button onClick={() => router.push("/debate/setup")}>
          Start New Debate
        </Button>
      </main>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" />
            <span className="font-semibold">DebateAI</span>
          </div>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Debate Performance Review</h1>
          <p className="text-muted-foreground">{topic}</p>
        </div>

        {/* Overall Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(summary.overall_score)}`}>
                {summary.overall_score}
              </div>
              <p className="text-sm text-muted-foreground mt-2">out of 100</p>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary.breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                      {value}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        value >= 80 ? "bg-green-500" :
                        value >= 60 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${value}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Judge Comment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Judge's Comment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{summary.judge_comment}</p>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.strengths.map((strength, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.weaknesses.map((weakness, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-red-600">•</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Mistakes */}
        {summary.mistakes.length > 0 && summary.mistakes[0] !== "None identified" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-5 w-5" />
                Critical Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.mistakes.map((mistake, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-orange-600">⚠</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Lightbulb className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-blue-600">💡</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Focus Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Focus on Next Debate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.improvement_areas.map((area, i) => (
                <Badge key={i} variant="secondary">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => router.push("/debate/history")}
          >
            View History
          </Button>
          <Button onClick={() => router.push("/debate/setup")}>
            Start New Debate
          </Button>
        </div>
      </div>
    </main>
  )
}

export default function DebateSummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <SummaryContent />
    </Suspense>
  )
}
