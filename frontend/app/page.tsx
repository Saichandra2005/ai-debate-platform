"use client"

import Link from "next/link"
import { Brain, Mic, Trophy, TrendingUp, Zap, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">

      {}
      <nav className="border-b bg-card sticky top-0 z-50 backdrop-blur-sm bg-white/80">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">DebateAI</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
        {}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />

        <div className="mx-auto max-w-7xl px-6 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {}
            <div>
              {}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-primary/5 border-primary/20 text-primary text-sm font-medium mb-6">
                <Zap className="h-3.5 w-3.5" />
                Powered by Gemini AI
              </div>

              {}
              <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
                Master the art of{" "}
                <span className="text-primary">debate</span>
              </h1>

              {}
              <p className="text-muted-foreground text-xl mb-8 leading-relaxed">
                Practice debates with an AI that adapts to your skill level. 
                Get instant feedback, track your progress, and become a sharper thinker.
              </p>

              {}
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button size="lg" className="text-lg px-8">
                    Start for free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>

            {}
            <div className="relative">
              <Card className="shadow-2xl border-2">
                {}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="ml-3 flex-1 text-xs text-muted-foreground font-mono">
                    debateai.app/debate
                  </div>
                </div>

                <CardContent className="p-6 space-y-4 bg-white">
                  {}
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      Turn-Based
                    </div>
                    <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs">
                      Topic: Should AI be regulated?
                    </div>
                  </div>

                  {}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-xl rounded-tl-none px-4 py-3 text-sm max-w-[85%]">
                      While regulation could prevent misuse, premature oversight risks stifling innovation...
                    </div>
                  </div>

                  {}
                  <div className="flex gap-3 justify-end">
                    <div className="bg-primary text-primary-foreground rounded-xl rounded-tr-none px-4 py-3 text-sm max-w-[85%]">
                      The risks far outweigh innovation concerns. Without guardrails, we face algorithmic bias...
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      You
                    </div>
                  </div>

                  {}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-green-700 text-xs font-medium">Score: 85 — Excellent!</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {}
              <div className="absolute -top-6 -right-6 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg rotate-12">
                Live AI Feedback!
              </div>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-20 bg-background">
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Everything you need to <span className="text-primary">debate better</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete debate training platform, not just a chatbot.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-6 w-6 text-yellow-600" />,
                title: "Adaptive Difficulty",
                desc: "AI adjusts challenge level in real-time based on your argument quality.",
                color: "yellow"
              },
              {
                icon: <Mic className="h-6 w-6 text-purple-600" />,
                title: "Voice & Text Modes",
                desc: "Debate by typing or speaking — practice for any format.",
                color: "purple"
              },
              {
                icon: <Trophy className="h-6 w-6 text-blue-600" />,
                title: "AI Judge Scoring",
                desc: "Detailed feedback on logic, vocabulary, argument strength, and more.",
                color: "blue"
              },
              {
                icon: <TrendingUp className="h-6 w-6 text-green-600" />,
                title: "Progress Tracking",
                desc: "Your personal dashboard tracks score progression and skill breakdown.",
                color: "green"
              },
              {
                icon: <MessageSquare className="h-6 w-6 text-red-600" />,
                title: "Timed & Turn-Based",
                desc: "Practice under time pressure or take turns methodically.",
                color: "red"
              },
              {
                icon: <Brain className="h-6 w-6 text-primary" />,
                title: "Drift Detection",
                desc: "AI detects when you go off-topic and keeps you sharp.",
                color: "primary"
              },
            ].map((f, i) => (
              <Card key={i} className="border-2 hover:border-primary/50 transition-all hover:shadow-lg group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-${f.color === "primary" ? "primary/10" : `${f.color}-100`} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              How it <span className="text-primary">works</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { num: "01", title: "Choose your topic", desc: "Pick any topic or get a suggestion. Set your debate mode." },
              { num: "02", title: "Debate the AI", desc: "Make your argument. AI responds with calibrated counterpoints." },
              { num: "03", title: "Get judged", desc: "AI analyzes your performance across 5 key dimensions." },
              { num: "04", title: "Track growth", desc: "See your scores improve on your personal dashboard." },
            ].map((s, i) => (
              <div key={i} className="relative text-center">
                {i < 3 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent" />
                )}
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-black text-xl mb-4">
                    {s.num}
                  </div>
                  <h3 className="font-bold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-4">
            Ready to sharpen your arguments?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Join debaters already practicing with AI. Free to start, no credit card required.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-10">
              Start for free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {}
      <footer className="border-t bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">© 2026 DebateAI - AI Debate Practice Platform</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Login</Link>
            <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}