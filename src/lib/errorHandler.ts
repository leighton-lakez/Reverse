/**
 * Security-focused error handler that prevents exposing sensitive information to users
 * while still logging full details for debugging purposes.
 */

export function getUserFriendlyError(error: any): string {
  // Log full error for internal debugging (only visible in console)
  if (process.env.NODE_ENV === 'development') {
    console.error('[Internal Error]', error);
  }

  // Handle Supabase/PostgreSQL specific errors
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique constraint violation
        return 'This item already exists';
      case '23503': // Foreign key violation
        return 'Unable to complete operation';
      case '23502': // Not null violation
        return 'Please fill in all required fields';
      case 'PGRST116': // No rows returned
        return 'Item not found';
      default:
        break;
    }
  }

  // Handle authentication-specific errors
  const errorMessage = error?.message?.toLowerCase() || '';
  
  if (errorMessage.includes('password') || errorMessage.includes('credentials')) {
    return 'Invalid email or password';
  }
  
  if (errorMessage.includes('email') && errorMessage.includes('already')) {
    return 'An account with this email already exists';
  }
  
  if (errorMessage.includes('user not found')) {
    return 'Invalid email or password';
  }

  if (errorMessage.includes('email not confirmed')) {
    return 'Please check your email to verify your account';
  }

  // Handle network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your connection and try again';
  }

  // Default safe message that reveals nothing about internal structure
  return 'Something went wrong. Please try again later';
}
