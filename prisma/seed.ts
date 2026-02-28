import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed Coping Techniques
  const copingTechniques = [
    {
      name: 'Box Breathing',
      category: 'breathing',
      description: 'A powerful calming technique used by Navy SEALs to manage stress',
      instructions: '1. Breathe in slowly for 4 seconds\n2. Hold your breath for 4 seconds\n3. Exhale slowly for 4 seconds\n4. Hold empty for 4 seconds\n5. Repeat 4 times',
      duration: 4,
      icon: 'wind',
      isActive: true,
    },
    {
      name: '5-4-3-2-1 Grounding',
      category: 'grounding',
      description: 'Connect with your present surroundings to reduce anxiety',
      instructions: '1. Name 5 things you can see\n2. Name 4 things you can touch\n3. Name 3 things you can hear\n4. Name 2 things you can smell\n5. Name 1 thing you can taste',
      duration: 5,
      icon: 'leaf',
      isActive: true,
    },
    {
      name: 'Progressive Muscle Relaxation',
      category: 'mindfulness',
      description: 'Release physical tension by systematically relaxing muscle groups',
      instructions: '1. Start with your feet - tense for 5 seconds, then relax\n2. Move to calves, thighs, stomach, hands, arms, shoulders, face\n3. Notice the difference between tension and relaxation\n4. Breathe deeply throughout',
      duration: 10,
      icon: 'activity',
      isActive: true,
    },
    {
      name: 'Gratitude Journaling',
      category: 'journaling',
      description: 'Write down three good things to shift focus to the positive',
      instructions: '1. Think about your day\n2. Write down 3 things you are grateful for\n3. They can be small moments or big events\n4. Reflect on why each one matters to you',
      duration: 5,
      icon: 'book',
      isActive: true,
    },
    {
      name: 'Mindful Walk',
      category: 'mindfulness',
      description: 'Take a short walk while being fully present in the moment',
      instructions: '1. Walk at a comfortable pace\n2. Notice the sensation of your feet touching the ground\n3. Observe your surroundings without judgment\n4. If your mind wanders, gently return focus to walking',
      duration: 10,
      icon: 'footprints',
      isActive: true,
    },
    {
      name: 'Self-Compassion Break',
      category: 'mindfulness',
      description: 'Practice kindness toward yourself during difficult moments',
      instructions: '1. Place your hand on your heart\n2. Say: "This is a moment of suffering"\n3. Say: "Suffering is a part of life"\n4. Say: "May I be kind to myself in this moment"\n5. Take 3 deep breaths',
      duration: 3,
      icon: 'heart',
      isActive: true,
    },
    {
      name: '4-7-8 Breathing',
      category: 'breathing',
      description: 'A calming breath pattern that promotes relaxation and sleep',
      instructions: '1. Breathe in through your nose for 4 seconds\n2. Hold your breath for 7 seconds\n3. Exhale completely through your mouth for 8 seconds\n4. Repeat 4 times',
      duration: 5,
      icon: 'wind',
      isActive: true,
    },
    {
      name: 'Quick Body Scan',
      category: 'grounding',
      description: 'Check in with your body and release tension',
      instructions: '1. Close your eyes and take a deep breath\n2. Scan from head to toe, noticing any tension\n3. Breathe into areas that feel tight\n4. Visualize tension melting away with each exhale',
      duration: 5,
      icon: 'scan',
      isActive: true,
    },
  ]

  // Seed Resources
  const resources = [
    {
      title: 'National Crisis Hotline',
      description: 'Free, confidential support available 24/7 for anyone in distress',
      type: 'contact',
      url: 'tel:988',
      category: 'crisis',
      isEmergency: true,
      isActive: true,
    },
    {
      title: 'Crisis Text Line',
      description: 'Text HOME to 741741 to connect with a trained crisis counselor',
      type: 'contact',
      url: 'sms:741741',
      category: 'crisis',
      isEmergency: true,
      isActive: true,
    },
    {
      title: 'Campus Counseling Center',
      description: 'Most colleges offer free or low-cost counseling services for students',
      type: 'contact',
      category: 'counseling',
      isEmergency: false,
      isActive: true,
    },
    {
      title: 'Anxiety Management Tips',
      description: 'Practical strategies for managing everyday anxiety and worry',
      type: 'article',
      category: 'anxiety',
      isEmergency: false,
      isActive: true,
    },
    {
      title: 'Sleep Hygiene Guide',
      description: 'Tips for improving sleep quality, especially during stressful periods',
      type: 'article',
      category: 'sleep',
      isEmergency: false,
      isActive: true,
    },
    {
      title: 'Study Stress Relief',
      description: 'Techniques for managing academic pressure and exam stress',
      type: 'article',
      category: 'academic',
      isEmergency: false,
      isActive: true,
    },
    {
      title: 'Mindfulness for Beginners',
      description: 'Introduction to mindfulness meditation practices',
      type: 'video',
      category: 'mindfulness',
      isEmergency: false,
      isActive: true,
    },
    {
      title: 'Building Social Connections',
      description: 'Ways to combat loneliness and build meaningful relationships',
      type: 'article',
      category: 'loneliness',
      isEmergency: false,
      isActive: true,
    },
  ]

  // Clear existing data
  await prisma.moodRecord.deleteMany()
  await prisma.message.deleteMany()
  await prisma.chatSession.deleteMany()
  await prisma.copingTechnique.deleteMany()
  await prisma.resource.deleteMany()

  // Insert coping techniques
  for (const technique of copingTechniques) {
    await prisma.copingTechnique.create({ data: technique })
  }

  // Insert resources
  for (const resource of resources) {
    await prisma.resource.create({ data: resource })
  }

  console.log('Seed data inserted successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
