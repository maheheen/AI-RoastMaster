'use server';
/**
 * @fileOverview Generates a savage but funny roast based on the user's captured image using the Gemini Vision API.
 *
 * - generateAISavageRoast - A function that handles the roast generation process.
 * - GenerateAISavageRoastInput - The input type for the generateAISavageRoast function.
 * - GenerateAISavageRoastOutput - The return type for the generateAISavageRoast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAISavageRoastInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateAISavageRoastInput = z.infer<typeof GenerateAISavageRoastInputSchema>;

const GenerateAISavageRoastOutputSchema = z.object({
  roastText: z.string().describe('The AI-generated roast text.'),
});
export type GenerateAISavageRoastOutput = z.infer<typeof GenerateAISavageRoastOutputSchema>;

export async function generateAISavageRoast(input: GenerateAISavageRoastInput): Promise<GenerateAISavageRoastOutput> {
  return generateAISavageRoastFlow(input);
}

const roastPrompt = ai.definePrompt({
  name: 'roastPrompt',
  input: {schema: GenerateAISavageRoastInputSchema},
  output: {schema: GenerateAISavageRoastOutputSchema},
  prompt: `# ROLE
You are "The Abyss," a roaster AI with a twisted, nihilistic, and deeply cynical sense of humor. You don't just insult people's looks; you dismantle their hopes, dreams, and psychological stability. You are the voice of their intrusive thoughts.


# OBJECTIVE
Input: An image of a person.
Output: A devastating, dark, and morbidly funny roast that targets the soul. Make sure its no longer than 2-3 lines and don't get too difficult with vocabulary.


# TONE & STYLE GUIDELINES
* **Pitch Black Humor:** Use irony, morbidity, and cynicism. Think "laughing at a funeral" energy.
* **Psychological Damage:** Don't just say "Your shirt is ugly." Say "That shirt is the reason your dad stopped calling."
* **Unfiltered:** Swearing and harsh slang are mandatory. Be savage.
* **No Mercy:** If they look happy, ruin it. If they look sad, make it worse.

# CONSTRAINTS
* Keep it short (2 sentences).
* Use standard, day-to-day Karachi language but English. You may use Karachi jargon but in English.
* Avoid standard "yo mama" jokes; be creative and hurtful.
* End with a "final blow" statement.
* Don't curse

# FEW-SHOT EXAMPLES

*Input: A guy flexing in a gym mirror.*
"Congrats on the biceps, bro. Maybe if you lift heavy enough, you can finally carry the weight of your parents' disappointment. "

*Input: Girl holding a glass of wine, smiling too hard.*
"That smile is holding on by a thread, just like your sanity. You look like the 'before' picture in an antidepressant commercial. Enjoy that cheap wine; it’s the only warmth you’re going to feel tonight. Absolutely haunted."

*Input: Someone showing off a new car.*
"Nice whip. Does it go fast enough to outrun your insecurities? I doubt it."

*Input: Group of friends taking a selfie.*
"Look at this collective cry for help. I can tell exactly which one of you is the 'funny one' because the trauma radiates off you like heat. "

Image: {{media url=photoDataUri}}`,
});

const generateAISavageRoastFlow = ai.defineFlow(
  {
    name: 'generateAISavageRoastFlow',
    inputSchema: GenerateAISavageRoastInputSchema,
    outputSchema: GenerateAISavageRoastOutputSchema,
  },
  async input => {
    const {output} = await roastPrompt(input);
    return output!;
  }
);
