"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, RotateCcw, Mic, Keyboard, Brain } from "lucide-react"
import Link from "next/link"

type InputMode = "text" | "voice"
type DurationType = "timed" | "turn-based"
type DebateType = "practice" | "advanced"

export default function DebateSetupPage() {
  const router = useRouter()

  
  const [inputMode, setInputMode] = useState<InputMode | null>(null)
  
  
  const [topic, setTopic] = useState("")
  const [durationType, setDurationType] = useState<DurationType>("timed")
  const [timeLimit, setTimeLimit] = useState(5)
  const [turns, setTurns] = useState(5)
  const [debateType, setDebateType] = useState<DebateType>("practice")

  const startDebate = () => {
    if (!inputMode) {
      alert("Please select an input method (Text or Voice)")
      return
    }

    if (!topic.trim()) {
      alert("Please enter a debate topic")
      return
    }

    const debateConfig = {
      topic,
      inputMode,
      durationType,
      timeLimit: durationType === "timed" ? timeLimit : null,
      turns: durationType === "turn-based" ? turns : null,
      debateType,
    }

    localStorage.setItem("debateConfig", JSON.stringify(debateConfig))

    
    if (inputMode === "voice") {
      router.push("/debate/session/voice")
    } else {
      router.push("/debate/session")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" />
            <span className="font-semibold text-foreground">DebateAI</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        
        {}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Start a New Debate</h1>
          <p className="text-muted-foreground text-lg">
            Choose your input method and configure your session
          </p>
        </div>

        {}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-xl font-semibold">Choose Input Method</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {}
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                inputMode === "text" ? "ring-2 ring-primary shadow-lg" : ""
              }`}
              onClick={() => setInputMode("text")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    inputMode === "text" ? "bg-primary text-primary-foreground" : "bg-accent/10 text-accent"
                  }`}>
                    <Keyboard className="h-6 w-6" />
                  </div>
                  <span>Text Debate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Type your arguments and receive text responses. 
                  Perfect for detailed, thoughtful debates.
                </p>
              </CardContent>
            </Card>

            {}
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg ${
                inputMode === "voice" ? "ring-2 ring-primary shadow-lg" : ""
              }`}
              onClick={() => setInputMode("voice")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    inputMode === "voice" ? "bg-primary text-primary-foreground" : "bg-accent/10 text-accent"
                  }`}>
                    <Mic className="h-6 w-6" />
                  </div>
                  <span>Voice Debate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Speak your arguments and hear AI responses. 
                  Natural conversation experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {}
        {inputMode && (
          <>
            {}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <h2 className="text-xl font-semibold">Debate Settings</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Debate Topic</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="e.g., Should AI be regulated by governments?"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="text-base"
                  />
                </CardContent>
              </Card>
            </div>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Duration Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      durationType === "timed"
                        ? "border-primary bg-accent/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setDurationType("timed")}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className={`h-5 w-5 ${
                        durationType === "timed" ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <span className="font-semibold">Timed Debate</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Fixed time limit for the entire debate
                    </p>
                    
                    {durationType === "timed" && (
                      <div className="space-y-2">
                        <Label className="text-sm">Time Limit (minutes)</Label>
                        <div className="flex gap-2">
                          {[5, 10, 15].map((t) => (
                            <Button
                              key={t}
                              size="sm"
                              variant={timeLimit === t ? "default" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation()
                                setTimeLimit(t)
                              }}
                              className="flex-1"
                            >
                              {t}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {}
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      durationType === "turn-based"
                        ? "border-primary bg-accent/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setDurationType("turn-based")}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <RotateCcw className={`h-5 w-5 ${
                        durationType === "turn-based" ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <span className="font-semibold">Turn-Based</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Fixed number of argument exchanges
                    </p>
                    
                    {durationType === "turn-based" && (
                      <div className="space-y-2">
                        <Label className="text-sm">Number of Turns</Label>
                        <div className="flex gap-2">
                          {[5, 10, 15].map((t) => (
                            <Button
                              key={t}
                              size="sm"
                              variant={turns === t ? "default" : "outline"}
                              onClick={(e) => {
                                e.stopPropagation()
                                setTurns(t)
                              }}
                              className="flex-1"
                            >
                              {t}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Difficulty Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      debateType === "practice"
                        ? "border-primary bg-accent/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setDebateType("practice")}
                  >
                    <div className="font-semibold mb-2">Practice Mode</div>
                    <p className="text-sm text-muted-foreground">
                      Recommended for learning. Balanced difficulty with helpful feedback.
                    </p>
                  </div>

                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      debateType === "advanced"
                        ? "border-primary bg-accent/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setDebateType("advanced")}
                  >
                    <div className="font-semibold mb-2">Advanced Mode</div>
                    <p className="text-sm text-muted-foreground">
                      Challenging debates with strict evaluation and expert-level AI.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {}
            <Card className="bg-accent/5">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between">
                      <span>Input Method:</span>
                      <span className="font-semibold text-foreground">
                        {inputMode === "text" ? "⌨️  Text" : "🎤 Voice"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-semibold text-foreground">
                        {durationType === "timed" 
                          ? `⏱️  ${timeLimit} minutes` 
                          : `🔄 ${turns} turns`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Difficulty:</span>
                      <span className="font-semibold text-foreground capitalize">
                        {debateType}
                      </span>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    onClick={startDebate}
                    className="w-full text-lg h-12"
                  >
                    Start Debate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </main>
  )
}
