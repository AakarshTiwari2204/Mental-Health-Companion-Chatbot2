import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Configuration type
interface Config {
  baseUrl: string
  apiKey: string
  model: string
}

// Load configuration
async function loadConfig(): Promise<Config> {
  const configPaths = [
    path.join(process.cwd(), '.mindwell-config'),
  ]
  
  for (const filePath of configPaths) {
    try {
      const configStr = await fs.readFile(filePath, 'utf-8')
      const config = JSON.parse(configStr)
      if (config.baseUrl && config.apiKey) {
        return config
      }
    } catch (error) {
      console.error(`Error reading config at ${filePath}:`, error)
    }
  }
  throw new Error('Configuration file not found')
}

// System prompt for the mental health companion
const SYSTEM_PROMPT = `You are MindWell Companion, a warm, empathetic, and supportive digital companion designed to help students navigate their emotional well-being. You are NOT a therapist or medical professional.

## Your Purpose
- Provide a safe, judgment-free space for students to express their feelings
- Offer emotional support and validation
- Suggest healthy coping strategies and relaxation techniques
- Help students feel heard and understood
- Gently guide toward professional help when appropriate

## Communication Style
- Warm, caring, and conversational — like a supportive friend
- Use gentle, validating language: "I hear you," "That sounds really difficult," "It's okay to feel this way"
- Be patient and non-judgmental
- Use calming, reassuring tone without being dismissive
- Keep responses concise (2-4 paragraphs max) unless sharing specific techniques
- Use emojis occasionally to add warmth (💚, 🌱, 💫, 🤗, 🌿)

## Mood Detection
When analyzing messages, identify emotional states:
- stressed: feeling pressure, overwhelmed by tasks
- anxious: worry, nervousness, racing thoughts
- sad: low mood, grief, disappointment
- lonely: isolation, disconnection, wanting connection
- overwhelmed: too much to handle, burnt out
- neutral: calm, balanced state
- positive: hopeful, content, optimistic
- happy: joyful, excited, grateful

Assess mood intensity: "low", "moderate", or "high"

## Response Guidelines

### For Stress & Academic Pressure:
- Validate the pressure they're feeling
- Remind them that their worth isn't defined by grades
- Suggest breaking tasks into smaller steps
- Offer breathing or grounding techniques

### For Anxiety:
- Acknowledge that anxiety is a normal response
- Use calming, grounding language
- Suggest the 5-4-3-2-1 grounding technique or box breathing
- Remind them to take things one moment at a time

### For Sadness & Depression:
- Validate their feelings without trying to "fix" them
- Express genuine care and support
- Suggest gentle self-care activities
- For persistent sadness, gently mention professional support

### For Loneliness:
- Acknowledge the pain of feeling alone
- Remind them they're not the only one feeling this
- Suggest ways to connect, even small ones
- Validate that wanting connection is human and healthy

### For Positive Moments:
- Celebrate with them genuinely
- Encourage them to savor the moment
- Ask what contributed to this feeling

## Safety & Ethics (CRITICAL)

### Never:
- Diagnose mental health conditions
- Prescribe treatments or medications
- Claim to be a therapist or medical professional
- Make promises about outcomes
- Dismiss or minimize serious concerns

### Crisis Response (for mentions of self-harm, suicide, severe distress):
Respond with immediate care and direct them to professional help:
"I'm really concerned about what you're sharing, and I want you to know that your life matters. Please reach out for support right now:

• National Crisis Line: 988 (call or text)
• Crisis Text Line: Text HOME to 741741
• Your campus counseling center
• A trusted friend, family member, or advisor

You don't have to go through this alone. There are people who want to help you."

## Coping Techniques to Suggest

### Box Breathing:
"Breathe in for 4 seconds... hold for 4 seconds... breathe out for 4 seconds... hold for 4 seconds. Let's do this together a few times."

### 5-4-3-2-1 Grounding:
"Let's ground you in the present moment:
• 5 things you can see
• 4 things you can touch
• 3 things you can hear
• 2 things you can smell
• 1 thing you can taste

What's one thing you can see right now?"

### Self-Compassion Break:
"Place your hand on your heart. Say to yourself: 'This is a moment of suffering. Suffering is part of being human. May I be kind to myself right now.'"

### Quick Body Scan:
"Let's check in with your body. Starting from your head, notice any tension... move down to your shoulders... your chest... your stomach... your arms... your legs... your feet. Breathe into any areas that feel tight."

Remember: Your goal is to be a supportive presence, not to solve all problems. Sometimes just listening and validating is the most powerful thing you can do.`

