"use client"

import { useEffect, useState, useCallback } from "react"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavButton } from "@/components/nav-button"
import { ChatContainer } from "@/components/chat/chat-container"
import { JournalContainer } from "@/components/journal/journal-container"
import { HistoryContainer } from "@/components/history/history-container"
import useEmblaCarousel from "embla-carousel-react"
import { Brain, BookOpen, Clock } from "lucide-react"
import { JournalDialog } from "@/components/journal/journal-dialog"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme } = useTheme()
  const [currentSlide, setCurrentSlide] = useState(1)  // Start with Journal page
  const [journalOpen, setJournalOpen] = useState(false)
  const [selectedDream, setSelectedDream] = useState<{ id: string, content: string } | null>(null)
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    axis: "x",
    dragFree: false,
    startIndex: 1  // Start with Journal page
  })

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index)
    setCurrentSlide(index)
  }, [emblaApi])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.altKey) {
        switch(event.key) {
          case '1':
            scrollTo(0); // AI Analysis
            break;
          case '2':
            scrollTo(1); // Journal
            break;
          case '3':
            scrollTo(2); // History
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [scrollTo]);

  useEffect(() => {
    const handleError = (event: CustomEvent<{ message: string }>) => {
      setError(event.detail.message);
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    };

    window.addEventListener('appError', handleError as EventListener);
    return () => window.removeEventListener('appError', handleError as EventListener);
  }, []);

  useEffect(() => {
    const handleAnalyzeDream = (event: CustomEvent<{ content: string, id: string }>) => {
      const { content, id } = event.detail;
      setSelectedDream({ id, content });
    };

    window.addEventListener('analyzeDream', handleAnalyzeDream as EventListener);
    return () => {
      window.removeEventListener('analyzeDream', handleAnalyzeDream as EventListener);
    };
  }, []);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(1) // Ensure we start at Journal page
    }
  }, [emblaApi])

  useEffect(() => {
    const handleSwitchToAnalysisTab = () => {
      scrollTo(0); // AI Analysis is at index 0
    };

    window.addEventListener('switchToAnalysisTab', handleSwitchToAnalysisTab);
    return () => {
      window.removeEventListener('switchToAnalysisTab', handleSwitchToAnalysisTab);
    };
  }, [scrollTo]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCurrentSlide(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    setMounted(true)
  }, [])

  const slides = [
    { 
      component: () => <ChatContainer 
        dreamId={selectedDream?.id} 
        dreamContent={selectedDream?.content} 
      />, 
      icon: Brain, 
      label: "AI Analysis" 
    },
    { component: () => <JournalContainer />, icon: BookOpen, label: "Journal" },
    { 
      component: () => <HistoryContainer onDreamSelect={(dream) => {
        setSelectedDream(dream);
        scrollTo(0); // Switch to chat tab (index 0)
      }} />, 
      icon: Clock, 
      label: "History" 
    }
  ]

  if (!mounted) return null

  return (
    <div className="flex flex-col h-screen bg-background">
      {error && (
        <div className="bg-destructive text-destructive-foreground p-2 rounded-md mb-4 animate-in fade-in slide-in-from-top">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      <header className="flex-none h-16 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center h-full relative px-4">
          <div className="absolute left-4">
            <div className="w-10" /> {/* Same width as theme toggle */}
          </div>
          <div className="flex-1 flex justify-center">
            <div className="font-semibold text-primary">
              Ruyal
            </div>
          </div>
          <div className="absolute right-4">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="embla h-full" ref={emblaRef}>
          <div className="embla__container h-full">
            {slides.map((slide, index) => (
              <div key={index} className="embla__slide flex-[0_0_100%] min-w-0 h-full relative flex items-center justify-center">
                {slide.component()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation - fixed height */}
      <div className="flex-none h-16 px-4 flex gap-2 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {slides.map((slide, index) => (
          <NavButton
            key={index}
            isActive={currentSlide === index}
            onClick={() => scrollTo(index)}
            label={slide.label}
            icon={slide.icon}
          />
        ))}
      </div>
      <JournalDialog 
        open={journalOpen} 
        onOpenChange={setJournalOpen}
      />
    </div>
  )
}
