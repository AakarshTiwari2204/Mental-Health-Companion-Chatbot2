'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  Heart, 
  Send, 
  Leaf, 
  Wind, 
  Moon, 
  Sun, 
  BookOpen, 
  Clock,
  Sparkles,
  AlertCircle,
  ChevronDown,
  X,
  Menu,
  Brain,
  Palette,
  HandHeart,
  RefreshCw,
  Activity,
  TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Types
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  mood?: string
  moodLevel?: string
}

interface MoodEntry {
  mood: string
  level: string
  timestamp: Date
}

interface MoodState {
  mood: string
  level: string
  emoji: string
  color: string
}

// Mood configurations
const moodConfig: Record<string, { emoji: string; color: string; label: string }> = {
  stressed: { emoji: '😰', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', label: 'Stressed' },
  anxious: { emoji: '😟', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: 'Anxious' },
  sad: { emoji: '😢', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Sad' },
  lonely: { emoji: '🥺', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300', label: 'Lonely' },
  neutral: { emoji: '😐', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', label: 'Neutral' },
  positive: { emoji: '😊', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'Positive' },
  happy: { emoji: '😄', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Happy' },
  overwhelmed: { emoji: '😩', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Overwhelmed' },
}

// Coping techniques
const copingTechniques = [
  {
    id: 1,
    name: 'Box Breathing',
    category: 'breathing',
    description: 'A calming technique used by Navy SEALs',
    duration: 4,
    icon: Wind,
    instructions: 'Breathe in for 4 seconds, hold for 4 seconds, breathe out for 4 seconds, hold for 4 seconds. Repeat.',
  },
  {
    id: 2,
    name: '5-4-3-2-1 Grounding',
    category: 'grounding',
    description: 'Connect with your surroundings',
    duration: 5,
    icon: Leaf,
    instructions: 'Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste.',
  },
  {
    id: 3,
    name: 'Quick Body Scan',
    category: 'mindfulness',
    description: 'Release tension from head to toe',
    duration: 5,
    icon: Brain,
    instructions: 'Starting from your head, notice any tension. Move down to shoulders, arms, chest, stomach, legs, and feet. Breathe into any tight areas.',
  },
  {
    id: 4,
    name: 'Gratitude Journal',
    category: 'journaling',
    description: 'Three good things from today',
    duration: 3,
    icon: BookOpen,
    instructions: 'Write down three things you\'re grateful for today. They can be small moments or big victories.',
  },
  {
    id: 5,
    name: 'Peaceful Visualization',
    category: 'mindfulness',
    description: 'Mental escape to a calm place',
    duration: 5,
    icon: Palette,
    instructions: 'Close your eyes and imagine a peaceful place. Notice the colors, sounds, and feelings. Stay there for a few breaths.',
  },
  {
    id: 6,
    name: 'Self-Compassion Break',
    category: 'mindfulness',
    description: 'Be kind to yourself',
    duration: 3,
    icon: HandHeart,
    instructions: 'Place your hand on your heart. Say: "This is a moment of suffering. Suffering is part of life. May I be kind to myself in this moment."',
  },
]

// Quick prompts for users
const quickPrompts = [
  "I'm feeling overwhelmed with schoolwork",
  "I can't stop worrying about exams",
  "I feel lonely at college",
  "I'm having trouble sleeping",
  "I just need someone to talk to",
  "Show me a breathing exercise",
]

// Session storage helpers
const STORAGE_KEY = 'mindwell-chat-session'
const MOOD_HISTORY_KEY = 'mindwell-mood-history'

function saveSession(messages: Message[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }
}

function loadSession(): Message[] | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      } catch {
        return null
      }
    }
  }
  return null
}

function saveMoodHistory(history: MoodEntry[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(MOOD_HISTORY_KEY, JSON.stringify(history))
  }
}

function loadMoodHistory(): MoodEntry[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(MOOD_HISTORY_KEY)
    if (saved) {
      try {
        return JSON.parse(saved).map((e: MoodEntry) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }))
      } catch {
        return []
      }
    }
  }
  return []
}