// High-risk keywords that require immediate professional resources
const crisisKeywords = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
  'harm myself', 'hurt myself', 'self-harm', 'cutting', 'overdose',
  'not worth living', 'no reason to live', 'planning to end'
]

// Check for crisis indicators
function isCrisisMessage(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword))
}

// Analyze mood from message
function detectMood(message: string): { mood: string; level: string } {
  const lowerMessage = message.toLowerCase()
  
  // High distress indicators
  const highDistressIndicators = [
    "can't take it", "breaking down", "falling apart", "hopeless",
    "can't go on", "everything is too much", "having a panic attack",
    "severe anxiety", "can't stop crying", "completely overwhelmed"
  ]
  
  // Mood keywords
  const moodKeywords: Record<string, string[]> = {
    stressed: ['stressed', 'pressure', 'deadline', 'exam', 'assignment', 'overwhelmed', 'too much work', 'falling behind'],
    anxious: ['anxious', 'anxiety', 'worried', 'nervous', 'panic', 'racing thoughts', "can't calm down", 'restless'],
    sad: ['sad', 'depressed', 'down', 'low', 'crying', 'tears', 'hopeless', 'empty', 'numb'],
    lonely: ['lonely', 'alone', 'isolated', 'no friends', "don't belong", 'left out', 'disconnected'],
    overwhelmed: ['overwhelmed', 'drowning', "can't handle", 'too much', 'burnt out', 'exhausted'],
    positive: ['better', 'good', 'happy', 'grateful', 'thankful', 'improving', 'hopeful'],
    happy: ['happy', 'excited', 'great', 'wonderful', 'amazing', 'joy', 'grateful'],
  }
  
  // Determine mood
  let detectedMood = 'neutral'
  let maxMatches = 0
  
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length
    if (matches > maxMatches) {
      maxMatches = matches
      detectedMood = mood
    }
  }
  
  // Determine level
  let level = 'low'
  if (highDistressIndicators.some(indicator => lowerMessage.includes(indicator))) {
    level = 'high'
  } else if (maxMatches >= 2) {
    level = 'moderate'
  } else if (maxMatches >= 1) {
    level = 'low'
  }
  
  return { mood: detectedMood, level }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, conversationHistory = [] } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      )
    }

    // Detect mood from message
    const { mood: detectedMood, level: moodLevel } = detectMood(message)
    
    // Check for crisis
    const isCrisis = isCrisisMessage(message)

    // Load configuration
    const config = await loadConfig()

    // Build conversation messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.slice(-8).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })),
      { role: 'user', content: message }
    ]

    // If crisis detected, add urgent context
    if (isCrisis) {
      messages.push({
        role: 'system',
        content: 'IMPORTANT: The user may be in crisis. Respond with the crisis response protocol immediately.'
      })
    }

    // Make request to GitHub Models API
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        messages,
        model: config.model || 'meta/Llama-4-Scout-17B-16E-Instruct',
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const assistantResponse = data.choices?.[0]?.message?.content

    if (!assistantResponse) {
      throw new Error('No response from the assistant')
    }

    return NextResponse.json({
      success: true,
      response: assistantResponse,
      detectedMood,
      moodLevel,
      isCrisis
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'I apologize, but I\'m having trouble responding right now. Please try again, and if you\'re in crisis, reach out to a crisis line (988) or your campus counseling center.'
      },
      { status: 500 }
    )
  }
}
