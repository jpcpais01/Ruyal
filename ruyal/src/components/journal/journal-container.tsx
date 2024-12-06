"use client"

import { useState, useEffect } from "react"
import { BookOpen, Plus, FileText, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { analyzeDream } from "../chat/chat-container"

// Define a type for journal entries
interface DreamAnalysis {
  id: string;
  content: string;
  timestamp: Date;
  type: 'interpretation' | 'symbols' | 'advice';
}

type JournalEntry = {
  id: string;
  title: string;
  content: string;
  date: Date;
  lucidityLevel: number;
  mood: 'Very Negative' | 'Negative' | 'Neutral' | 'Positive' | 'Very Positive';
  clarity: number;
  tags: string[];
  recurring: boolean;
  analysis: DreamAnalysis[];
  showInJournal: boolean;
}

const MOODS = ['Very Negative', 'Negative', 'Neutral', 'Positive', 'Very Positive'] as const;

export function JournalContainer() {
  // State for managing journal entries
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('journalEntries');
      if (saved) {
        const entries = JSON.parse(saved);
        // Convert date strings back to Date objects and add default values for new fields
        return entries.map((entry: any) => ({
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
      return [];
    }
    return [];
  });

  // Save to localStorage whenever entries change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
    }
  }, [journalEntries]);

  // Listen for updates from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'journalEntries' && e.newValue) {
        try {
          const parsedEntries = JSON.parse(e.newValue);
          setJournalEntries(parsedEntries.map((entry: any) => ({
            ...entry,
            date: new Date(entry.date),
            analysis: (entry.analysis ?? []).map((analysis: any) => ({
              ...analysis,
              timestamp: new Date(analysis.timestamp)
            }))
          })));
        } catch (error) {
          console.error('Error parsing journal entries:', error);
        }
      }
    };

    const handleEntriesUpdated = (e: CustomEvent<{ entries: any[] }>) => {
      if (e.detail && e.detail.entries) {
        setJournalEntries(e.detail.entries.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          analysis: (entry.analysis ?? []).map((analysis: any) => ({
            ...analysis,
            timestamp: new Date(analysis.timestamp)
          }))
        })));
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

  // State for new entry dialog
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // State for new entry being created
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    lucidityLevel: 1,
    mood: 'Neutral' as JournalEntry['mood'],
    clarity: 1,
    tags: [] as string[],
    recurring: false,
    analysis: [] as DreamAnalysis[],
    showInJournal: true
  });

  // State for tag input
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!newEntry.tags.includes(tagInput.trim())) {
        setNewEntry({
          ...newEntry,
          tags: [...newEntry.tags, tagInput.trim()]
        });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewEntry({
      ...newEntry,
      tags: newEntry.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSave = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      return;
    }

    const entry: JournalEntry = {
      id: Date.now().toString(),
      ...newEntry,
      date: new Date(),
      showInJournal: true
    };

    const entries = [entry, ...journalEntries];
    setJournalEntries(entries);
    localStorage.setItem('journalEntries', JSON.stringify(entries));
    
    // Dispatch custom event for real-time updates
    const event = new CustomEvent('journalEntriesUpdated', { 
      detail: { entries }
    });
    window.dispatchEvent(event);

    setNewEntry({
      title: '',
      content: '',
      lucidityLevel: 1,
      mood: 'Neutral',
      clarity: 1,
      tags: [],
      recurring: false,
      analysis: []
    });
    setOpen(false);
  };

  // Function to delete an entry from journal view
  const handleDeleteEntry = (id: string) => {
    const updatedEntries = journalEntries.map(entry => 
      entry.id === id 
        ? { ...entry, showInJournal: false }
        : entry
    );
    setJournalEntries(updatedEntries);
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    
    // Dispatch custom event for real-time updates
    const event = new CustomEvent('journalEntriesUpdated', { 
      detail: { entries: updatedEntries }
    });
    window.dispatchEvent(event);
  }

  // Add state for selected entry and dialog
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleEntryClick = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setViewDialogOpen(true);
  };

  // Filter and sort entries
  const filteredAndSortedEntries = journalEntries
    .filter(entry => entry.showInJournal)
    .filter(entry => 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' 
          ? b.date.getTime() - a.date.getTime()
          : a.date.getTime() - b.date.getTime();
      }
      return sortOrder === 'desc'
        ? b.title.localeCompare(a.title)
        : a.title.localeCompare(b.title);
    });

  return (
    <div className="h-full flex flex-col gap-4 relative p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 flex items-center justify-center gap-3 text-foreground">
          <BookOpen className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" />
          Dream Journal
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mb-4">
          Record, reflect, and explore the depths of your subconscious mind.
        </p>
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200 mb-6"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Record New Dream
        </Button>
      </div>

      {/* Search and Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2 px-2 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search dreams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <select
            className="px-2 py-1.5 rounded-md border bg-background text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
          </select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
            className="h-8 w-8"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Dream Entries Grid */}
      <div className="flex-1 overflow-y-auto space-y-4 px-2">
        {filteredAndSortedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center text-muted-foreground">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {searchQuery ? 'No dreams match your search' : 'No dreams recorded yet'}
            </p>
            <p className="text-sm mt-2">
              {searchQuery ? 'Try adjusting your search terms' : 'Click "Record New Dream" to start recording your dreams'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedEntries.map(entry => (
              <div 
                key={entry.id} 
                className="group bg-muted hover:bg-accent hover:text-accent-foreground p-4 rounded-lg transition-all duration-200 cursor-pointer relative"
                onClick={() => handleEntryClick(entry)}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-8">
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to remove this dream from your journal? It will still be available in the history.')) {
                          handleDeleteEntry(entry.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                    onClick={() => analyzeDream(entry.content, entry.id)}
                  >
                    Analyse
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Entry Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Record New Dream</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
            <Input 
              placeholder="Dream Title" 
              value={newEntry.title}
              onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
              className="w-full text-lg"
            />
            <Textarea 
              placeholder="Describe your dream in detail..." 
              value={newEntry.content}
              onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
              className="min-h-[200px] w-full resize-y text-base"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lucidity Level</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={newEntry.lucidityLevel}
                    onChange={(e) => setNewEntry({...newEntry, lucidityLevel: Number(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-sm w-8 text-center">{newEntry.lucidityLevel}/5</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dream Clarity</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={newEntry.clarity}
                    onChange={(e) => setNewEntry({...newEntry, clarity: Number(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-sm w-8 text-center">{newEntry.clarity}/5</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dream Mood</label>
              <select
                value={newEntry.mood}
                onChange={(e) => setNewEntry({...newEntry, mood: e.target.value as JournalEntry['mood']})}
                className="w-full rounded-md border bg-background px-3 py-2"
              >
                {MOODS.map(mood => (
                  <option key={mood} value={mood}>{mood}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dream Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newEntry.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button 
                      onClick={() => removeTag(tag)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={newEntry.recurring}
                onChange={(e) => setNewEntry({...newEntry, recurring: e.target.checked})}
                className="rounded border-gray-300"
              />
              <label htmlFor="recurring" className="text-sm font-medium">
                This is a recurring dream
              </label>
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full py-6 text-lg font-semibold mt-4"
              disabled={!newEntry.title.trim() || !newEntry.content.trim()}
            >
              Save Dream Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Entry Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[90vw] max-w-2xl mx-auto max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle className="text-2xl font-bold mb-2 break-words">
              {selectedEntry?.title}
            </DialogTitle>
            <div className="text-sm text-muted-foreground border-b pb-4">
              {selectedEntry?.date.toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </DialogHeader>
          <div className="mt-4 flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
                {selectedEntry?.content}
              </p>
            </div>
          </div>
          <div className="flex-none pt-4 mt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
