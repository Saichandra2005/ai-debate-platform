"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { apiDebateStream, generateDebateSummary } from "@/lib/api"
import { showToast } from "@/app/components/Toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mic, MicOff } from "lucide-react"

interface Message {
  id: string
  sender: "user" | "ai"
  content: string
}

export default function VoiceDebateSessionPage() {
  const router = useRouter()

  const [mode, setMode] = useState<string | null>(null)
  const [topic, setTopic] = useState("")
  const [turnsLeft, setTurnsLeft] = useState<number | null>(null)
  const [configLoaded, setConfigLoaded] = useState(false)

  const [userInput, setUserInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [debateIds, setDebateIds] = useState<string[]>([])

  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState(3)

  const [timeLeft, setTimeLeft] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)

  const [showExitModal, setShowExitModal] = useState(false)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const recognitionRef = useRef<any>(null)
  // Track all utterances so we can cancel mid-speech
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isMountedRef = useRef(true)

  // ── Cleanup: cancel speech on unmount / navigation ─────────────────────────
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      stopSpeaking()
    }
  }, [])

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  // ── Load config ────────────────────────────────────────────────────────────
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
      if (debateMode === "timed") setTimeLeft((config.timeLimit || 5) * 60)
      if (debateMode === "turn-based") setTurnsLeft(config.turns || 5)
      setConfigLoaded(true)
    } catch {
      showToast("Invalid debate configuration", "error")
      router.replace("/debate/setup")
    }
  }, [router])

  // ── Speech recognition setup ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window)) return
    const SpeechRecognition = (window as any).webkitSpeechRecognition
    const rec = new SpeechRecognition()
    rec.lang = "en-US"
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e: any) => {
      let transcript = ""
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript
      setUserInput(transcript)
    }
    rec.onerror = (event: any) => {
      setIsRecording(false)
      if (event.error !== "no-speech" && event.error !== "network") {
        showToast("Speech recognition error. Please try again.", "error")
      }
    }
    rec.onend = () => setIsRecording(false)
    recognitionRef.current = rec
  }, [])

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "timed" || !timerRunning || timeLeft <= 0) return
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timerRunning, timeLeft, mode])

  // ── Debate over detection ──────────────────────────────────────────────────
  useEffect(() => {
    if (!configLoaded || !mode) return
    const debateOver =
      (mode === "timed" && timeLeft <= 0 && timerRunning) ||
      (mode === "turn-based" && turnsLeft !== null && turnsLeft <= 0 && debateIds.length > 0)
    if (debateOver) {
      stopSpeaking()
      setShowSummaryModal(true)
    }
  }, [timeLeft, turnsLeft, mode, configLoaded, timerRunning, debateIds.length])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      showToast("Speech recognition not supported in your browser", "error")
      return
    }
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  // ── FIX 1: Sentence-chunked speech — starts speaking immediately ──────────
  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    stopSpeaking()

    // Split into sentences so we can speak chunk by chunk
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    let index = 0

    const speakNext = () => {
      if (!isMountedRef.current || index >= sentences.length) {
        setIsSpeaking(false)
        return
      }
      const utterance = new SpeechSynthesisUtterance(sentences[index].trim())
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = "en-US"
      utterance.onend = () => {
        index++
        speakNext()
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
      }
      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }

    setIsSpeaking(true)

    // Ensure voices are loaded (Edge/Chrome fix)
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", speakNext, { once: true })
    } else {
      speakNext()
    }
  }

  // ── FIX 1b: Speak sentence-by-sentence as streaming chunks arrive ─────────
  const streamingSentenceBuffer = useRef("")
  const hasSpokenForCurrentAiMsg = useRef(false)

  const speakStreamChunk = (fullTextSoFar: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return

    // Find new text since last call
    const newText = fullTextSoFar.slice(streamingSentenceBuffer.current.length)
    streamingSentenceBuffer.current = fullTextSoFar

    // If we find a complete sentence in the new text, speak it immediately
    const sentenceEnd = newText.search(/[.!?]/)
    if (sentenceEnd !== -1) {
      // Extract the complete sentence(s) from the buffer
      const bufferUpToNow = fullTextSoFar
      const sentenceMatch = bufferUpToNow.match(/^.*?[.!?]+/s)
      if (sentenceMatch && !hasSpokenForCurrentAiMsg.current) {
        // Speak whatever complete sentences we have so far
        const toSpeak = sentenceMatch[0].trim()
        if (toSpeak.length > 10) {
          hasSpokenForCurrentAiMsg.current = true
          const utterance = new SpeechSynthesisUtterance(toSpeak)
          utterance.rate = 1.0
          utterance.pitch = 1.0
          utterance.volume = 1.0
          utterance.lang = "en-US"
          utteranceRef.current = utterance
          setIsSpeaking(true)
          window.speechSynthesis.speak(utterance)
        }
      }
    }
  }

  // ── Send argument ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!userInput.trim()) return
    const token = localStorage.getItem("token")
    if (!token) {
      showToast("Please login to continue", "error")
      router.push("/login")
      return
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }

    if (mode === "timed" && !timerRunning) setTimerRunning(true)

    const argumentText = userInput
    const userMsgId = Date.now().toString()
    setMessages((m) => [...m, { id: userMsgId, sender: "user", content: argumentText }])
    setUserInput("")
    setLoading(true)

    const aiMsgId = userMsgId + "_ai"
    setMessages((m) => [...m, { id: aiMsgId, sender: "ai", content: "" }])

    // Reset streaming speech state
    streamingSentenceBuffer.current = ""
    hasSpokenForCurrentAiMsg.current = false
    stopSpeaking()

    apiDebateStream(
      topic,
      argumentText,
      token,
      (text) => {
        // Update message text as it streams in
        setMessages((m) =>
          m.map((msg) => msg.id === aiMsgId ? { ...msg, content: text } : msg)
        )
        // FIX 1: Start speaking as soon as first sentence arrives
        speakStreamChunk(text)
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
        if (mode === "turn-based") setTurnsLeft((t) => (t !== null ? t - 1 : 0))

        // Speak any remaining text that wasn't spoken during streaming
        const spoken = streamingSentenceBuffer.current
        const remaining = response.ai_response.slice(spoken.length).trim()
        if (remaining.length > 5) {
          const utterance = new SpeechSynthesisUtterance(remaining)
          utterance.rate = 1.0
          utterance.lang = "en-US"
          utteranceRef.current = utterance
          setIsSpeaking(true)
          window.speechSynthesis.speak(utterance)
        }

        setLoading(false)
      },
      (error) => {
        console.error("Debate error:", error)
        if (error?.message?.includes("401") || error?.message?.includes("Unauthorized")) {
          showToast("Session expired. Please login again.", "error")
          localStorage.removeItem("token")
          setTimeout(() => router.push("/login"), 1500)
          return
        }
        showToast("Failed to get AI response. Please try again.", "error")
        setMessages((m) => m.filter((msg) => msg.id !== aiMsgId))
        setLoading(false)
      }
    )
  }

  const handleExit = () => {
    // FIX 2: Cancel speech immediately on exit
    stopSpeaking()
    if (recognitionRef.current && isRecording) recognitionRef.current.stop()
    showToast("Debate exited", "info")
    router.replace("/dashboard")
  }

  const handleGenerateSummary = async () => {
    stopSpeaking()
    const token = localStorage.getItem("token")
    if (!token) return
    if (debateIds.length === 0) { router.push("/dashboard"); return }
    setGeneratingSummary(true)
    try {
      const summaryData = await generateDebateSummary(topic, debateIds, token)
      showToast("Summary generated successfully!", "success")
      router.push(`/debate/review?id=${summaryData.summary_id}`)
    } catch {
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

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="space-y-2">
              <CardTitle>
                {mode === "timed" ? "Timed Voice Debate" : "Turn-Based Voice Debate"}
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
                {isSpeaking && (
                  <Badge variant="outline" className="text-sm animate-pulse">
                    🔊 AI speaking...
                  </Badge>
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
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 text-center py-6 border-2 border-dashed rounded-lg">
                {isRecording ? (
                  <div className="space-y-2 px-4">
                    <div className="animate-pulse text-red-500 font-semibold flex items-center justify-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                      Recording...
                    </div>
                    {userInput ? (
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-1">Live transcription:</p>
                        <p className="text-base font-medium">{userInput}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Start speaking...</p>
                    )}
                  </div>
                ) : userInput ? (
                  <div className="space-y-2 px-4">
                    <p className="text-sm text-muted-foreground">Recognized:</p>
                    <p className="text-base font-medium">{userInput}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Click "Start Recording" to speak</p>
                    <p className="text-xs text-muted-foreground">Your argument will appear here as you speak</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                onClick={toggleRecording}
                disabled={loading || isDebateOver}
                className="flex-1 h-12"
              >
                {isRecording ? (
                  <><MicOff className="h-5 w-5 mr-2" />Stop Recording</>
                ) : (
                  <><Mic className="h-5 w-5 mr-2" />Start Recording</>
                )}
              </Button>

              <Button
                onClick={handleSend}
                disabled={loading || isDebateOver || !userInput.trim()}
                className="px-8 h-12"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send"}
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  <Button variant="destructive" onClick={handleExit}>Exit</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                    stopSpeaking()
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
