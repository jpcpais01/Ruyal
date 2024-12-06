"use client"

import { useState, useEffect } from "react"
import { Clock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { analyzeDream } from "../chat/chat-container"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DreamAnalysis {
  id: string;
  content: string;
  timestamp: Date;
  type: 'interpretation' | 'symbols' | 'advice';
}

interface JournalEntry {
  id: string;
  content: string;
  date: Date;
  title: string;
  lucidityLevel: number;
  mood: 'Very Negative' | 'Negative' | 'Neutral' | 'Positive' | 'Very Positive';
  clarity: number;
  tags: string[];
  recurring: boolean;
  analysis: DreamAnalysis[];
  showInJournal: boolean;
}

interface HistoryContainerProps {
  onDreamSelect?: (dream: { id: string, content: string }) => void;
}

export function HistoryContainer({ onDreamSelect }: HistoryContainerProps) {
  const [historyEntries, setHistoryEntries] = useState<JournalEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('journalEntries');
      if (saved) {
        const parsedEntries = JSON.parse(saved);
        return parsedEntries.map((entry: any) => ({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          date: new Date(entry.date),
          lucidityLevel: entry.lucidityLevel ?? 1,
          mood: entry.mood ?? 'Neutral',
          clarity: entry.clarity ?? 1,
          tags: entry.tags ?? [],
          recurring: entry.recurring ?? false,
          analysis: (entry.analysis ?? []).map((analysis: any) => ({
            ...analysis,
            timestamp: new Date(analysis.timestamp)
          })),
          showInJournal: entry.showInJournal ?? true
        }));
      }
    }
    return [];
  });

  // State for viewing entry details
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  // Update entries when localStorage changes or custom event fires
  useEffect(() => {
    const updateEntries = (entries: any[]) => {
      setHistoryEntries(entries.map((entry: any) => ({
        id: entry.id,
        title: entry.title,
        content: entry.content,
        date: new Date(entry.date),
        lucidityLevel: entry.lucidityLevel ?? 1,
        mood: entry.mood ?? 'Neutral',
        clarity: entry.clarity ?? 1,
        tags: entry.tags ?? [],
        recurring: entry.recurring ?? false,
        analysis: (entry.analysis ?? []).map((analysis: any) => ({
          ...analysis,
          timestamp: new Date(analysis.timestamp)
        })),
        showInJournal: entry.showInJournal ?? true
      })));
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'journalEntries' && e.newValue) {
        try {
          const parsedEntries = JSON.parse(e.newValue);
          updateEntries(parsedEntries);
        } catch (error) {
          console.error('Error parsing journal entries:', error);
        }
      }
    };

    const handleEntriesUpdated = (e: CustomEvent<{ entries: any[] }>) => {
      if (e.detail && e.detail.entries) {
        updateEntries(e.detail.entries);
      }
    };

    // Listen for both storage and custom events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('journalEntriesUpdated', handleEntriesUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('journalEntriesUpdated', handleEntriesUpdated as EventListener);
    };
  }, []);

  const handleEntryClick = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setEditedContent(entry.content);
    setDialogOpen(true);
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (!selectedEntry) return;

    // Create updated entry with all the original properties
    const updatedEntry = {
      ...selectedEntry,
      content: editedContent
    };

    // Update the entries array
    const updatedEntries = historyEntries.map(entry => 
      entry.id === selectedEntry.id ? updatedEntry : entry
    );

    // Save to localStorage
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    
    // Update local state
    setHistoryEntries(updatedEntries);
    setSelectedEntry(updatedEntry);
    setIsEditing(false);

    // Dispatch update event with the full entries array
    const event = new CustomEvent('journalEntriesUpdated', {
      detail: { entries: updatedEntries }
    });
    window.dispatchEvent(event);
  };

  const handleAnalyze = (entry: JournalEntry) => {
    if (onDreamSelect) {
      onDreamSelect({ id: entry.id, content: entry.content });
    }
    analyzeDream(entry.content, entry.id);
  };

  const handleDeleteEntry = (entryId: string) => {
    // Remove the entry from the array
    const updatedEntries = historyEntries.filter(entry => entry.id !== entryId);
    
    // Update localStorage
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    
    // Update local state
    setHistoryEntries(updatedEntries);
    
    // Close dialog if the deleted entry was being viewed
    if (selectedEntry?.id === entryId) {
      setDialogOpen(false);
    }

    // Dispatch update event
    const event = new CustomEvent('journalEntriesUpdated', {
      detail: { entries: updatedEntries }
    });
    window.dispatchEvent(event);
  };

  const handleDeleteAnalysis = (dreamId: string, analysisId: string) => {
    const updatedEntries = historyEntries.map(entry => {
      if (entry.id === dreamId) {
        return {
          ...entry,
          analysis: entry.analysis.filter(a => a.id !== analysisId)
        };
      }
      return entry;
    });

    // Update localStorage
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    
    // Update local state
    setHistoryEntries(updatedEntries);
    
    // If we're viewing this entry, update it
    if (selectedEntry?.id === dreamId) {
      setSelectedEntry({
        ...selectedEntry,
        analysis: selectedEntry.analysis.filter(a => a.id !== analysisId)
      });
    }

    // Dispatch update event
    const event = new CustomEvent('journalEntriesUpdated', {
      detail: { entries: updatedEntries }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="h-full flex flex-col gap-4 relative p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex-none">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-2 mb-4">
          <Clock className="h-6 w-6 md:h-8 md:w-8" />
          Dream History
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 px-2">
        {historyEntries.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No dream entries yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historyEntries.map((entry) => (
              <div
                key={entry.id}
                className="group bg-muted hover:bg-accent hover:text-accent-foreground p-4 rounded-lg transition-all duration-200 cursor-pointer relative"
                onClick={() => handleEntryClick(entry)}
              >
                <div className="absolute top-2 right-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this dream? This action cannot be undone.')) {
                        handleDeleteEntry(entry.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 pr-8">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg line-clamp-1 flex items-center gap-2">
                        {entry.title}
                        {entry.recurring && (
                          <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                            Recurring
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs bg-background/50 px-2 py-1 rounded-full">
                          {entry.date.toLocaleDateString()}
                        </span>
                        <span className="text-xs bg-background/50 px-2 py-1 rounded-full">
                          Lucidity: {entry.lucidityLevel}/5
                        </span>
                        <span className="text-xs bg-background/50 px-2 py-1 rounded-full">
                          Clarity: {entry.clarity}/5
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          entry.mood === 'Very Positive' || entry.mood === 'Positive'
                            ? 'bg-green-500/10 text-green-600'
                            : entry.mood === 'Neutral'
                            ? 'bg-background/50'
                            : 'bg-red-500/10 text-red-600'
                        }`}>
                          {entry.mood}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground line-clamp-3 text-sm mb-2">
                    {entry.content}
                  </p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map(tag => (
                        <span 
                          key={tag}
                          className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div 
                  className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAnalyze(entry);
                    }}
                  >
                    Analyse
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedEntry?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col h-full gap-4 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Dream Content</h3>
                    <div className="flex gap-2">
                      {selectedEntry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this dream? This action cannot be undone.')) {
                              handleDeleteEntry(selectedEntry.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditing(false);
                              setEditedContent(selectedEntry?.content || "");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <textarea
                      className="w-full h-[200px] p-3 rounded-md border bg-background"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                    />
                  ) : (
                    <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
                      {selectedEntry?.content}
                    </div>
                  )}
                </div>
                {/* Dream Analysis */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-1 bg-blue-500 rounded-full"/>
                      <h4 className="font-semibold text-lg">Dream Analysis</h4>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleAnalyze(selectedEntry!);
                        setDialogOpen(false);
                      }}
                    >
                      New Analysis
                    </Button>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 min-h-[200px]">
                    {selectedEntry && selectedEntry.analysis && selectedEntry.analysis.length > 0 ? (
                      <div className="space-y-4">
                        {selectedEntry.analysis.map((analysis) => (
                          <div key={analysis.id} className="space-y-2">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)}
                                </span>
                                <span>
                                  {analysis.timestamp.toLocaleDateString()}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this interpretation? This action cannot be undone.')) {
                                    handleDeleteAnalysis(selectedEntry.id, analysis.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap pl-2 border-l-2 border-blue-500/20">
                              {analysis.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No analysis yet. Click "New Analysis" to analyze this dream.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
