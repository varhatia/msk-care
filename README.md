# MSK Care - Rehabilitation Management Platform

A comprehensive mHealth web application for rehabilitation centers and patients, built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Phase 1 Core Features ✅

1. **Login & Access**
   - Center-based login (each rehab center has its own admin account)
   - Patients created under a center → secure patient profiles
   - Role-based access: Physio/Doctor, Patient

2. **Patient Profile**
   - Basic details (name, age, condition, rehab goals)
   - Prescription history (exercise sets, nutrition add-ons)
   - Progress notes (entered by physio during review)

3. **Exercise Scheduling**
   - Physio creates custom exercise plan
   - Exercise name, reps, duration, frequency
   - Start + end date
   - Option to upload short video demo (or pick from library)
   - Patient gets daily reminders via app/WhatsApp push

4. **Follow-up Scheduling**
   - In-app calendar for recurring follow-up video calls
   - Integrated video call (Jitsi Meet)
   - Notifications before follow-up session

5. **Progress Tracking (Form-Based)**
   - Simple form (pain score 1–10, mobility scale, adherence %)
   - Patients fill this weekly
   - Physio can update clinical notes

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Video Calling**: Jitsi Meet
- **Real-time**: Pusher/Socket.io
- **Forms**: React Hook Form with Zod validation
- **Charts**: Chart.js with react-chartjs-2
- **Notifications**: WhatsApp API, Email (SMTP)

## Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd msk-care
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/msk_care_db"
   
   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # JWT
   JWT_SECRET="your-jwt-secret-here"
   
   # Email (for notifications)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   
   # WhatsApp API (for notifications)
   WHATSAPP_API_KEY="your-whatsapp-api-key"
   WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
   
   # Jitsi Meet
   JITSI_APP_ID="your-jitsi-app-id"
   JITSI_APP_SECRET="your-jitsi-app-secret"
   
   # File Upload (AWS S3)
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET="your-s3-bucket-name"
   
   # Pusher (for real-time features)
   PUSHER_APP_ID="your-pusher-app-id"
   PUSHER_KEY="your-pusher-key"
   PUSHER_SECRET="your-pusher-secret"
   PUSHER_CLUSTER="your-pusher-cluster"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma db push
   
   # (Optional) Seed database
   npx prisma db seed
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Open Application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## AWS Deployment Guide

### 1. Infrastructure Setup

#### Option A: AWS Amplify (Recommended for quick setup)

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Connect your Git repository
   - Select the main branch

2. **Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
           - npx prisma generate
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

   **Alternative: Use amplify.yml file**
   Create an `amplify.yml` file in your project root:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
           - npx prisma generate
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables**
   - Add all environment variables from `.env.local`
   - Set `NEXTAUTH_URL` to your Amplify domain

#### Option B: EC2 with Docker

1. **Create EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Security group with ports 22, 80, 443

2. **Install Docker**
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

4. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=${DATABASE_URL}
         - NEXTAUTH_URL=${NEXTAUTH_URL}
         # Add other environment variables
       depends_on:
         - db
     
     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=msk_care_db
         - POSTGRES_USER=${DB_USER}
         - POSTGRES_PASSWORD=${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

### 2. Database Setup

#### RDS PostgreSQL
1. Create RDS instance
2. Configure security groups
3. Update `DATABASE_URL` in environment variables

#### Alternative: Aurora Serverless
- Better for variable workloads
- Auto-scaling capabilities

### 3. File Storage

#### S3 Bucket Setup
1. Create S3 bucket for file uploads
2. Configure CORS policy
3. Set up IAM roles for access

### 4. Domain & SSL

#### Route 53 + ACM
1. Register domain or use existing
2. Create SSL certificate
3. Configure DNS records

### 5. CDN & Performance

#### CloudFront
1. Create distribution
2. Configure caching rules
3. Set up custom error pages

### 6. Monitoring & Logging

#### CloudWatch
1. Set up application monitoring
2. Configure log groups
3. Create dashboards

#### Health Checks
1. Configure load balancer health checks
2. Set up auto-scaling policies

### 7. Security

#### WAF (Web Application Firewall)
1. Create WAF rules
2. Block common attack patterns
3. Rate limiting

#### Secrets Management
1. Use AWS Secrets Manager for sensitive data
2. Rotate credentials regularly
3. Implement least privilege access

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Centers
- `GET /api/centers` - List centers
- `POST /api/centers` - Create center
- `GET /api/centers/[id]` - Get center details
- `PUT /api/centers/[id]` - Update center

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/[id]` - Get patient details
- `PUT /api/patients/[id]` - Update patient

### Exercises
- `GET /api/exercises` - List exercises
- `POST /api/exercises` - Create exercise
- `GET /api/exercises/[id]` - Get exercise details
- `PUT /api/exercises/[id]` - Update exercise

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/[id]` - Get appointment details
- `PUT /api/appointments/[id]` - Update appointment

### Progress Reports
- `GET /api/progress` - List progress reports
- `POST /api/progress` - Create progress report
- `GET /api/progress/[id]` - Get progress report details

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Database
- `npx prisma studio` - Open Prisma Studio
- `npx prisma db push` - Push schema changes
- `npx prisma migrate dev` - Create and apply migration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@mskcare.com or create an issue in the repository.
