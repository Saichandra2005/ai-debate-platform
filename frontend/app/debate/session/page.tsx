"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { apiDebateStream, generateDebateSummary } from "@/lib/api"
import { showToast } from "@/app/components/Toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface Message {
  id: string
  sender: "user" | "ai"
  content: string
}

export default function DebateSessionPage() {
  const router = useRouter()

  /* ---------- Config ---------- */
  const [mode, setMode] = useState<string | null>(null)
  const [topic, setTopic] = useState("")
  const [turnsLeft, setTurnsLeft] = useState<number | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)

  /* ---------- Debate state ---------- */
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [debateIds, setDebateIds] = useState<string[]>([])

  /* ---------- Metrics ---------- */
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState(3)

  /* ---------- Timer ---------- */
  const [timeLeft, setTimeLeft] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)

  /* ---------- Modals ---------- */
  const [showExitModal, setShowExitModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  /* ---------- Load config from setup page ---------- */
  useEffect(() => {
    const storedConfig = localStorage.getItem("debateConfig")

    if (!storedConfig) {
      showToast("Please configure your debate first", "info")
      router.replace("/debate/setup")
      return
    }

    try {
      const config = JSON.parse(storedConfig)
      const debateMode = config.durationType

      if (!debateMode || !config.topic) {
        showToast("Invalid debate configuration", "error")
        router.replace("/debate/setup")
        return
      }

      setMode(debateMode)
      setTopic(config.topic)

      if (debateMode === "timed") {
        setTimeLeft((config.timeLimit || 5) * 60)
        setTurnsLeft(null)
      }

      if (debateMode === "turn-based") {
        setTurnsLeft(config.turns || 5)
      }

      setConfigLoaded(true)
    } catch (error) {
      console.error("Failed to parse debate config:", error)
      showToast("Invalid debate configuration", "error")
      router.replace("/debate/setup")
    }
  }, [router])

  /* ---------- Countdown ---------- */
  useEffect(() => {
    if (mode !== "timed") return
    if (!timerRunning || timeLeft <= 0) return

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [timerRunning, timeLeft, mode])

  /* ---------- Auto show summary when debate ends ---------- */
  useEffect(() => {
    if (!configLoaded || !mode) return

    const debateOver =
      (mode === "timed" && timeLeft <= 0 && timerRunning) ||
      (mode === "turn-based" && turnsLeft !== null && turnsLeft <= 0 && debateIds.length > 0)

    if (debateOver) {
      setShowSummaryModal(true)
    }
  }, [timeLeft, turnsLeft, mode, configLoaded, timerRunning, debateIds.length])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  /* ---------- Send argument ---------- */
  const handleSend = async () => {
    if (!input.trim()) return

    const token = localStorage.getItem("token")
    if (!token) {
      showToast("Please login to continue", "error")
      router.push("/login")
      return
    }

    if (mode === "timed" && !timerRunning) {
      setTimerRunning(true)
    }

    const userMsgId = Date.now().toString()
    setMessages((m) => [...m, { id: userMsgId, sender: "user", content: input }])

    setInput("")
    setLoading(true)
    setStreamingText("")

    const aiMsgId = userMsgId + "_ai"
    setMessages((m) => [...m, { id: aiMsgId, sender: "ai", content: "" }])

    apiDebateStream(
      topic,
      input,
      token,
      (text) => {
        setStreamingText(text)
        setMessages((m) =>
          m.map((msg) => msg.id === aiMsgId ? { ...msg, content: text } : msg)
        )
      },
      (response) => {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === aiMsgId ? { ...msg, content: response.ai_response } : msg
          )
        )

        if (response.turn_score) setCurrentScore(response.turn_score)
        if (response.difficulty_level) setDifficulty(response.difficulty_level)
        if (response.debate_id) setDebateIds((ids) => [...ids, response.debate_id])

        if (mode === "turn-based") {
          setTurnsLeft((t) => (t !== null ? t - 1 : 0))
        }

        setLoading(false)
        setStreamingText("")
      },
      (error) => {
        console.error("Debate error:", error)

        // Token expiry check
        if (error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
          showToast("Session expired. Please login again.", "error")
          localStorage.removeItem("token")
          setTimeout(() => router.push("/login"), 1500)
          return
        }

        showToast("Failed to get AI response. Please try again.", "error")
        setMessages((m) => m.filter((msg) => msg.id !== aiMsgId))
        setLoading(false)
        setStreamingText("")
      }
    )
  }

  /* ---------- Generate summary ---------- */
  const handleGenerateSummary = async () => {
    const token = localStorage.getItem("token")
    if (!token) return

    if (debateIds.length === 0) {
      router.push("/dashboard")
      return
    }

    setGeneratingSummary(true)

    try {
      const summaryData = await generateDebateSummary(topic, debateIds, token)
      showToast("Summary generated successfully!", "success")
      router.push(`/debate/review?id=${summaryData.summary_id}`)
    } catch (error) {
      console.error("Failed to generate summary:", error)
      showToast("Failed to generate summary. Redirecting to dashboard...", "error")
      setTimeout(() => router.push("/dashboard"), 1500)
    }
  }

  if (!mode || !configLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading debate...</p>
        </div>
      </div>
    )
  }

  const isDebateOver =
    (mode === "timed" && timeLeft <= 0 && timerRunning) ||
    (mode === "turn-based" && turnsLeft !== null && turnsLeft <= 0)

  return (
    <main className="min-h-screen bg-background flex justify-center px-4 py-6">
      <div className="w-full max-w-4xl flex flex-col gap-4">

        {/* Header */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="space-y-2">
              <CardTitle>
                {mode === "timed" ? "Timed Debate" : "Turn-Based Debate"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Topic: <strong>{topic}</strong>
              </p>
              <div className="flex gap-2 items-center flex-wrap">
                {mode === "timed" ? (
                  <Badge variant={timerRunning && timeLeft <= 30 ? "destructive" : "secondary"} className="text-sm">
                    ⏱️ {timerRunning ? formatTime(timeLeft) : "Timer starts on first message"}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm">🔄 Turns left: {turnsLeft}</Badge>
                )}
                {currentScore !== null && <Badge variant="secondary">Score: {currentScore}</Badge>}
                <Badge variant="outline">Difficulty: {difficulty}/5</Badge>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setShowExitModal(true)} className="w-full md:w-auto">
              Exit
            </Button>
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="flex-1 max-h-[50vh] md:max-h-[60vh]">
          <CardContent className="p-3 md:p-4 space-y-3 overflow-y-auto h-full">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm md:text-base">
                {mode === "timed"
                  ? "Start the debate! Timer will begin when you send your first argument."
                  : `Start the debate! You have ${turnsLeft} turns.`}
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={m.sender === "user" ? "text-right" : ""}>
                  <p className={`inline-block rounded-lg px-3 md:px-4 py-2 max-w-[85%] md:max-w-[80%] text-left text-sm md:text-base ${
                    m.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <strong className="text-xs md:text-sm">{m.sender === "user" ? "You" : "AI"}:</strong> {m.content}
                  </p>
                </div>
              ))
            )}
            {loading && streamingText === "" && (
              <div className="flex items-center gap-2 text-muted-foreground justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input */}
        <Card>
          <CardContent className="p-3 md:p-4 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && !isDebateOver && handleSend()}
              disabled={loading || isDebateOver}
              placeholder={isDebateOver ? "Debate has ended" : "Type your argument..."}
              className="min-h-[44px] text-sm md:text-base"
            />
            <Button onClick={handleSend} disabled={loading || isDebateOver} className="px-4 md:px-6 min-h-[44px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </CardContent>
        </Card>

        {/* Exit Modal */}
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-sm">
              <CardHeader><CardTitle>Exit Debate?</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to exit? Progress will be lost.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowExitModal(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => {
                    showToast("Debate exited", "info")
                    router.replace("/dashboard")
                  }}>Exit</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Summary Modal */}
        {showSummaryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-sm">
              <CardHeader><CardTitle>Debate Completed! 🎉</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {mode === "timed" ? "Time's up! " : "All turns completed! "}
                  Generate your AI judge summary to see detailed feedback and scoring.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    showToast("Skipped summary generation", "info")
                    router.push("/dashboard")
                  }} disabled={generatingSummary}>Skip</Button>
                  <Button onClick={handleGenerateSummary} disabled={generatingSummary}>
                    {generatingSummary ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</>
                    ) : "Get Summary"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}