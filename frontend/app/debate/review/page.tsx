"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getDebateSummary } from "@/lib/api"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Brain,
  Home,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

interface DebateSummary {
  _id: string
  topic: string
  summary: {
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
  created_at: string
}

export default function DebateReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const summaryId = searchParams.get("id")

  const [summary, setSummary] = useState<DebateSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    if (!summaryId) {
      setError("No summary ID provided")
      setLoading(false)
      return
    }

    const fetchSummary = async () => {
      try {
        const data = await getDebateSummary(summaryId, token)
        setSummary(data)
      } catch (err: any) {
        setError(err.message || "Failed to load summary")
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [router, summaryId])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent"
    if (score >= 80) return "Great"
    if (score >= 70) return "Good"
    if (score >= 60) return "Fair"
    return "Needs Improvement"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your debate review...</p>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground">{error || "Summary not found"}</p>
        <Button onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" />
            <span className="font-semibold text-foreground">DebateAI</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Debate Performance Review</h1>
          <p className="text-muted-foreground">Topic: {summary.topic}</p>
        </div>

        {}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
                  <p className={`text-6xl font-bold ${getScoreColor(summary.summary.overall_score)}`}>
                    {summary.summary.overall_score}
                  </p>
                  <p className="text-lg text-muted-foreground mt-2">
                    {getScoreLabel(summary.summary.overall_score)}
                  </p>
                </div>
              </div>
              <Progress value={summary.summary.overall_score} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle>Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(summary.summary.breakdown).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between mb-2">
                  <span className="capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className={`font-semibold ${getScoreColor(value)}`}>
                    {value}
                  </span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {}
        <Card className="bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Judge's Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">
              {summary.summary.judge_comment}
            </p>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.summary.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <TrendingDown className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.summary.weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-1 flex-shrink-0" />
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {}
        {summary.summary.mistakes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Mistakes to Rectify
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {summary.summary.mistakes.map((mistake, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-600 font-bold mt-1">•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Actionable Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.summary.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">
                    {idx + 1}
                  </Badge>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {}
        <Card>
          <CardHeader>
            <CardTitle>Key Focus Areas for Practice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.summary.improvement_areas.map((area, idx) => (
                <Badge key={idx} variant="secondary">
                  {area}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {}
        <div className="flex gap-4 justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
          <Button onClick={() => router.push("/debate/setup")}>
            Start New Debate
          </Button>
        </div>
      </div>
    </main>
  )
}
