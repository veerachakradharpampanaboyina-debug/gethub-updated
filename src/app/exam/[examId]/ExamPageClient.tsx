
'use client';

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
import { LogOut, Settings, Home as HomeIcon, History, BrainCircuit, Shield, BookCopy, Info, FileText, Download, MessageCircle, GalleryHorizontal, Check, RefreshCw, Clock, LayoutDashboard } from 'lucide-react';
import { ExamDetails, ExamPaper, SyllabusProgress, TopicStatus } from '@/lib/types';
import GethubLogo from '@/components/gethub-logo';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateSyllabusNotes } from '@/ai/flows/generate-syllabus-notes';
import jsPDF from 'jspdf';
import { Separator } from '@/components/ui/separator';
import { markdownToHtml } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getSyllabusProgress, updateSyllabusProgress } from '@/services/syllabus-service';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';


function ExamSyllabusPageComponent({ exam }: { exam: ExamDetails }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [notesError, setNotesError] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [syllabusProgress, setSyllabusProgress] = useState<SyllabusProgress | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const notesContentRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=/exam/${exam.examId}`);
    } else if (!loading && user) {
        setIsLoadingProgress(true);
        getSyllabusProgress(user.uid, exam.examId)
            .then(progress => {
                setSyllabusProgress(progress || { topicStatus: {} });
            })
            .catch(err => {
                console.error("Failed to load syllabus progress:", err);
                toast({ title: "Error", description: "Could not load your progress.", variant: "destructive" });
            })
            .finally(() => setIsLoadingProgress(false));
    }
  }, [user, loading, router, exam.examId, toast]);

  const handleStatusChange = async (topicId: string, status: TopicStatus) => {
    if (!user) return;
    
    const newProgress = {
        ...syllabusProgress,
        topicStatus: {
            ...syllabusProgress?.topicStatus,
            [topicId]: status,
        }
    };
    setSyllabusProgress(newProgress as SyllabusProgress);
    try {
        await updateSyllabusProgress(user.uid, exam.examId, newProgress as SyllabusProgress);
    } catch (error) {
        toast({ title: "Error", description: "Failed to save progress.", variant: "destructive" });
        // Optionally revert state
    }
};

  const { totalTopics, completedTopics } = useMemo(() => {
    const allTopics = exam.stages.flatMap(stage => stage.papers.flatMap(paper => paper.topics?.map(topic => `${paper.paperId}-${topic}`) || []));
    const total = allTopics.length;
    if (!syllabusProgress) return { totalTopics: total, completedTopics: 0 };

    const completed = allTopics.filter(topicId => syllabusProgress.topicStatus[topicId] === 'Completed').length;
    return { totalTopics: total, completedTopics: completed };
  }, [exam, syllabusProgress]);

  const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;


  const handleGenerateNotes = async (topic: string) => {
    setCurrentTopic(topic);
    setIsNotesDialogOpen(true);
    setIsGeneratingNotes(true);
    setGeneratedNotes('');
    setNotesError(null);

    try {
        const result = await generateSyllabusNotes({
            examName: exam.examName,
            topic: topic,
        });
        setGeneratedNotes(result.notes);
    } catch (err) {
        console.error("Failed to generate notes:", err);
        setNotesError("Sorry, we couldn't generate notes at this time. Please try again later.");
    } finally {
        setIsGeneratingNotes(false);
    }
  };
  
  const handleDownloadPdf = () => {
    const content = notesContentRef.current;
    if (!content) {
      toast({
        title: 'Download Error',
        description: 'Could not find the content to download.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Generating PDF...',
      description: 'This may take a moment. Please wait.',
    });

    const pdf = new jsPDF('p', 'pt', 'a4');
    
    pdf.html(content, {
      callback: function (doc) {
        try {
          doc.save(`${currentTopic.replace(/\s+/g, '_').toLowerCase()}_notes.pdf`);
        } catch (error) {
            console.error("Failed to save PDF:", error);
            toast({
                title: "PDF Generation Failed",
                description: "There was an issue saving the PDF. Please try again.",
                variant: "destructive"
            });
        }
      },
      x: 15,
      y: 15,
      autoPaging: 'text',
      html2canvas: {
          scale: 0.8, 
          useCORS: true,
          logging: false,
      },
       margin: [10, 10, 10, 10],
    });
  };

  if (loading || !user || isLoadingProgress) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const renderPaperDetails = (paper: ExamPaper) => (
    <div className="space-y-2 text-sm text-muted-foreground">
      <div className="flex justify-between"><span>Type</span> <span className="font-medium text-foreground">{paper.type}</span></div>
      <div className="flex justify-between"><span>Duration</span> <span className="font-medium text-foreground">{paper.duration}</span></div>
      <div className="flex justify-between"><span>Marks</span> <span className="font-medium text-foreground">{paper.totalMarks}</span></div>
      {paper.totalQuestions && <div className="flex justify-between"><span>Questions</span> <span className="font-medium text-foreground">{paper.totalQuestions}</span></div>}
      {paper.negativeMarking && <div className="flex justify-between"><span>Negative Marking</span> <span className="font-medium text-foreground">{paper.negativeMarking}</span></div>}
      {paper.qualifying && <div className="flex justify-between"><span>Qualifying</span> <Badge variant="outline">{paper.qualifyingMarks || 'Yes'}</Badge></div>}
      {paper.notes && <p className="text-xs pt-2 border-t mt-2">{paper.notes}</p>}
    </div>
  );
  
  const TopicStatusBadge = ({ status }: { status: TopicStatus }) => {
    switch (status) {
        case 'Completed':
            return <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30"><Check className="mr-1 h-3 w-3"/>Completed</Badge>;
        case 'Revision':
            return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"><RefreshCw className="mr-1 h-3 w-3"/>Revision</Badge>;
        default:
            return <Badge variant="outline"><Clock className="mr-1 h-3 w-3"/>Pending</Badge>;
    }
};

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
                  <SidebarMenuButton tooltip="Dashboard">
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
              <BookCopy className="w-6 h-6"/>
              {exam.examName}
            </h1>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8 space-y-6">
            <Card className="bg-secondary/30">
                <CardHeader>
                    <CardTitle>Syllabus & Preparation</CardTitle>
                    <CardDescription>
                        Explore the detailed syllabus for the {exam.examName}. Track your progress, generate practice tests, or get AI-generated notes for any topic.
                    </CardDescription>
                </CardHeader>
                 {totalTopics > 0 && (
                    <CardContent>
                        <div className="space-y-2">
                             <div className="flex justify-between items-center mb-1">
                                <Label htmlFor="progress">Syllabus Progress</Label>
                                <span className="text-sm font-medium text-primary">{progressPercentage.toFixed(0)}%</span>
                            </div>
                            <Progress value={progressPercentage} id="progress" />
                            <p className="text-xs text-muted-foreground">{completedTopics} of {totalTopics} topics completed.</p>
                        </div>
                    </CardContent>
                )}
            </Card>

            {exam.stages && exam.stages.length > 0 ? (
                 <Accordion type="multiple" className="w-full space-y-4">
                   {exam.stages.map((stage) => (
                    <AccordionItem value={stage.stageId} key={stage.stageId} className="border rounded-lg bg-secondary/50">
                        <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                           {stage.stageName}
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-0 border-t">
                             <Accordion type="multiple" className="w-full space-y-4 mt-4">
                                {stage.papers.map((paper) => (
                                    <AccordionItem value={paper.paperId} key={paper.paperId} className="border rounded-lg bg-background/50">
                                         <AccordionTrigger className="p-4 hover:no-underline">
                                           {paper.paperName}
                                         </AccordionTrigger>
                                         <AccordionContent className="p-4 pt-0 border-t grid md:grid-cols-3 gap-6">
                                              <Card className="md:col-span-1">
                                                <CardHeader>
                                                  <CardTitle className="flex items-center gap-2 text-base"><Info /> Details</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                  {renderPaperDetails(paper)}
                                                </CardContent>
                                              </Card>
                                             <Card className="md:col-span-2">
                                                <CardHeader>
                                                  <CardTitle className="flex items-center gap-2 text-base"><BrainCircuit /> Practice Topics</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                  {paper.topics && paper.topics.length > 0 ? paper.topics.map((topic, index) => {
                                                     const topicId = `${paper.paperId}-${topic}`;
                                                     const currentStatus = syllabusProgress?.topicStatus[topicId] || 'Pending';
                                                     return (
                                                      <div key={index} className="p-3 rounded-lg bg-secondary/30 space-y-3">
                                                         <div className="flex justify-between items-start">
                                                            <p className="font-medium text-sm flex-1 pr-4">{topic}</p>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-auto px-2 py-1">
                                                                        <TopicStatusBadge status={currentStatus} />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent>
                                                                    <DropdownMenuItem onClick={() => handleStatusChange(topicId, 'Pending')}>
                                                                        <Clock className="mr-2 h-4 w-4"/> Pending
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleStatusChange(topicId, 'Completed')}>
                                                                        <Check className="mr-2 h-4 w-4"/> Completed
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleStatusChange(topicId, 'Revision')}>
                                                                        <RefreshCw className="mr-2 h-4 w-4"/> Revision
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                         </div>
                                                          <div className="flex flex-col sm:flex-row gap-2">
                                                            <Button asChild variant="outline" size="sm" className="w-full">
                                                                <Link href={`/practice?topic=${encodeURIComponent(`${exam.examName} - ${paper.paperName} - ${topic}`)}`}>
                                                                    <BrainCircuit className="mr-2" />
                                                                    Practice Topic
                                                                </Link>
                                                            </Button>
                                                            <Button variant="secondary" size="sm" className="w-full" onClick={() => handleGenerateNotes(`${exam.examName} - ${paper.paperName} - ${topic}`)}>
                                                                <FileText className="mr-2" />
                                                                Generate Notes
                                                            </Button>
                                                          </div>
                                                      </div>
                                                  )}) : (
                                                    <div className="text-sm text-center text-muted-foreground py-4">
                                                      No specific topics listed. You can generate a general practice test for this paper.
                                                    </div>
                                                  )}
                                                </CardContent>
                                                <CardFooter className="flex-col items-stretch gap-2">
                                                    <Separator />
                                                    <Button asChild className="w-full">
                                                        <Link href={`/practice?topic=${encodeURIComponent(`${exam.examName} - ${paper.paperName}`)}`}>
                                                            <BrainCircuit className="mr-2" /> Generate Full Practice Test for {paper.paperName}
                                                        </Link>
                                                    </Button>
                                                </CardFooter>
                                             </Card>
                                         </AccordionContent>
                                    </AccordionItem>
                                ))}
                             </Accordion>
                              {stage.personalityTest && (
                                <Card className="mt-4 border rounded-lg bg-background/50">
                                  <CardHeader>
                                      <CardTitle>{stage.personalityTest.stageName}</CardTitle>
                                  </CardHeader>
                                   <CardContent>
                                      <p>Total Marks: {stage.personalityTest.totalMarks}</p>
                                  </CardContent>
                                </Card>
                              )}
                        </AccordionContent>
                    </AccordionItem>
                   ))}
                </Accordion>
            ) : (
                <Card className="mt-6">
                    <CardHeader className="items-center text-center">
                        <CardTitle>Syllabus Coming Soon</CardTitle>
                        <CardDescription>The detailed syllabus for this exam is being prepared. Check back soon!</CardDescription>
                    </CardHeader>
                </Card>
            )}
           
        </main>
      </SidebarInset>
       <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>AI Generated Notes</DialogTitle>
            <DialogDescription>
              Topic: {currentTopic}. Review the notes or download as a PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-4 -mr-6">
            {isGeneratingNotes ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <LoaderCircle className="w-12 h-12 animate-spin text-primary mx-auto" />
                  <p className="mt-4 text-muted-foreground">Generating notes...</p>
                </div>
              </div>
            ) : notesError ? (
              <div className="text-destructive p-4">{notesError}</div>
            ) : (
               <div className="prose prose-sm md:prose-base max-w-none p-2">
                 <div ref={notesContentRef} className="bg-white text-black p-8 font-serif">
                    <div dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedNotes) }} />
                 </div>
              </div>
            )}
          </div>
           <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesDialogOpen(false)}>Close</Button>
            <Button onClick={handleDownloadPdf} disabled={isGeneratingNotes || !!notesError}>
              <Download className="mr-2" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function SidebarInset({ children }: { children: React.ReactNode}) {
  return (
    <div className="flex-1">{children}</div>
  )
}

export default function ExamPageClient({ exam }: { exam: ExamDetails }) {
  return (
    <AuthProvider>
      <ExamSyllabusPageComponent exam={exam} />
    </AuthProvider>
  );
}
