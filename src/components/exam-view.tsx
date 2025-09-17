
"use client";

import { useState, useRef } from 'react';
import type {
  Exam,
  Question,
  AIGradingState,
  GradingResult,
  FlaggedAnswer,
} from '@/lib/types';
import { autoGradeObjectiveQuestions } from '@/ai/flows/auto-grade-objective-questions';
import { flagPotentiallyIncorrectAnswers } from '@/ai/flows/flag-potentially-incorrect-answers';
import { generateExamSummary } from '@/ai/flows/generate-exam-summary';
import { saveExamAttempt } from '@/services/exam-service';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  HelpCircle,
  LoaderCircle,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Textarea } from './ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { examCategories } from '@/lib/exam-categories';


interface ExamViewProps {
  exam: Exam;
}

const getQuestionIcon = (questionType: Question['questionType']) => {
  switch (questionType) {
    case 'multipleChoice':
      return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
    case 'trueFalse':
      return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
    default:
      return <HelpCircle className="w-4 h-4 text-muted-foreground" />;
  }
};

const QuestionInput = ({
  question,
  onAnswerChange,
  isSubmitted,
}: {
  question: Question;
  onAnswerChange: (questionId: string, answer: string) => void;
  isSubmitted: boolean;
}) => {
  const [currentAnswer, setCurrentAnswer] = useState(question.studentAnswer);

  const handleValueChange = (value: string) => {
    setCurrentAnswer(value);
    onAnswerChange(question.questionId, value);
  };

  if (isSubmitted) {
     return (
      <div className="grid gap-2">
        <h4 className="font-semibold text-sm">Your Answer</h4>
        <p className="text-sm p-3 bg-secondary rounded-md">
          {question.studentAnswer || "No answer provided."}
        </p>
      </div>
    );
  }

  switch (question.questionType) {
    case 'multipleChoice':
      return (
        <div className="space-y-2">
          <Label>Your Answer:</Label>
          <RadioGroup
            value={currentAnswer}
            onValueChange={handleValueChange}
            className="space-y-2"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.questionId}-${index}`} />
                <Label htmlFor={`${question.questionId}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );
    case 'trueFalse':
      return (
        <div className="space-y-2">
          <Label>Your Answer:</Label>
          <RadioGroup
             value={currentAnswer}
             onValueChange={handleValueChange}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="True" id={`${question.questionId}-true`} />
              <Label htmlFor={`${question.questionId}-true`}>True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="False" id={`${question.questionId}-false`} />
              <Label htmlFor={`${question.questionId}-false`}>False</Label>
            </div>
          </RadioGroup>
        </div>
      );
    case 'freeText':
      return (
        <div className="space-y-2">
          <Label htmlFor={`${question.questionId}-textarea`}>Your Answer:</Label>
          <Textarea
            id={`${question.questionId}-textarea`}
            value={currentAnswer}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Type your answer here..."
            rows={5}
          />
        </div>
      );
    default:
      return null;
  }
};


