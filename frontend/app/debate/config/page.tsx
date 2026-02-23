"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function DebateConfigPage() {
  const router = useRouter()

  const [mode, setMode] = useState<string | null>(null)

  
  const [timeLimit, setTimeLimit] = useState<5 | 10 | 15>(5)
  const [turns, setTurns] = useState<5 | 10>(5)
  const [fastResponse, setFastResponse] = useState(false)
  const [practiceMode, setPracticeMode] = useState(true)

  
  useEffect(() => {
    const selectedMode = localStorage.getItem("debateMode")
    if (!selectedMode) {
      router.push("/debate/setup")
    } else {
      setMode(selectedMode)
    }
  }, [router])

  const startDebate = () => {
    
    localStorage.setItem(
      "debateConfig",
      JSON.stringify({
        mode,
        timeLimit,
        turns,
        fastResponse,
        practiceMode,
      })
    )
    if(mode === "voice"){
        router.push("/debate/session/voice")
    }
    else{
        router.push("/debate/session")
    }
}

  if (!mode) return null

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-6">

        <h1 className="text-2xl font-bold text-center">
          Configure Your Debate
        </h1>

        {}
        {(mode === "timed-text" || mode === "voice") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Time Limit</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              {[5, 10, 15].map((min) => (
                <Button
                  key={min}
                  variant={timeLimit === min ? "default" : "outline"}
                  onClick={() => setTimeLimit(min as 5 | 10 | 15)}
                  className="flex-1"
                >
                  {min} min
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {}
        {mode === "turn-based" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Number of Turns</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              {[5, 10].map((t) => (
                <Button
                  key={t}
                  variant={turns === t ? "default" : "outline"}
                  onClick={() => setTurns(t as 5 | 10)}
                  className="flex-1"
                >
                  {t} turns
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Debate Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Fast Response Mode</Label>
              <Switch
                checked={fastResponse}
                onCheckedChange={setFastResponse}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>
                {practiceMode ? "Practice Mode" : "Competitive Mode"}
              </Label>
              <Switch
                checked={practiceMode}
                onCheckedChange={setPracticeMode}
              />
            </div>
          </CardContent>
        </Card>

        {}
        <Button
          className="w-full text-lg"
          onClick={startDebate}
        >
          Start Debate
        </Button>

      </div>
    </main>
  )
}
