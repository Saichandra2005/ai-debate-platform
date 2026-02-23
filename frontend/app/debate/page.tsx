"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiPost } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

import {
  Brain,
  Send,
  Mic,
  Clock,
  RotateCcw,
  Home,
  LayoutDashboard,
  Volume2,
} from "lucide-react"


type DebateMode = "timed" | "turn-based"
type TimedOption = 5 | 10 | 15
type TurnOption = 5 | 10

interface Message {
  id: string
  sender: "user" | "ai"
  content: string
}


export default function DebatePage() {
  const router = useRouter()

  
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) router.push("/login")
  }, [router])

  
  const [debateMode, setDebateMode] = useState<DebateMode>("timed")
  const [timedOption, setTimedOption] = useState<TimedOption>(5)
  const [turnOption, setTurnOption] = useState<TurnOption>(5)

  const [speechInput, setSpeechInput] = useState(false)
  const [speechOutput, setSpeechOutput] = useState(false)
  const [fastResponse, setFastResponse] = useState(false)
  const [practiceMode, setPracticeMode] = useState(true)

  
  const [topic, setTopic] = useState("")
  const [userInput, setUserInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  
  const [timeLeft, setTimeLeft] = useState(timedOption * 60)
  const timerRunning = useRef(false)

  useEffect(() => {
    setTimeLeft(timedOption * 60)
    timerRunning.current = false
  }, [timedOption])

  useEffect(() => {
    if (!timerRunning.current || debateMode !== "timed" || timeLeft <= 0) return
    const i = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(i)
  }, [timeLeft, debateMode])

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  
  const handleMicClick = () => {
    if (!speechInput) return
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported")
      return
    }

    
    const rec = new window.webkitSpeechRecognition()
    rec.lang = "en-US"
    rec.onresult = (e: any) =>
      setUserInput(prev => prev + " " + e.results[0][0].transcript)
    rec.start()
  }

  
  const speak = (text: string) => {
    if (!speechOutput) return
    const u = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(u)
  }

  
  const handleSend = async () => {
    if (!userInput.trim() || !topic) return

    const token = localStorage.getItem("token")
    if (!token) return router.push("/login")

    if (debateMode === "timed" && !timerRunning.current) {
      timerRunning.current = true
    }

    setMessages(m => [...m, { id: Date.now().toString(), sender: "user", content: userInput }])
    setUserInput("")
    setLoading(true)

    try {
      const data = await apiPost(
        "/api/debate",
        {
          topic,
          argument: userInput,
          mode: fastResponse ? "fast" : "normal",
          time_limit: timedOption,
          practice_mode: practiceMode,
        },
        token
      )

      setMessages(m => [
        ...m,
        { id: Date.now().toString() + "ai", sender: "ai", content: data.ai_response },
      ])

      if (speechOutput) speak(data.ai_response)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  
  return (
    <main className="min-h-screen bg-background">
      {}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between">
          <Link href="/" className="flex gap-2">
            <Brain className="h-6 w-6 text-accent" />
            DebateAI
          </Link>
          <nav className="flex gap-2">
            <Link href="/"><Button variant="ghost" size="sm"><Home className="h-4 w-4 mr-2"/>Home</Button></Link>
            <Link href="/dashboard"><Button variant="ghost" size="sm"><LayoutDashboard className="h-4 w-4 mr-2"/>Dashboard</Button></Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        {}
        <aside className="space-y-6">
          {}
          <Card>
            <CardHeader><CardTitle className="text-base">Debate Mode</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Button onClick={() => setDebateMode("timed")} variant={debateMode==="timed"?"default":"outline"}><Clock className="h-4 w-4 mr-2"/>Timed</Button>
              <Button onClick={() => setDebateMode("turn-based")} variant={debateMode==="turn-based"?"default":"outline"}><RotateCcw className="h-4 w-4 mr-2"/>Turn</Button>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Toggle label="Speech Input" value={speechInput} set={setSpeechInput} />
              <Toggle label="Speech Output" value={speechOutput} set={setSpeechOutput} />
              <Toggle label="Fast Response" value={fastResponse} set={setFastResponse} />
              <Toggle label={practiceMode ? "Practice Mode" : "Competitive Mode"} value={practiceMode} set={setPracticeMode} />
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader><CardTitle className="text-base">Topic</CardTitle></CardHeader>
            <CardContent>
              <Input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Enter debate topic..." />
            </CardContent>
          </Card>

          {}
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {debateMode==="timed" ? "Time Remaining" : "Turns"}
              </p>
              <p className="text-3xl font-bold">
                {debateMode==="timed" ? formatTime(timeLeft) : turnOption}
              </p>
            </CardContent>
          </Card>
        </aside>

        {}
        <Card className="flex flex-col h-[70vh]">
          <CardHeader><CardTitle>{topic || "Debate Arena"}</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {messages.map(m=>(
              <div key={m.id} className={m.sender==="user"?"text-right":""}>
                <p className="inline-block rounded-lg px-4 py-2 bg-muted">{m.content}</p>
                {m.sender==="ai" && speechOutput && (
                  <button onClick={()=>speak(m.content)} className="ml-2 text-xs underline"><Volume2 className="inline h-3 w-3"/></button>
                )}
              </div>
            ))}
          </CardContent>
          <div className="border-t p-4 flex gap-2">
            <Input value={userInput} onChange={e=>setUserInput(e.target.value)} placeholder="Type your argument..." />
            <Button variant="outline" onClick={handleMicClick} disabled={!speechInput}><Mic className="h-4 w-4"/></Button>
            <Button onClick={handleSend}><Send className="h-4 w-4"/></Button>
          </div>
        </Card>
      </div>
    </main>
  )
}


function Toggle({ label, value, set }: { label: string, value: boolean, set: (v:boolean)=>void }) {
  return (
    <div className="flex justify-between items-center">
      <Label className="text-sm">{label}</Label>
      <Switch checked={value} onCheckedChange={set} />
    </div>
  )
}