const QuestionResultBadge = ({
  question,
  aiResults,
}: {
  question: Question;
  aiResults: AIGradingState | null;
}) => {
  if (!aiResults) {
    return null;
  }

  const objectiveResult = aiResults.objectiveResults.find(
    (r) => r.questionId === question.questionId
  );
  if (objectiveResult) {
    return objectiveResult.isCorrect ? (
      <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
        <CheckCircle2 className="w-4 h-4 mr-1" />
        Correct
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">
        <XCircle className="w-4 h-4 mr-1" />
        Incorrect
      </Badge>
    );
  }

  const flaggedResult = aiResults.flaggedAnswers.find(
    (f) => f.questionId === question.questionId
  );
  if (flaggedResult?.isPotentiallyIncorrect) {
    return (
      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
        <AlertCircle className="w-4 h-4 mr-1" />
        Needs Review
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-sky-500/10 text-sky-400 border-sky-500/20">
      <CheckCircle2 className="w-4 h-4 mr-1" />
      Graded
    </Badge>
  );
};

export function ExamView({ exam: initialExam }: ExamViewProps) {
  const [exam, setExam] = useState(initialExam);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AIGradingState | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const topOfViewRef = useRef<HTMLDivElement>(null);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setExam(prevExam => ({
      ...prevExam,
      questions: prevExam.questions.map(q =>
        q.questionId === questionId ? { ...q, studentAnswer: answer } : q
      ),
    }));
  };


  const handleGradeExam = async () => {
    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to submit an exam.",
            variant: "destructive",
        });
        return;
    }
    setIsLoading(true);
    setAiResults(null);
    topOfViewRef.current?.scrollIntoView({ behavior: 'smooth' });

  try {
      // 1. Grade objective questions
      const objectiveQuestions = exam.questions.filter(
        (q) => q.questionType === 'multipleChoice' || q.questionType === 'trueFalse'
      );

      const gradingResponse = await autoGradeObjectiveQuestions({
        questions: objectiveQuestions.map((q) => ({
          questionId: q.questionId,
          questionType: q.questionType as 'multipleChoice' | 'trueFalse',
          questionText: q.questionText,
          correctAnswer: q.correctAnswer,
          studentAnswer: q.studentAnswer || "", // Ensure studentAnswer is not undefined
          pointsPossible: q.pointsPossible,
        })),
      });
      const objectiveResults: GradingResult[] = gradingResponse.results;
      let totalPointsAwarded = gradingResponse.totalPointsAwarded;
      let totalPointsPossible = gradingResponse.totalPointsPossible;

      // 2. Flag free-text questions
      const freeTextQuestions = exam.questions.filter(
        (q) => q.questionType === 'freeText'
      );

      const flaggingPromises = freeTextQuestions.map((q) =>
        flagPotentiallyIncorrectAnswers({
          question: q.questionText,
          studentAnswer: q.studentAnswer || "", // Ensure studentAnswer is not undefined
          correctAnswer: q.correctAnswer,
        }).then((res) => ({ ...res, questionId: q.questionId }))
      );
      const flaggedAnswers: FlaggedAnswer[] = await Promise.all(flaggingPromises);
      
      totalPointsPossible += freeTextQuestions.reduce((sum, q) => sum + q.pointsPossible, 0);

      const allExams = examCategories.flatMap(c => c.exams);
      const examDetails = allExams.find(e => exam.examName.includes(e.examName));
      
      const incorrectTopics: string[] = [];
      exam.questions.forEach(q => {
        const isCorrect = objectiveResults.find(r => r.questionId === q.questionId)?.isCorrect;
        if (isCorrect === false) {
          const questionTopic = exam.examName.replace('Practice Exam: ', '');
          if(questionTopic && !incorrectTopics.includes(questionTopic)) {
            incorrectTopics.push(questionTopic);
          }
        }
      });


      // 3. Generate summary
      const summaryResponse = await generateExamSummary({
        studentName: exam.student.name,
        examName: exam.examName,
        questions: exam.questions.map((q) => {
          const objectiveRes = objectiveResults.find(
            (r) => r.questionId === q.questionId
          );
          const flaggedRes = flaggedAnswers.find(
            (f) => f.questionId === q.questionId
          );
          return {
            questionText: q.questionText,
            studentAnswer: q.studentAnswer || "",
            isCorrect: objectiveRes ? objectiveRes.isCorrect : !flaggedRes?.isPotentiallyIncorrect,
            feedback: objectiveRes?.feedback || flaggedRes?.reason,
          };
        }),
      });
      
      const results: AIGradingState = {
        objectiveResults,
        flaggedAnswers,
        summary: summaryResponse.summary,
        totalPointsAwarded,
        totalPointsPossible,
      };

      // 4. Save attempt to Firestore
      await saveExamAttempt({
        userId: user.uid,
        examId: exam.examId,
        examName: exam.examName,
        questions: exam.questions,
        aiGradingState: results,
        incorrectlyAnsweredTopics: incorrectTopics
      });

       toast({
        title: "Analysis Complete",
        description: "Your exam results have been saved to your history.",
      });
      setAiResults(results);

    } catch (error) {
      console.error('Error grading exam:', error);
       toast({
        title: "Error",
        description: "An error occurred while analyzing your exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Ensure the analyzing message is visible for at least 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLoading(false);
    }
  };

  const scorePercentage = aiResults && aiResults.totalPointsPossible > 0
    ? (aiResults.totalPointsAwarded / aiResults.totalPointsPossible) * 100
    : 0;
  
  const isSubmitted = aiResults !== null;

  return (
    <div className="space-y-8" ref={topOfViewRef}>
      <Card className="bg-secondary/50">
        <CardHeader>
          <CardTitle>{exam.examName}</CardTitle>
          <CardDescription>
            {isSubmitted
              ? "AI-powered analysis of your answers."
              : "Answer the questions below and submit for AI-powered analysis."}
          </CardDescription>
        </CardHeader>
      </Card>

      {isLoading && (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center">
            <LoaderCircle className="w-12 h-12 animate-spin text-primary mb-4" />
            <CardTitle>Analyzing in Progress...</CardTitle>
            <CardDescription>
              Our AI is carefully reviewing the exam. This may take a moment.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {aiResults && (
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-1 bg-secondary/30">
            <CardHeader>
              <CardTitle>Overall Score</CardTitle>
              <CardDescription>
                Score for auto-graded questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-5xl font-bold">
                {aiResults.totalPointsAwarded}
                <span className="text-2xl text-muted-foreground">
                  /{aiResults.totalPointsPossible}
                </span>
              </p>
              <Progress value={scorePercentage} className="mt-4" />
            </CardContent>
          </Card>
          <Card className="md:col-span-2 bg-secondary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck /> AI-Generated Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{aiResults.summary}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Exam Questions</h2>
        </div>
        {exam.questions.map((question, index) => {
          const objectiveResult = aiResults?.objectiveResults.find(
            (r) => r.questionId === question.questionId
          );
          const flaggedResult = aiResults?.flaggedAnswers.find(
            (f) => f.questionId === question.questionId
          );

          return (
            <Card key={question.questionId} className="bg-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-start gap-4">
                  <span className="text-lg font-semibold text-primary">{index + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <p className="text-base font-medium">{question.questionText}</p>
                        <QuestionResultBadge question={question} aiResults={aiResults} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {question.pointsPossible} points
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <QuestionInput
                      question={question}
                      onAnswerChange={handleAnswerChange}
                      isSubmitted={isSubmitted}
                    />

                    {objectiveResult && !objectiveResult.isCorrect && (
                      <div className="grid gap-2">
                        <h4 className="font-semibold text-sm text-green-400">Correct Answer</h4>
                        <p className="text-sm p-3 bg-green-500/10 text-green-300 rounded-md">
                          {question.correctAnswer}
                        </p>
                      </div>
                    )}
                    {flaggedResult?.isPotentiallyIncorrect && (
                       <div className="grid gap-2">
                         <h4 className="font-semibold text-sm text-sky-400">Model Answer</h4>
                         <p className="text-sm p-3 bg-sky-500/10 text-sky-300 rounded-md">
                          {question.correctAnswer}
                         </p>
                       </div>
                    )}
                     {(objectiveResult || flaggedResult) && (
                      <div className="p-3 border-l-4 border-primary bg-primary/10 rounded-r-md">
                        <h4 className="font-semibold text-sm text-primary/90 mb-1">AI Feedback</h4>
                        <p className="text-sm text-primary/80">
                          {objectiveResult?.feedback || flaggedResult?.reason}
                        </p>
                      </div>
                     )}
              </CardContent>
            </Card>
          );
        })}
      </div>

       {!isSubmitted && (
        <div className="flex justify-center mt-8">
            <Button onClick={handleGradeExam} disabled={isLoading} size="lg">
            {isLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4" />
            )}
            {aiResults ? 'Re-analyze with AI' : 'Analyze with AI'}
            </Button>
        </div>
      )}
    </div>
  );
}
