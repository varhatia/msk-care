import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.role) {
          throw new Error('Missing credentials')
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            throw new Error('Account not found. Please register first.')
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            throw new Error('Invalid password')
          }

          // Verify role matches the user's actual role
          const expectedRole = credentials.role === 'center' ? 'ADMIN' : credentials.role.toUpperCase()
          if (user.role !== expectedRole) {
            throw new Error(`Invalid role. This account is registered as ${user.role.toLowerCase()}.`)
          }

          // Check if user is approved (except for MSK Care admin)
          if (!user.isApproved && user.email !== 'admin@mskcare.com') {
            throw new Error('Your account is pending approval from MSK Care team. Please wait for approval before logging in.')
          }

          // Return user data based on role
          if (user.role === 'ADMIN') {
            if (user.centerId) {
              // Center admin
              const center = await prisma.center.findUnique({
                where: { id: user.centerId }
              })
              return {
                id: user.id,
                email: user.email,
                role: user.role,
                centerId: user.centerId,
                centerName: center?.name,
                isMSKAdmin: false
              }
            } else {
              // MSK Care admin
              return {
                id: user.id,
                email: user.email,
                role: user.role,
                isMSKAdmin: true
              }
            }
          } else if (user.role === 'PATIENT' && user.patientId) {
            const patient = await prisma.patient.findUnique({
              where: { id: user.patientId }
            })
            return {
              id: user.id,
              email: user.email,
              role: user.role,
              patientId: user.patientId,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'
            }
          } else if (user.role === 'PHYSIO' && user.physioId) {
            const physio = await prisma.physio.findUnique({
              where: { id: user.physioId }
            })
            return {
              id: user.id,
              email: user.email,
              role: user.role,
              physioId: user.physioId,
              physioName: physio ? `${physio.firstName} ${physio.lastName}` : 'Unknown'
            }
          } else if (user.role === 'NUTRITIONIST' && user.nutritionistId) {
            const nutritionist = await prisma.nutritionist.findUnique({
              where: { id: user.nutritionistId }
            })
            return {
              id: user.id,
              email: user.email,
              role: user.role,
              nutritionistId: user.nutritionistId,
              nutritionistName: nutritionist ? `${nutritionist.firstName} ${nutritionist.lastName}` : 'Unknown'
            }
          }

          throw new Error('Invalid user configuration')
        } catch (error) {
          console.error('Auth error:', error)
          throw error
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.centerId = (user as any).centerId
        token.patientId = (user as any).patientId
        token.physioId = (user as any).physioId
        token.nutritionistId = (user as any).nutritionistId
        token.centerName = (user as any).centerName
        token.patientName = (user as any).patientName
        token.physioName = (user as any).physioName
        token.nutritionistName = (user as any).nutritionistName
        token.isMSKAdmin = (user as any).isMSKAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).role = token.role as string
        (session.user as any).centerId = token.centerId as string
        (session.user as any).patientId = token.patientId as string
        (session.user as any).physioId = token.physioId as string
        (session.user as any).nutritionistId = token.nutritionistId as string
        (session.user as any).centerName = token.centerName as string
        (session.user as any).patientName = token.patientName as string
        (session.user as any).physioName = token.physioName as string
        (session.user as any).nutritionistName = token.nutritionistName as string
        (session.user as any).isMSKAdmin = token.isMSKAdmin as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login'
  },
  secret: process.env.NEXTAUTH_SECRET
}
