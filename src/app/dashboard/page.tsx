
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Settings, Home as HomeIcon, History, BrainCircuit, Shield, MessageCircle, GalleryHorizontal, LayoutDashboard, TrendingUp, Sparkles, BookCheck, PlusCircle } from 'lucide-react';
import GethubLogo from '@/components/gethub-logo';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { getUserExamAttempts } from '@/services/exam-service';
import { getAllSyllabusProgress } from '@/services/syllabus-service';
import { ExamAttempt, SyllabusProgress } from '@/lib/types';
import { examCategories } from '@/lib/exam-categories';
import { Progress } from '@/components/ui/progress';
import { generateStudySuggestions, GenerateStudySuggestionsInput } from '@/ai/flows/generate-study-suggestions';
import { markdownToHtml } from '@/lib/utils';
import { format } from 'date-fns';

function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [syllabusProgress, setSyllabusProgress] = useState<Record<string, SyllabusProgress>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard');
    } else if (!loading && user) {
        Promise.all([
            getUserExamAttempts(user.uid),
            getAllSyllabusProgress(user.uid)
        ]).then(([userAttempts, progress]) => {
            setAttempts(userAttempts);
            setSyllabusProgress(progress);
        }).catch(err => {
            console.error("Failed to load dashboard data:", err);
            toast({ title: "Error", description: "Could not load your dashboard data.", variant: "destructive" });
        }).finally(() => {
            setIsLoading(false);
        });
    }
  }, [user, loading, router, toast]);

  const practiceStats = useMemo(() => {
    const practiceAttempts = attempts.filter(a => a.examId.startsWith('practice-'));
    const total = practiceAttempts.length;
    const averageScore = total > 0 
        ? practiceAttempts.reduce((sum, a) => {
            const score = a.aiGradingState.totalPointsPossible > 0 ? (a.aiGradingState.totalPointsAwarded / a.aiGradingState.totalPointsPossible) * 100 : 0;
            return sum + score;
        }, 0) / total
        : 0;

    const lastAttempt = practiceAttempts[0]; // Assumes attempts are sorted desc by date
    const lastScore = lastAttempt && lastAttempt.aiGradingState.totalPointsPossible > 0 
        ? (lastAttempt.aiGradingState.totalPointsAwarded / lastAttempt.aiGradingState.totalPointsPossible) * 100
        : null;

    return { total, averageScore, lastScore };
  }, [attempts]);

  const syllabusStats = useMemo(() => {
    const allExams = examCategories.flatMap(c => c.exams);
    let totalTopics = 0;
    let completedTopics = 0;
    
    Object.keys(syllabusProgress).forEach(examId => {
        const examDetails = allExams.find(e => e.examId === examId);
        if (!examDetails) return;

        const progress = syllabusProgress[examId];
        const examTopics = examDetails.stages.flatMap(stage => stage.papers.flatMap(paper => paper.topics?.map(topic => `${paper.paperId}-${topic}`) || []));
        totalTopics += examTopics.length;
        completedTopics += examTopics.filter(topicId => progress.topicStatus[topicId] === 'Completed').length;
    });

    return {
        overallCompletion: totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0,
        trackedExams: Object.keys(syllabusProgress).length,
    }
  }, [syllabusProgress]);


  const handleGenerateSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    setAiSuggestions('');
    try {
        const recentExamsInput = attempts.slice(0, 5).map(a => ({
            examName: a.examName,
            scorePercentage: a.aiGradingState.totalPointsPossible > 0 ? (a.aiGradingState.totalPointsAwarded / a.aiGradingState.totalPointsPossible) * 100 : 0,
            incorrectlyAnsweredTopics: a.incorrectlyAnsweredTopics || [],
        }));
        
        const allExams = examCategories.flatMap(c => c.exams);
        const syllabusProgressInput = Object.entries(syllabusProgress).map(([examId, progress]) => {
             const examDetails = allExams.find(e => e.examId === examId);
             const examTopics = examDetails?.stages.flatMap(stage => stage.papers.flatMap(paper => paper.topics || [])) || [];
             const revisionTopics = Object.keys(progress.topicStatus).filter(k => progress.topicStatus[k] === 'Revision').map(k => k.split('-').slice(1).join('-'));
             const completedCount = Object.values(progress.topicStatus).filter(s => s === 'Completed').length;
             return {
                 examName: examDetails?.examName || examId,
                 completionPercentage: examTopics.length > 0 ? (completedCount / examTopics.length) * 100 : 0,
                 revisionTopics: revisionTopics,
             };
        });

        const input: GenerateStudySuggestionsInput = {
            recentExams: recentExamsInput,
            syllabusProgress: syllabusProgressInput,
        };
        
        const result = await generateStudySuggestions(input);
        setAiSuggestions(result.suggestions);

    } catch (err) {
        console.error("Failed to generate suggestions:", err);
        toast({ title: "Error", description: "Could not generate AI suggestions at this time.", variant: "destructive" });
    } finally {
        setIsGeneratingSuggestions(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <GethubLogo className="w-8 h-8 text-primary" width={32} height={32} />
            <span className="text-lg font-semibold">Gethub</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
           <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
               <SidebarMenuItem>
                <Link href="/">
                  <SidebarMenuButton tooltip="Homepage">
                    <HomeIcon />
                    <span>Homepage</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/dashboard">
                  <SidebarMenuButton tooltip="Dashboard" isActive>
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/history">
                  <SidebarMenuButton tooltip="Exam History">
                    <History />
                    <span>History</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/gallery">
                  <SidebarMenuButton tooltip="Gallery">
                    <GalleryHorizontal />
                    <span>Gallery</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
             <SidebarGroupLabel>Practice</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/practice">
                        <SidebarMenuButton tooltip="Practice Exam">
                            <BrainCircuit />
                            <span>Practice Exam</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <Link href="/comms-practice">
                        <SidebarMenuButton tooltip="Communication Practice">
                            <MessageCircle />
                            <span>Comm. Practice</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
           {user && user.email === 'admin@gethub.com' && (
             <SidebarGroup>
               <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                      <Link href="/admin">
                          <SidebarMenuButton tooltip="Admin Dashboard">
                              <Shield />
                              <span>Admin</span>
                          </SidebarMenuButton>
                      </Link>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
           )}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings">
                  <SidebarMenuButton tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Profile">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={user.photoURL ?? 'https://placehold.co/100x100.png'} alt="@teacher" data-ai-hint="teacher portrait"/>
                  <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.displayName || user.email}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton tooltip="Logout" onClick={logout}>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl font-semibold flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6"/>
              Preparation Dashboard
            </h1>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8 space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Practice Exams Taken</CardTitle>
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{practiceStats.total}</div>
                        <p className="text-xs text-muted-foreground">Total practice exams completed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{practiceStats.averageScore.toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">Across all practice exams</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Syllabus Coverage</CardTitle>
                        <BookCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{syllabusStats.overallCompletion.toFixed(0)}%</div>
                        <p className="text-xs text-muted-foreground">Across {syllabusStats.trackedExams} tracked exams</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Score</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{practiceStats.lastScore ? `${practiceStats.lastScore.toFixed(0)}%` : 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">Your most recent practice score</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                 <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Your Tracked Exams</CardTitle>
                        <CardDescription>Your completion status for each exam you're tracking.</CardDescription>
                      </div>
                       <Button asChild variant="outline">
                          <Link href="/#exams">
                              <PlusCircle className="mr-2"/>
                              Add Another Exam
                          </Link>
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.keys(syllabusProgress).length > 0 ? Object.entries(syllabusProgress).map(([examId, progress]) => {
                             const examDetails = examCategories.flatMap(c => c.exams).find(e => e.examId === examId);
                             if (!examDetails) return null;

                             const examTopicsCount = examDetails.stages.flatMap(stage => stage.papers.flatMap(paper => paper.topics?.length || 0)).reduce((a,b) => a + b, 0);
                             const completedCount = Object.values(progress.topicStatus).filter(s => s === 'Completed').length;
                             const completionPercentage = examTopicsCount > 0 ? (completedCount / examTopicsCount) * 100 : 0;
                            return (
                                <Card key={examId} className="bg-secondary/30">
                                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex-1">
                                            <Link href={`/exam/${examId}`} className="font-semibold hover:underline">{examDetails.examName}</Link>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Progress value={completionPercentage} className="h-2 w-full max-w-xs" />
                                                <span className="text-xs text-muted-foreground">{completionPercentage.toFixed(0)}% Complete</span>
                                            </div>
                                        </div>
                                        <Button asChild className="w-full sm:w-auto">
                                             <Link href={`/exam/${examId}`}>Prepare</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            )
                        }) : (
                             <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                                <BookCheck className="mx-auto w-12 h-12 text-gray-500 mb-4"/>
                                <p className="font-semibold">No syllabus progress tracked yet.</p>
                                <p className="text-sm">You can start by enrolling in an exam from the homepage.</p>
                                <Button asChild variant="default" className="mt-4">
                                    <Link href="/#exams">
                                        <PlusCircle className="mr-2"/>
                                        Enroll in an Exam
                                    </Link>
                                </Button>
                             </div>
                        )}
                    </CardContent>
                </Card>
                
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2"><Sparkles/>AI Study Suggestions</span>
                            <Button size="sm" variant="ghost" onClick={handleGenerateSuggestions} disabled={isGeneratingSuggestions}>
                                {isGeneratingSuggestions ? <LoaderCircle className="w-4 h-4 animate-spin"/> : "Generate"}
                            </Button>
                        </CardTitle>
                        <CardDescription>Personalized recommendations based on your performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {isGeneratingSuggestions ? (
                            <div className="flex items-center justify-center h-48">
                                <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
                            </div>
                         ) : aiSuggestions ? (
                             <div className="prose prose-sm prose-invert max-w-none text-current" dangerouslySetInnerHTML={{ __html: markdownToHtml(aiSuggestions) }} />
                         ) : (
                             <div className="text-center text-muted-foreground py-8">
                                <Sparkles className="mx-auto w-12 h-12 text-gray-500 mb-4"/>
                                <p className="font-semibold">Get Your Study Plan</p>
                                <p className="text-sm">Click "Generate" to get a personalized study plan from our AI tutor.</p>
                             </div>
                         )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>A log of your most recent practice exams.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                    {attempts.slice(0, 5).map(attempt => {
                        const scorePercentage = attempt.aiGradingState.totalPointsPossible > 0 ? (attempt.aiGradingState.totalPointsAwarded / attempt.aiGradingState.totalPointsPossible) * 100 : 0;
                        return (
                        <div key={attempt.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                            <div>
                                <p className="font-semibold">{attempt.examName}</p>
                                <p className="text-sm text-muted-foreground">{format(attempt.createdAt.toDate(), "PPP p")}</p>
                            </div>
                            <div className="text-right">
                               <p className="font-semibold">{attempt.aiGradingState.totalPointsAwarded} / {attempt.aiGradingState.totalPointsPossible}</p>
                               <p className="text-sm text-muted-foreground">{scorePercentage.toFixed(0)}%</p>
                            </div>
                        </div>
                    )})}
                     {attempts.length === 0 && (
                          <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                            <History className="mx-auto w-12 h-12 text-gray-500 mb-4"/>
                            <p className="font-semibold">No recent activity.</p>
                            <p className="text-sm">Take a practice exam to get started!</p>
                            <Button asChild variant="link" className="mt-2"><Link href="/practice">Take a Practice Exam</Link></Button>
                         </div>
                     )}
                    </div>
                </CardContent>
            </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


function SidebarInset({ children }: { children: React.ReactNode}) {
  return (
    <div className="flex-1">{children}</div>
  )
}

function DashboardPageWrapper() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">
            <div className="text-center flex flex-col items-center gap-4">
                <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
                <h1 className="text-2xl font-bold">Loading Dashboard...</h1>
            </div>
        </div>}>
            <DashboardPage />
        </Suspense>
    );
}

export default function DashboardPageWithAuth() {
  return (
    <AuthProvider>
      <DashboardPageWrapper />
    </AuthProvider>
  );
}
