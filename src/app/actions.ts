
'use server';

import { generateAISavageRoast } from '@/ai/flows/generate-ai-savage-roast';
import { z } from 'zod';

const roastSchema = z.object({
  photoDataUri: z.string().startsWith('data:image/'),
});

export async function getRoast(prevState: any, formData: FormData) {
  const input = {
    photoDataUri: formData.get('photoDataUri') as string,
  };
  
  const validatedFields = roastSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      error: 'Invalid image data. Please try capturing again.',
    };
  }

  try {
    const result = await generateAISavageRoast(validatedFields.data);
    if (!result || !result.roastText) {
        return {
            error: 'The AI is lost for words. You are unroastable.'
        }
    }
    return { roastText: result.roastText };
  } catch (error) {
    console.error('Error generating roast:', error);
    return {
      error: 'The AI is speechless. You might have broken it. Try again.',
    };
  }
}
