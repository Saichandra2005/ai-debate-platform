"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { getDashboard } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Brain, Home, MessageSquare, TrendingUp, TrendingDown,
  Minus, Award, Eye, Calendar, LogOut,
} from "lucide-react"

import ScoreProgressChart from "./ScoreProgressChart"
import CategoryBreakdownChart from "./CategoryBreakdownChart"
import DashboardSkeleton from "@/components/DashboardSkeleton"

interface Summary {
  _id: string
  topic: string
  created_at: string
  summary: {
    overall_score: number
    breakdown: {
      logical_reasoning: number
      vocabulary_usage: number
      argument_strength: number
      topic_relevance: number
      composure: number
    }
  }
}

// Simple toast state
let toastTimeout: NodeJS.Timeout
function showToast(msg: string, type: "success" | "error" = "success") {
  const el = document.getElementById("toast")
  if (!el) return
  el.textContent = msg
  el.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 ${
    type === "error" ? "bg-red-600 text-white" : "bg-foreground text-background"
  }`
  clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    el.className = "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg transition-all duration-300 opacity-0 pointer-events-none"
  }, 3000)
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)

  const userName = session?.user?.name || (typeof window !== "undefined" ? localStorage.getItem("userName") : null) || "User"
  const userEmail = session?.user?.email || (typeof window !== "undefined" ? localStorage.getItem("userEmail") : null) || ""
  const userImage = session?.user?.image || null
  const firstName = userName.split(" ")[0]

  const getInitials = (name: string) =>
    name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

  useEffect(() => {
    // Sync Google OAuth token when arriving from login
    const justSignedIn = sessionStorage.getItem("justSignedInWithGoogle")
    
    if (justSignedIn) {
      sessionStorage.removeItem("justSignedInWithGoogle")
      
      // Get session and sync token to localStorage
      fetch("/api/auth/session")
        .then(res => res.json())
        .then(sessionData => {
          if (sessionData?.accessToken) {
            localStorage.setItem("token", sessionData.accessToken)
            localStorage.setItem("userName", sessionData.user?.name || sessionData.user?.email?.split("@")[0] || "")
            localStorage.setItem("userEmail", sessionData.user?.email || "")
            console.log("Google OAuth token synced to localStorage")
          }
        })
        .catch(err => console.error("Token sync error:", err))
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.push("/login"); return }

    const token = (session as any)?.accessToken || localStorage.getItem("token")
    if (!token) { router.push("/login"); return }

    const fetchDashboard = async () => {
      try {
        const data = await getDashboard(token)
        setSummaries(Array.isArray(data.summaries) ? data.summaries : [])
      } catch (error) {
        showToast("Failed to load dashboard. Please try again.", "error")
        localStorage.removeItem("token")
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [status, session, router])

  const handleLogout = async () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userName")
    localStorage.removeItem("userEmail")
    await signOut({ callbackUrl: "/login" })
  }

  // Show skeleton while loading
  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-background">
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-accent" />
              <span className="font-semibold text-foreground">DebateAI</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          </div>
        </header>
        <DashboardSkeleton />
      </main>
    )
  }

  // Metrics
  const totalDebates = summaries.length
  const averageScore = summaries.length > 0
    ? Math.round(summaries.reduce((sum, s) => sum + (s.summary?.overall_score ?? 0), 0) / summaries.length)
    : 0

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const debatesThisWeek = summaries.filter(s => new Date(s.created_at) > oneWeekAgo).length

  // Score trend: compare last debate to previous
  const getTrend = () => {
    if (summaries.length < 2) return null
    const latest = summaries[0]?.summary?.overall_score ?? 0
    const previous = summaries[1]?.summary?.overall_score ?? 0
    const diff = latest - previous
    if (diff > 0) return { dir: "up", diff, label: `+${diff} vs last` }
    if (diff < 0) return { dir: "down", diff: Math.abs(diff), label: `-${Math.abs(diff)} vs last` }
    return { dir: "same", diff: 0, label: "Same as last" }
  }
  const trend = getTrend()

  const categoryAverages = summaries.length > 0 ? {
    logical_reasoning: Math.round(summaries.reduce((sum, s) => sum + (s.summary?.breakdown?.logical_reasoning ?? 0), 0) / summaries.length),
    vocabulary_usage: Math.round(summaries.reduce((sum, s) => sum + (s.summary?.breakdown?.vocabulary_usage ?? 0), 0) / summaries.length),
    argument_strength: Math.round(summaries.reduce((sum, s) => sum + (s.summary?.breakdown?.argument_strength ?? 0), 0) / summaries.length),
    topic_relevance: Math.round(summaries.reduce((sum, s) => sum + (s.summary?.breakdown?.topic_relevance ?? 0), 0) / summaries.length),
    composure: Math.round(summaries.reduce((sum, s) => sum + (s.summary?.breakdown?.composure ?? 0), 0) / summaries.length),
  } : null

  const hasValidCategoryData = categoryAverages && Object.values(categoryAverages).some(v => v > 0)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300"
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    return "bg-red-100 text-red-800 border-red-300"
  }

  return (
    <main className="min-h-screen bg-background">

      {/* Toast */}
      <div id="toast" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg opacity-0 pointer-events-none transition-all duration-300" />

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" />
            <span className="font-semibold text-foreground">DebateAI</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />Home
              </Button>
            </Link>
            <Link href="/debate/setup">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />Debate
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full ring-2 ring-accent/30 hover:ring-accent transition-all focus:outline-none">
                  <Avatar className="h-9 w-9 cursor-pointer">
                    {userImage && <AvatarImage src={userImage} alt={userName} />}
                    <AvatarFallback className="bg-accent text-white text-sm font-semibold">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalDebates === 0
              ? "Start your first debate to track your progress."
              : `You've completed ${totalDebates} debate${totalDebates > 1 ? "s" : ""}. Keep improving!`}
          </p>
        </div>

        {/* Action */}
        <div className="mb-8 flex justify-end">
          <Button onClick={() => router.push("/debate/setup")} className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />Start New Debate
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent/10 p-3">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Debates</p>
                  <p className="text-2xl font-bold">{totalDebates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent/10 p-3">
                  <Award className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{averageScore || "—"}</p>
                    {/* Score trend arrow */}
                    {trend && (
                      <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                        trend.dir === "up" ? "bg-green-100 text-green-700" :
                        trend.dir === "down" ? "bg-red-100 text-red-700" :
                        "bg-zinc-100 text-zinc-600"
                      }`}>
                        {trend.dir === "up" && <TrendingUp className="h-3 w-3" />}
                        {trend.dir === "down" && <TrendingDown className="h-3 w-3" />}
                        {trend.dir === "same" && <Minus className="h-3 w-3" />}
                        {trend.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent/10 p-3">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{debatesThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Performance Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {summaries.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No performance reviews yet.</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete a debate and generate a summary to see your AI judge feedback.
                </p>
                <Button onClick={() => router.push("/debate/setup")}>Start Your First Debate</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.slice(0, 10).map((summary, index) => {
                    // Per-row trend vs previous debate
                    const prevScore = summaries[index + 1]?.summary?.overall_score
                    const currScore = summary.summary?.overall_score ?? 0
                    const rowDiff = prevScore !== undefined ? currScore - prevScore : null

                    return (
                      <TableRow key={summary._id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {summary.topic || "Unknown Topic"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getScoreColor(currScore)}>
                              {currScore}
                            </Badge>
                            {rowDiff !== null && (
                              <span className={`text-xs font-medium ${
                                rowDiff > 0 ? "text-green-600" :
                                rowDiff < 0 ? "text-red-500" : "text-zinc-400"
                              }`}>
                                {rowDiff > 0 ? `↑${rowDiff}` : rowDiff < 0 ? `↓${Math.abs(rowDiff)}` : "→"}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(summary.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => router.push(`/debate/review?id=${summary._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />View Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Performance Trends */}
        {summaries.length >= 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold mb-4">Score Progression</h3>
                  <ScoreProgressChart summaries={summaries} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4">Category Performance</h3>
                  {hasValidCategoryData && categoryAverages ? (
                    <CategoryBreakdownChart averages={categoryAverages} />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center border rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <p className="mb-2">No category breakdown available</p>
                        <p className="text-sm">Complete new debates to see breakdown</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {summaries.length === 1 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Complete more debates to see performance trends and improvement over time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
