
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BrainCircuit, BookOpenCheck, LogOut, Settings, History, Facebook, Twitter, Instagram, MessageCircle, PenTool, BotMessageSquare, MessageSquare, GalleryHorizontal, Menu } from 'lucide-react';
import GethubLogo from '@/components/gethub-logo';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { LoaderCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { getGalleryItems } from '@/services/gallery-service';
import { GalleryItem } from '@/lib/types';
import { format } from 'date-fns';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

function GalleryPageContent() {
  const { user, loading, logout } = useAuth();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);

  useEffect(() => {
    getGalleryItems()
      .then(items => {
        setGalleryItems(items);
      })
      .catch(err => {
        console.error("Failed to fetch gallery items:", err);
      })
      .finally(() => {
        setIsLoadingGallery(false);
      });
  }, []);

  const PageHeader = () => (
     <header className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Link href="/" className="flex items-center gap-2">
            <GethubLogo className="w-8 h-8 text-primary" width={32} height={32}/>
            <span className="text-xl font-bold">Gethub</span>
        </Link>
        <div className="hidden md:flex items-center gap-2">
            {user ? (
                 <div className="flex items-center gap-4">
                     <Button variant="ghost" asChild>
                        <Link href="/">
                            Home
                        </Link>
                    </Button>
                     <Button variant="ghost" asChild>
                        <Link href="/history">
                            <History className="mr-2"/>
                            History
                        </Link>
                    </Button>
                    <div className="h-6 w-px bg-white/10"></div>
                     <Button variant="ghost" size="icon" asChild>
                        <Link href="/settings">
                            <Settings />
                            <span className="sr-only">Settings</span>
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={logout}>
                        <LogOut />
                        <span className="sr-only">Logout</span>
                    </Button>
                   <Avatar>
                      <AvatarImage src={user.photoURL ?? 'https://placehold.co/100x100.png'} alt={user.displayName || 'User'} data-ai-hint="student portrait" />
                      <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                </div>
            ) : (
                <>
                <Button variant="ghost" asChild>
                  <Link href="/">Home</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
                </>
            )}
        </div>
         <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    <SheetHeader>
                        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    </SheetHeader>
                     <div className="flex flex-col gap-4 p-4">
                        {user ? (
                            <>
                                 <Button variant="ghost" asChild className="justify-start">
                                    <Link href="/">Home</Link>
                                </Button>
                                <Button variant="ghost" asChild className="justify-start">
                                    <Link href="/history">
                                        <History className="mr-2"/>
                                        History
                                    </Link>
                                </Button>
                                <Button variant="ghost" asChild className="justify-start">
                                    <Link href="/settings">
                                        <Settings className="mr-2"/>
                                        Settings
                                    </Link>
                                </Button>
                                <Button variant="ghost" onClick={logout} className="justify-start">
                                    <LogOut className="mr-2" />
                                    <span>Logout</span>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" asChild className="justify-start">
                                    <Link href="/">Home</Link>
                                </Button>
                                <Button variant="ghost" asChild className="justify-start">
                                    <Link href="/login">Login</Link>
                                </Button>
                                <Button asChild className="w-full">
                                    <Link href="/register">Get Started</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    </header>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
        <PageHeader/>
        <main className="flex-1">
            <section className="text-center py-16 md:py-20 px-4 border-b border-white/10 bg-secondary/30">
                 <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Student Gallery</h1>
                 <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                    Celebrating the success of our students who have achieved their dreams.
                 </p>
            </section>
            
            <section id="gallery-content" className="py-20 px-4">
                {isLoadingGallery ? (
                     <div className="flex h-full items-center justify-center">
                        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
                    </div>
                ) : galleryItems.length === 0 ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold">No achievements yet.</h2>
                        <p className="text-muted-foreground mt-2">Check back soon to see our students' success stories!</p>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {galleryItems.map(item => (
                            <Card key={item.id} className="flex flex-col bg-secondary/50 border-white/10 overflow-hidden group">
                                <CardHeader className="p-0 overflow-hidden">
                                    <Image
                                        src={item.photoURL}
                                        alt={`Photo of ${item.studentName}`}
                                        width={400}
                                        height={400}
                                        className="object-cover w-full h-80 transition-transform duration-300 group-hover:scale-105"
                                    />
                                </CardHeader>
                                <CardContent className="p-6 flex-grow">
                                    <CardTitle>{item.studentName}</CardTitle>
                                    <CardDescription className="mt-2 text-base text-foreground/80">{item.achievement}</CardDescription>
                                </CardContent>
                                <CardFooter>
                                     <p className="text-xs text-muted-foreground">{format(item.createdAt.toDate(), "PPP")}</p>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </main>
        <footer className="p-6 border-t border-white/10 text-center">
          <div className="max-w-7xl mx-auto grid gap-6">
            <div>
              <p className="font-semibold">Gethub</p>
              <p className="text-sm text-muted-foreground">Kakinada, Andhrapradesh-533001</p>
            </div>
             <div className="flex justify-center gap-4">
                <Link href="#" className="text-muted-foreground hover:text-primary"><MessageSquare /></Link>
                <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook /></Link>
                <Link href="#" className="text-muted-foreground hover:text-primary"><Twitter /></Link>
                <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram /></Link>
             </div>
             <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Gethub. All rights reserved.</p>
          </div>
        </footer>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <AuthProvider>
      <GalleryPageContent />
    </AuthProvider>
  );
}
