import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database setup...')

  // Create a sample center
  const center = await prisma.center.upsert({
    where: { id: 'center-001' },
    update: {},
    create: {
      id: 'center-001',
      name: 'MSK Rehabilitation Center',
      address: '123 Health Street, Medical District, City, State 12345',
      phone: '+1-555-0123',
      email: 'admin@rehabcenter.com',
      license: 'REHAB-2024-001',
    },
  })

  // Create sample physios (not linked to center initially)
  const physio1 = await prisma.physio.upsert({
    where: { id: 'physio-001' },
    update: {},
    create: {
      id: 'physio-001',
      firstName: 'Sarah',
      lastName: 'Johnson',
      license: 'PHYSIO-2024-001',
      specialization: 'Sports Rehabilitation',
      phone: '+1-555-0124',
      email: 'dr.sarah@rehabcenter.com',
      isActive: true
    },
  })

  const physio2 = await prisma.physio.upsert({
    where: { id: 'physio-002' },
    update: {},
    create: {
      id: 'physio-002',
      firstName: 'Michael',
      lastName: 'Chen',
      license: 'PHYSIO-2024-002',
      specialization: 'Neurological Rehabilitation',
      phone: '+1-555-0127',
      email: 'dr.michael@rehabcenter.com',
      isActive: true
    },
  })

  const physio3 = await prisma.physio.upsert({
    where: { id: 'physio-003' },
    update: {},
    create: {
      id: 'physio-003',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      license: 'PHYSIO-2024-003',
      specialization: 'Pediatric Rehabilitation',
      phone: '+1-555-0128',
      email: 'dr.emily@rehabcenter.com',
      isActive: true
    },
  })

  // Create sample nutritionists
  const nutritionist1 = await prisma.nutritionist.upsert({
    where: { id: 'nutritionist-001' },
    update: {},
    create: {
      id: 'nutritionist-001',
      firstName: 'Lisa',
      lastName: 'Anderson',
      license: 'NUTR-2024-001',
      specialization: 'Sports Nutrition',
      phone: '+1-555-0130',
      email: 'lisa.anderson@mskcare.com',
      isActive: true
    },
  })

  const nutritionist2 = await prisma.nutritionist.upsert({
    where: { id: 'nutritionist-002' },
    update: {},
    create: {
      id: 'nutritionist-002',
      firstName: 'David',
      lastName: 'Kim',
      license: 'NUTR-2024-002',
      specialization: 'Clinical Nutrition',
      phone: '+1-555-0131',
      email: 'david.kim@mskcare.com',
      isActive: true
    },
  })

  // Create a sample patient
  const patient = await prisma.patient.upsert({
    where: { id: 'patient-001' },
    update: {},
    create: {
      id: 'patient-001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1985-06-15'),
      gender: 'MALE',
      phone: '+1-555-0125',
      email: 'john.doe@example.com',
      address: '456 Patient Avenue, City, State 12345',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+1-555-0126',
      medicalHistory: 'Knee surgery in 2023',
      currentCondition: 'Post-operative knee rehabilitation',
      rehabGoals: 'Restore full range of motion and strength',
      physioId: physio1.id,
    },
  })

  // Create a sample exercise
  const exercise = await prisma.exercise.upsert({
    where: { id: 'exercise-001' },
    update: {},
    create: {
      id: 'exercise-001',
      name: 'Knee Extension',
      description: 'Strengthening exercise for knee rehabilitation',
      category: 'Lower Body',
      difficulty: 'BEGINNER',
      duration: 15,
      reps: 10,
      sets: 3,
      frequency: 'Daily',
      instructions: 'Sit with back straight, extend knee fully, hold for 3 seconds, return to starting position',
    },
  })

  // Create a sample prescription
  const prescription = await prisma.prescription.upsert({
    where: { id: 'prescription-001' },
    update: {},
    create: {
      id: 'prescription-001',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-01'),
      notes: 'Initial rehabilitation program for post-operative recovery',
      patientId: patient.id,
      physioId: physio1.id,
    },
  })

  // Create center-patient relationship
  await prisma.centerPatient.upsert({
    where: {
      centerId_patientId: {
        centerId: center.id,
        patientId: patient.id,
      },
    },
    update: {},
    create: {
      centerId: center.id,
      patientId: patient.id,
      isActive: true,
      notes: 'Initial patient registration',
    },
  })

  // Create center-physio relationship
  await prisma.centerPhysio.upsert({
    where: {
      centerId_physioId: {
        centerId: center.id,
        physioId: physio1.id,
      },
    },
    update: {},
    create: {
      centerId: center.id,
      physioId: physio1.id,
      isActive: true,
      notes: 'Primary physiotherapist',
    },
  })

  // Create sample appointments
  const appointment1 = await prisma.appointment.upsert({
    where: { id: 'appointment-001' },
    update: {},
    create: {
      id: 'appointment-001',
      title: 'Follow-up Consultation',
      description: 'Progress review and exercise plan adjustment',
      startTime: new Date('2024-02-15T10:00:00Z'),
      endTime: new Date('2024-02-15T11:00:00Z'),
      type: 'FOLLOW_UP',
      status: 'SCHEDULED',
      notes: 'Patient has shown good progress with knee extension exercises. Range of motion has improved from 45° to 85°. Continue with current exercise plan and add resistance training. Monitor for any pain or discomfort during exercises.',
      centerId: center.id,
      patientId: patient.id,
      physioId: physio1.id,
    },
  })

  const appointment2 = await prisma.appointment.upsert({
    where: { id: 'appointment-002' },
    update: {},
    create: {
      id: 'appointment-002',
      title: 'Initial Assessment',
      description: 'Comprehensive evaluation and treatment planning',
      startTime: new Date('2024-02-10T14:00:00Z'),
      endTime: new Date('2024-02-10T15:30:00Z'),
      type: 'ASSESSMENT',
      status: 'COMPLETED',
      notes: 'Initial assessment completed. Patient presents with post-operative knee stiffness and reduced range of motion. Pain level reported as 3/10. Recommended starting with gentle range of motion exercises and progressive strengthening program.',
      centerId: center.id,
      patientId: patient.id,
      physioId: physio1.id,
    },
  })

  const appointment3 = await prisma.appointment.upsert({
    where: { id: 'appointment-003' },
    update: {},
    create: {
      id: 'appointment-003',
      title: 'Progress Review',
      description: 'Monthly progress evaluation and plan adjustment',
      startTime: new Date('2024-03-01T09:00:00Z'),
      endTime: new Date('2024-03-01T10:00:00Z'),
      type: 'CONSULTATION',
      status: 'SCHEDULED',
      notes: 'Monthly progress review scheduled. Will assess current exercise adherence, pain levels, and functional improvements. May need to progress exercise difficulty based on current performance.',
      centerId: center.id,
      patientId: patient.id,
      physioId: physio1.id,
    },
  })

  // Create User records with hashed passwords for login
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create center admin user
  await prisma.user.upsert({
    where: { email: 'admin@rehabcenter.com' },
    update: {},
    create: {
      email: 'admin@rehabcenter.com',
      password: hashedPassword,
      role: 'ADMIN',
      centerId: center.id,
    },
  })

  // Create physio user
  await prisma.user.upsert({
    where: { email: 'dr.sarah@rehabcenter.com' },
    update: {},
    create: {
      email: 'dr.sarah@rehabcenter.com',
      password: hashedPassword,
      role: 'PHYSIO',
      physioId: physio1.id,
    },
  })

  // Create patient user
  await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      password: hashedPassword,
      role: 'PATIENT',
      patientId: patient.id,
    },
  })

  // Create nutritionist users
  await prisma.user.upsert({
    where: { email: 'lisa.anderson@mskcare.com' },
    update: {},
    create: {
      email: 'lisa.anderson@mskcare.com',
      password: hashedPassword,
      role: 'NUTRITIONIST',
      nutritionistId: nutritionist1.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'david.kim@mskcare.com' },
    update: {},
    create: {
      email: 'david.kim@mskcare.com',
      password: hashedPassword,
      role: 'NUTRITIONIST',
      nutritionistId: nutritionist2.id,
    },
  })

  // Create sample progress entries for the patient
  const today = new Date()
  const progressEntries = []
  
  for (let i = 0; i < 14; i++) {
    const entryDate = new Date(today)
    entryDate.setDate(entryDate.getDate() - i)
    
    // Simulate improving pain, mood, and mobility scores over time
    const painScore = Math.max(1, Math.min(10, 8 - (i * 0.4) + (Math.random() - 0.5) * 2))
    const moodScore = Math.max(1, Math.min(10, 3 + (i * 0.3) + (Math.random() - 0.5) * 1.5))
    const mobilityScore = Math.max(1, Math.min(10, 2 + (i * 0.5) + (Math.random() - 0.5) * 1.2))
    
    const progressEntry = await prisma.progressEntry.create({
      data: {
        painScore: Math.round(painScore),
        moodScore: Math.round(moodScore),
        mobilityScore: Math.round(mobilityScore),
        medicationAdherence: Math.random() > 0.2, // 80% chance of taking medication
        exerciseAdherence: Math.random() > 0.3, // 70% chance of doing exercises
        notes: i === 0 ? 'Feeling much better today!' : 
               i === 3 ? 'Had some discomfort during exercises' :
               i === 7 ? 'Great progress this week' : null,
        entryDate: entryDate,
        patientId: patient.id,
      },
    })
    progressEntries.push(progressEntry)
  }

  console.log('✅ Database setup completed!')
  console.log('📊 Sample data created:')
  console.log(`   - Center: ${center.name}`)
  console.log(`   - Physios: ${physio1.firstName} ${physio1.lastName}, ${physio2.firstName} ${physio2.lastName}, ${physio3.firstName} ${physio3.lastName}`)
  console.log(`   - Nutritionists: ${nutritionist1.firstName} ${nutritionist1.lastName}, ${nutritionist2.firstName} ${nutritionist2.lastName}`)
  console.log(`   - Patient: ${patient.firstName} ${patient.lastName}`)
  console.log(`   - Exercise: ${exercise.name}`)
  console.log(`   - Prescription: ${prescription.id}`)
  console.log(`   - Appointments: ${appointment1.title}, ${appointment2.title}, ${appointment3.title}`)
  console.log(`   - Progress Entries: ${progressEntries.length} entries for patient`)
  console.log('🔑 Login credentials (all use password: password123):')
  console.log('   - Center Admin: admin@rehabcenter.com')
  console.log('   - Physio: dr.sarah@rehabcenter.com')
  console.log('   - Nutritionist: lisa.anderson@mskcare.com')
  console.log('   - Patient: john.doe@example.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
