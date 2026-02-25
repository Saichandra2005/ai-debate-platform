"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { getDashboard } from "@/lib/api"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  Brain,
  Home,
  MessageSquare,
  TrendingUp,
  Award,
  Eye,
  Calendar,
  LogOut,
  User,
} from "lucide-react"

import ScoreProgressChart from "./ScoreProgressChart"
import CategoryBreakdownChart from "./CategoryBreakdownChart"

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

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [loading, setLoading] = useState(true)

  
  const userName = session?.user?.name || (typeof window !== "undefined" ? localStorage.getItem("userName") : null) || "User"
  const userEmail = session?.user?.email || (typeof window !== "undefined" ? localStorage.getItem("userEmail") : null) || ""
  const userImage = session?.user?.image || null
  const firstName = userName.split(" ")[0]

  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    const token = (session as any)?.accessToken || localStorage.getItem("token")

    if (!token) {
      router.push("/login")
      return
    }

    const fetchDashboard = async () => {
      try {
        const data = await getDashboard(token)
        setSummaries(Array.isArray(data.summaries) ? data.summaries : [])
      } catch (error) {
        console.error("Failed to load dashboard:", error)
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

  
  if (status === "loading" || (loading && status === "authenticated")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  
  const totalDebates = summaries.length

  const averageScore =
    summaries.length > 0
      ? Math.round(
          summaries.reduce((sum, s) => {
            const score = s.summary?.overall_score ?? 0
            return sum + score
          }, 0) / summaries.length
        )
      : 0

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const debatesThisWeek = summaries.filter(s =>
    new Date(s.created_at) > oneWeekAgo
  ).length

  const categoryAverages = summaries.length > 0 ? {
    logical_reasoning: Math.round(
      summaries.reduce((sum, s) => sum + (s.summary?.breakdown?.logical_reasoning ?? 0), 0) / summaries.length
    ),
    vocabulary_usage: Math.round(
      summaries.reduce((sum, s) => sum + (s.summary?.breakdown?.vocabulary_usage ?? 0), 0) / summaries.length
    ),
    argument_strength: Math.round(
      summaries.reduce((sum, s) => sum + (s.summary?.breakdown?.argument_strength ?? 0), 0) / summaries.length
    ),
    topic_relevance: Math.round(
      summaries.reduce((sum, s) => sum + (s.summary?.breakdown?.topic_relevance ?? 0), 0) / summaries.length
    ),
    composure: Math.round(
      summaries.reduce((sum, s) => sum + (s.summary?.breakdown?.composure ?? 0), 0) / summaries.length
    ),
  } : null

  const hasValidCategoryData = categoryAverages && Object.values(categoryAverages).some(val => val > 0)

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-300"
    if (score >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300"
    return "bg-red-100 text-red-800 border-red-300"
  }

  return (
    <main className="min-h-screen bg-background">
      {}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" />
            <span className="font-semibold text-foreground">DebateAI</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>

            <Link href="/debate/setup">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Debate
              </Button>
            </Link>

            {}
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
                {}
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold">{userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />


                {}
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

        {}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {totalDebates === 0
              ? "Start your first debate to track your progress."
              : `You've completed ${totalDebates} debate${totalDebates > 1 ? "s" : ""}. Keep improving!`
            }
          </p>
        </div>

        {}
        <div className="mb-8 flex justify-end">
          <Button
            onClick={() => router.push("/debate/setup")}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Start New Debate
          </Button>
        </div>

        {}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-accent/10 p-3">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Debates</p>
                  <p className="text-2xl font-bold text-foreground">{totalDebates}</p>
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
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold text-foreground">{averageScore || "—"}</p>
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
                  <p className="text-2xl font-bold text-foreground">{debatesThisWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Performance Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : summaries.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No performance reviews yet.</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete a debate and generate a summary to see your AI judge feedback.
                </p>
                <Button onClick={() => router.push("/debate/setup")}>
                  Start Your First Debate
                </Button>
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
                  {summaries.slice(0, 10).map((summary) => (
                    <TableRow key={summary._id}>
                      <TableCell className="font-medium">
                        {summary.topic || "Unknown Topic"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(summary.summary?.overall_score ?? 0)}>
                          {summary.summary?.overall_score ?? "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(summary.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/debate/review?id=${summary._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {}
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
