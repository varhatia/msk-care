import { z } from 'zod'

// Validation function to ensure only one entity ID is set per user
export function validateSingleEntityConstraint(
  centerId: string | null,
  patientId: string | null,
  physioId: string | null,
  role: string,
  nutritionistId?: string | null
): boolean {
  console.log('=== VALIDATION FUNCTION DEBUG ===')
  console.log('Input parameters:', { centerId, patientId, physioId, role, nutritionistId })
  
  const hasCenterId = centerId !== null
  const hasPatientId = patientId !== null
  const hasPhysioId = physioId !== null
  const hasNutritionistId = nutritionistId !== null

  console.log('Boolean checks:', { hasCenterId, hasPatientId, hasPhysioId, hasNutritionistId })

  // Count how many entity IDs are set
  const entityCount = [hasCenterId, hasPatientId, hasPhysioId, hasNutritionistId].filter(Boolean).length
  console.log('Entity count:', entityCount)

  if (entityCount !== 1) {
    console.log('❌ FAILED: entityCount !== 1')
    return false
  }

  // Verify the entity ID matches the role
  if (role === 'ADMIN' && !hasCenterId) {
    console.log('❌ FAILED: ADMIN role but no centerId')
    return false
  }
  if (role === 'PATIENT' && !hasPatientId) {
    console.log('❌ FAILED: PATIENT role but no patientId')
    return false
  }
  if (role === 'PHYSIO' && !hasPhysioId) {
    console.log('❌ FAILED: PHYSIO role but no physioId')
    return false
  }
  if (role === 'NUTRITIONIST' && !hasNutritionistId) {
    console.log('❌ FAILED: NUTRITIONIST role but no nutritionistId')
    return false
  }

  console.log('✅ VALIDATION PASSED')
  return true
}

// Schema for user creation/update validation
export const userEntitySchema = z.object({
  role: z.enum(['ADMIN', 'PATIENT', 'PHYSIO', 'NUTRITIONIST']),
  centerId: z.string().nullable(),
  patientId: z.string().nullable(),
  physioId: z.string().nullable(),
  nutritionistId: z.string().nullable(),
}).refine(
  (data) => validateSingleEntityConstraint(data.centerId, data.patientId, data.physioId, data.role, data.nutritionistId),
  {
    message: 'User must have exactly one entity ID set that matches their role',
    path: ['role'],
  }
)