export default function MindWellCompanion() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentMood, setCurrentMood] = useState<MoodState | null>(null)
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPrompts, setShowPrompts] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load saved session on mount
  useEffect(() => {
    const savedMessages = loadSession()
    const savedMoodHistory = loadMoodHistory()
    
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages)
      setShowPrompts(false)
      // Get the latest mood from messages
      const lastMoodMsg = [...savedMessages].reverse().find(m => m.mood)
      if (lastMoodMsg && lastMoodMsg.mood && moodConfig[lastMoodMsg.mood]) {
        setCurrentMood({
          mood: lastMoodMsg.mood,
          level: lastMoodMsg.moodLevel || 'moderate',
          emoji: moodConfig[lastMoodMsg.mood].emoji,
          color: moodConfig[lastMoodMsg.mood].color,
        })
      }
    } else {
      // Initial welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm your MindWell Companion. 💚

I'm here to listen, support, and help you navigate through your feelings. Whether you're dealing with academic stress, feeling anxious, or just need someone to talk to, I'm here for you.

Remember: This is a safe, judgment-free space. You can share as much or as little as you'd like.

How are you feeling today?`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
    
    setMoodHistory(savedMoodHistory)
    setIsLoaded(true)
  }, [])

  // Save session whenever messages change
  useEffect(() => {
    if (isLoaded && messages.length > 0) {
      saveSession(messages)
    }
  }, [messages, isLoaded])

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setShowPrompts(false)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          mood: data.detectedMood,
          moodLevel: data.moodLevel,
        }

        setMessages(prev => [...prev, assistantMessage])

        if (data.detectedMood && moodConfig[data.detectedMood]) {
          const newMoodState = {
            mood: data.detectedMood,
            level: data.moodLevel || 'moderate',
            emoji: moodConfig[data.detectedMood].emoji,
            color: moodConfig[data.detectedMood].color,
          }
          setCurrentMood(newMoodState)
          
          // Add to mood history
          const newEntry: MoodEntry = {
            mood: data.detectedMood,
            level: data.moodLevel || 'moderate',
            timestamp: new Date(),
          }
          setMoodHistory(prev => {
            const updated = [...prev, newEntry].slice(-20) // Keep last 20 entries
            saveMoodHistory(updated)
            return updated
          })
        }
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment. Remember, if you're in crisis, please reach out to a trusted person or your campus counseling center.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearConversation = () => {
    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: `Starting a fresh conversation. 💚

I'm here whenever you're ready to talk. How are you feeling right now?`,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
    setCurrentMood(null)
    setShowPrompts(true)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Calculate mood statistics
  const getMoodStats = useCallback(() => {
    if (moodHistory.length === 0) return null
    
    const last24h = moodHistory.filter(e => {
      const diff = Date.now() - new Date(e.timestamp).getTime()
      return diff < 24 * 60 * 60 * 1000
    })
    
    const moodCounts: Record<string, number> = {}
    last24h.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
    })
    
    const mostCommon = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]
    
    const positiveMoods = ['positive', 'happy', 'neutral']
    const positiveCount = last24h.filter(e => positiveMoods.includes(e.mood)).length
    const positivePercentage = last24h.length > 0 
      ? Math.round((positiveCount / last24h.length) * 100) 
      : 50
    
    return {
      total: last24h.length,
      mostCommon: mostCommon ? mostCommon[0] : 'neutral',
      positivePercentage,
    }
  }, [moodHistory])

  const moodStats = getMoodStats()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-calm/80 to-calm flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg text-foreground">MindWell Companion</h1>
              <p className="text-xs text-muted-foreground">Your supportive wellness partner</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentMood && (
              <Badge variant="secondary" className={`${currentMood.color} border-0 hidden sm:inline-flex`}>
                <span className="mr-1">{currentMood.emoji}</span>
                Feeling {currentMood.mood}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Disclaimer Banner */}
          <div className="px-4 py-2 bg-muted/50 border-b">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>This is a supportive companion, not a professional counselor. If you&apos;re in crisis, please contact your campus counseling center or call 988.</span>
            </p>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 chat-scroll">
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card border shadow-sm rounded-bl-md'
                      }`}
                    >
                      {message.role === 'assistant' && message.mood && (
                        <div className="flex items-center gap-2 mb-2">
                          {moodConfig[message.mood] && (
                            <Badge variant="secondary" className={`text-xs ${moodConfig[message.mood].color} border-0`}>
                              {moodConfig[message.mood].emoji} {moodConfig[message.mood].label}
                            </Badge>
                          )}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-card border shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot" />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot" />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full typing-dot" />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Prompts */}
          {showPrompts && messages.length === 1 && (
            <div className="px-4 pb-2">
              <div className="max-w-3xl mx-auto">
                <p className="text-xs text-muted-foreground mb-2">Quick start:</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.slice(0, 3).map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1.5"
                      onClick={() => sendMessage(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="sticky bottom-0 border-t bg-card/80 backdrop-blur-sm p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Share what's on your mind..."
                  disabled={isLoading}
                  className="flex-1 rounded-full"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="rounded-full px-4"
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearConversation}
                  className="rounded-full"
                  title="Start new conversation"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Your conversations are private and stored locally on your device
              </p>
            </div>
          </div>
        </main>

        {/* Sidebar - Wellness Tools */}
        <aside
          className={`
            fixed lg:static inset-y-0 right-0 z-50 w-80 border-l bg-card
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex items-center justify-between lg:justify-center">
              <h2 className="font-semibold text-foreground">Wellness Tools</h2>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              {/* Mood Tracker */}
              {currentMood && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Current Mood
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${currentMood.color}`}>
                      <span className="text-xl">{currentMood.emoji}</span>
                      <span className="font-medium capitalize">{currentMood.mood}</span>
                      <span className="text-xs opacity-70">({currentMood.level})</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mood Statistics */}
              {moodStats && moodStats.total > 0 && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Wellbeing Trend (24h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Positive Moments</span>
                        <span className="font-medium">{moodStats.positivePercentage}%</span>
                      </div>
                      <Progress value={moodStats.positivePercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Based on {moodStats.total} check-in{moodStats.total !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Coping Techniques */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-nature" />
                  Quick Relief Techniques
                </h3>
                
                {copingTechniques.map((technique) => (
                  <Card 
                    key={technique.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => {
                      setInput(`Can you guide me through ${technique.name}?`)
                      inputRef.current?.focus()
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <technique.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground">{technique.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{technique.description}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{technique.duration} min</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Emergency Resources */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  Crisis Support
                </h3>
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardContent className="p-3">
                    <p className="text-xs text-foreground mb-2">
                      If you&apos;re in crisis or need immediate help:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="font-medium text-foreground">• National Crisis Line: 988</li>
                      <li>• Crisis Text Line: Text HOME to 741741</li>
                      <li>• Campus Counseling Center</li>
                      <li>• International Association for Suicide Prevention: iasp.info</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Tips Section */}
              <Separator className="my-4" />
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Daily Wellness Tips
                </h3>
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">
                      💧 Stay hydrated - drink water regularly<br/>
                      🚶 Take short walks between study sessions<br/>
                      😴 Aim for 7-9 hours of sleep<br/>
                      📱 Take breaks from social media
                    </p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>
        </aside>
      </div>

      {/* Footer - Sticky */}
      <footer className="border-t bg-card/50 py-3 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            MindWell Companion — A Student Mental Health Support Project by Aakarsh Tiwari
          </p>
        </div>
      </footer>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
