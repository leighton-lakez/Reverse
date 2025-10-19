import { z } from 'zod';

/**
 * Validation schemas for user inputs to prevent injection attacks and data corruption
 */

// Item listing validation
export const itemSchema = z.object({
  title: z.string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-.,!?'"()]+$/, 'Title contains invalid characters'),
  
  brand: z.string()
    .trim()
    .max(50, 'Brand must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-&.]+$/, 'Brand contains invalid characters')
    .optional()
    .or(z.literal('')),
  
  category: z.string()
    .min(1, 'Category is required'),
  
  description: z.string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  
  condition: z.string()
    .min(1, 'Condition is required'),
  
  price: z.number()
    .positive('Price must be positive')
    .max(999999.99, 'Price must be less than 1,000,000')
    .refine((val) => Number(val.toFixed(2)) === val, 'Price can only have 2 decimal places'),
  
  location: z.string()
    .trim()
    .min(2, 'Location is required')
    .max(100, 'Location must be less than 100 characters'),
  
  size: z.string()
    .trim()
    .max(20, 'Size must be less than 20 characters')
    .optional()
    .or(z.literal('')),
});

// Message validation
export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters')
    .regex(/^[^<>]*$/, 'Message contains invalid characters'),
});

// Profile validation
export const profileSchema = z.object({
  display_name: z.string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  location: z.string()
    .trim()
    .min(2, 'Location is required')
    .max(100, 'Location must be less than 100 characters'),
  
  bio: z.string()
    .trim()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

// Authentication validation
export const authSchema = z.object({
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
});
