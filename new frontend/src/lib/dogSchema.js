import { z } from 'zod'

export const dogSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  breed: z.string().min(1, 'Breed is required').max(60),
  dob: z.string().min(1, 'Date of birth is required'), // yyyy-mm-dd
  sex: z.enum(['male', 'female'], { required_error: 'Select a sex' }),
  weight_kg: z.coerce
    .number({ invalid_type_error: 'Enter a number' })
    .positive('Weight must be greater than 0')
    .max(120, 'That seems too high'),
  is_neutered: z.boolean().default(false),
})