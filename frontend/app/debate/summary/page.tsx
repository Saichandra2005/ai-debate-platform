"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DebateSummary {
  topic: string
  difficulty_level: number
  drift_score: number
  metrics?: {
    logical_coherence?: number
    vocabulary_level?: number
    aggression_level?: number
  }
}

export default function DebateSummaryPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<DebateSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

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
        if (Array.isArray(data) && data.length > 0) {
          setSummary(data[0])
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return <p className="text-center mt-20">Loading summary...</p>
  }

  if (!summary) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          No completed debate available.
        </p>
        <Button onClick={() => router.push("/debate/setup")}>
          Start Debate
        </Button>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex justify-center items-center px-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Debate Summary</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="font-semibold">{summary.topic}</p>

          <div className="flex gap-2">
            <Badge variant="outline">
              Difficulty {summary.difficulty_level}
            </Badge>
            <Badge>
              Drift {summary.drift_score.toFixed(2)}
            </Badge>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/debate/setup")}
            >
              New Debate
            </Button>
            <Button onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
