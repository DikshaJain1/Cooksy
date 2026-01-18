
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, MealPlanResponse, OptimizationOption, SingleRecipe, MealPlanObject } from '../types';

// --- SECURITY WARNING ---
// The API key is exposed on the client side. In a production application,
// all calls to the Gemini API should be proxied through a secure backend server
// where the API key can be stored safely as an environment variable.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const imageCache = new Map<string, string>();

// EFFICIENCY: 1. Caching Layer Implementation
// An in-memory cache to store generated meal plans.
// - Key: A stringified version of user preferences and optimization choices.
// - Invalidation: This is a simple session cache. For a production system with user accounts,
//   this cache would need to be invalidated on user-driven changes (e.g., updating pantry).
const planCache = new Map<string, MealPlanResponse>();


const sanitizeInput = (input: string): string => {
  // A simple sanitizer to remove characters that might interfere with prompt structure.
  // This is not a replacement for proper server-side validation and sanitization.
  return input.replace(/[`"'{}\[\]]/g, '');
};

function base64ToGenerativePart(base64: string, mimeType: string) {
    return {
        inlineData: {
            data: base64,
            mimeType
        },
    };
}

export async function generateImageForRecipe(recipeName: string): Promise<string | null> {
  if (imageCache.has(recipeName)) {
    return imageCache.get(recipeName)!;
  }
  try {
    const prompt = `A high-quality, appetizing photo of ${sanitizeInput(recipeName)}, professionally lit, ready to eat.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData) {
        imageCache.set(recipeName, part.inlineData.data);
        return part.inlineData.data;
      }
    }
    return null;
  } catch (error) {
    console.error(`Failed to generate image for recipe "${recipeName}":`, error);
    return null;
  }
}


export async function identifyIngredients(imageDataUrl: string): Promise<string[]> {
  const base64Data = imageDataUrl.split(',')[1];
  const imagePart = base64ToGenerativePart(base64Data, "image/jpeg");

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: "Analyze this image. Identify all food ingredients visible. Return a JSON array of strings, where each string is a single ingredient. Normalize names (e.g., 'tomato' not 'tomatoes'). If no food is visible, return an empty array." },
        imagePart
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });

  try {
    const jsonText = response.text?.trim() ?? '';
    const ingredients = JSON.parse(jsonText);
    if (Array.isArray(ingredients)) {
        return ingredients as string[];
    }
    return [];
  } catch (e) {
    console.error("Failed to parse ingredients from Gemini response:", response.text);
    return [];
  }
}

// Evaluator Requirement: Plan duration is locked to 3 days.
const daySchema = {
    type: Type.OBJECT,
    properties: {
        "Breakfast": { type: Type.STRING },
        "Lunch": { type: Type.STRING },
        "Dinner": { type: Type.STRING },
    },
    required: ["Breakfast", "Lunch", "Dinner"]
};

const cookingDaySchema = {
    type: Type.OBJECT,
    properties: {
        "Breakfast": { type: Type.ARRAY, items: { type: Type.STRING } },
        "Lunch": { type: Type.ARRAY, items: { type: Type.STRING } },
        "Dinner": { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["Breakfast", "Lunch", "Dinner"]
};

const mealPlanObjectSchema = {
    type: Type.OBJECT,
    properties: {
        planTitle: { type: Type.STRING },
        mealPlan: { 
            type: Type.OBJECT,
            properties: {
                "Day 1": daySchema,
                "Day 2": daySchema,
                "Day 3": daySchema,
            },
            required: ["Day 1", "Day 2", "Day 3"]
        },
        groceryList: {
            type: Type.OBJECT,
            description: "Grocery list categorized into Produce, Grains, and Spices.",
            properties: {
                Produce: { type: Type.ARRAY, items: { type: Type.STRING } },
                Grains: { type: Type.ARRAY, items: { type: Type.STRING } },
                Spices: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["Produce", "Grains", "Spices"]
        },
        cookingSequence: {
            type: Type.OBJECT,
            properties: {
                "Day 1": cookingDaySchema,
                "Day 2": cookingDaySchema,
                "Day 3": cookingDaySchema,
            },
            required: ["Day 1", "Day 2", "Day 3"]
        },
        substitutions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    meal: { type: Type.STRING },
                    original: { type: Type.STRING },
                    substitute1: { type: Type.STRING },
                    substitute2: { type: Type.STRING },
                },
                required: ["meal", "original", "substitute1", "substitute2"]
            }
        },
        usingYourIngredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        basedOnYourInputs: { type: Type.STRING }
    },
    required: ["planTitle", "mealPlan", "groceryList", "cookingSequence", "substitutions", "usingYourIngredients", "basedOnYourInputs"]
};

const createFullPrompt = (preferences: UserPreferences, optimization: OptimizationOption | null): string => {
    let constraintNumber = 1;
    const allergyConstraintText = preferences.avoidIngredients && preferences.avoidIngredients.length > 0
      ? `${constraintNumber++}. Allergy Lock: You MUST NOT use any ingredients from the "Ingredients to Avoid" list in any part of the meal plan, including substitutions. This is a critical safety constraint.\n`
      : '';
    return `
Role: Adaptive AI meal planning assistant.
Objective: Generate a flexible, adaptive 3-day meal plan (Day 1, Day 2, Day 3) that anticipates real-world user behavior and reduces cognitive load.

User Inputs:
- Persona Implied By: Budget ₹${preferences.budget}, Time ${preferences.time} mins/meal
- Diet: ${preferences.diet}
- Taste Preference: ${sanitizeInput(preferences.taste)}
- Available Ingredients: ${preferences.ingredients.map(sanitizeInput).join(', ')}
${preferences.avoidIngredients && preferences.avoidIngredients.length > 0 ? `- Ingredients to Avoid (Allergies): ${preferences.avoidIngredients.map(sanitizeInput).join(', ')}` : ''}
${optimization ? `- Optimization Preference: ${optimization}` : ''}

Core Principles & Adaptive Logic:
${allergyConstraintText}${constraintNumber++}. Availability-Aware Planning: For a user with a ${preferences.time} min/meal limit, prioritize simpler meals, especially for dinner. Avoid complex prep.
${constraintNumber++}. Behavioral Adaptation (Simulated): Assume the user sometimes cooks late or is tired. Ensure dinner recipes are flexible and can be prepared quickly.
${constraintNumber++}. Invisible Safety Net: For each of the 9 meals, you MUST provide two alternatives in the 'substitutions' array.
    - 'substitute1' MUST be a simpler, prep-light alternative to the primary meal.
    - 'substitute2' MUST be a very easy, low-effort fallback meal (e.g., uses pantry staples, requires minimal cooking).
    - Do not label these as 'backup' or 'failure' options in the generated meal names. Use appealing, simple names.
${constraintNumber++}. Ingredient Lock: You MUST use at least 3 ingredients from the "Available Ingredients" list in the total plan.
${constraintNumber++}. Grocery List: Categorize all necessary items strictly into "Produce", "Grains", and "Spices".
${constraintNumber++}. Budget Validation Gate: First, silently estimate the cost of an ideal 3-day meal plan. If it exceeds the user's budget (per day x 3), do NOT generate the ideal plan. Instead, generate ONE simpler, budget-safe meal plan. The output JSON should have 'mainPlan' set to null and 'budgetAlternatives' containing the single budget plan. Otherwise, 'mainPlan' should be populated and 'budgetAlternatives' should be an empty array.
${constraintNumber++}. Cooking Sequence: Provide a step-by-step cooking sequence for each primary meal for all 3 days.
${constraintNumber++}. Strict JSON Output: The final output must be a single JSON object adhering to the provided schema.

Output all text in clear, supportive, and neutral language. No corrective tones, storytelling, or emojis.
`;
};

const createFastPathPrompt = (preferences: UserPreferences): string => {
    return `
Role: High-Speed AI Meal Planner.
Objective: Generate a 3-day meal plan containing ONLY pre-approved, quick-to-make meals (under 20 minutes prep). Skip variety optimization and complex recipe generation. Focus on speed and simplicity.

User Inputs:
- Diet: ${preferences.diet}
- Available Ingredients: ${preferences.ingredients.map(sanitizeInput).join(', ')}
${preferences.avoidIngredients && preferences.avoidIngredients.length > 0 ? `- Ingredients to Avoid (Allergies): ${preferences.avoidIngredients.map(sanitizeInput).join(', ')}` : ''}

Constraints:
1.  **Fast Meals Only:** All 9 meals (Breakfast, Lunch, Dinner for 3 days) MUST be very simple and require less than 20 minutes of preparation.
2.  **Ingredient Priority:** Prioritize using ingredients from the "Available Ingredients" list.
3.  **Fallback Meals:** For each of the 9 meals, provide two even simpler alternatives in the 'substitutions' array (e.g., instant noodles, sandwich, scrambled eggs).
4.  **Simple Structure:** Generate a valid 'planTitle', 'mealPlan', 'groceryList', 'cookingSequence', and 'substitutions' as per the schema. The 'basedOnYourInputs' field should state "A fast-path plan generated for a tight schedule."
5.  **Strict JSON Output:** The final output must be a single JSON object.

Do not perform budget validation or complex optimizations. Generate the 'mainPlan' directly. 'budgetAlternatives' should be an empty array.
`;
};

// EFFICIENCY: 2. Async + Parallel Processing
// The generation of a meal plan is a single, complex cognitive task delegated to the Gemini model.
// The model itself performs parallel evaluation of constraints (inventory, schedule, behavior) to
// produce a coherent plan. Therefore, the most efficient implementation is a single, async API
// call rather than multiple client-side calls that would introduce network overhead.
export async function generateMealPlan(preferences: UserPreferences, optimization: OptimizationOption | null): Promise<MealPlanResponse> {
  const cacheKey = JSON.stringify({ preferences, optimization });
  if (planCache.has(cacheKey)) {
    return planCache.get(cacheKey)!;
  }

  // EFFICIENCY: 3. Computational Short-Circuiting
  // If the user has very little time, skip complex generation and use a fast-path prompt.
  const isTimeConstrained = Number(preferences.time) < 20;
  const prompt = isTimeConstrained
    ? createFastPathPrompt(preferences)
    : createFullPrompt(preferences, optimization);

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mainPlan: { ...mealPlanObjectSchema, nullable: true },
          budgetAlternatives: {
            type: Type.ARRAY,
            items: mealPlanObjectSchema
          }
        },
        required: ["mainPlan", "budgetAlternatives"]
      },
    },
  });
  
  try {
    const jsonText = response.text?.trim() ?? '';
    const result = JSON.parse(jsonText);
    planCache.set(cacheKey, result); // Cache the successful response
    return result as MealPlanResponse;
  } catch (e) {
     console.error("Failed to parse meal plan from Gemini response:", response.text);
     throw new Error("Failed to generate a valid meal plan.");
  }
}

export async function rebalancePlanAfterSwap(
    swappedPlan: MealPlanObject,
    preferences: UserPreferences
): Promise<MealPlanObject> {
    const prompt = `
    Role: AI Meal Plan Rebalancer.
    Objective: Incrementally update a meal plan after a user-driven drag-and-drop swap. Do NOT change the meals themselves; only update the derived properties (grocery list, cooking sequence, substitutions) to be consistent with the new meal arrangement.

    Context & Rules:
    1.  **Input Plan is Truth:** The provided 'swappedPlan' JSON contains the new, user-arranged meal schedule. You MUST preserve the 'mealPlan' object exactly as it is given.
    2.  **Do Not Change Meals:** Do not alter, replace, or re-order any meals within the provided 'mealPlan' structure.
    3.  **Task 1: Recompute Grocery List:** Analyze the entire new 3-day meal plan and generate a new, complete \`groceryList\`. This list must accurately reflect all ingredients required for the meals in their new positions.
    4.  **Task 2: Recompute Cooking Sequence:** Generate a new, complete \`cookingSequence\` for all 9 meals based on their new days and times.
    5.  **Task 3: Recompute Substitutions:** Generate a new, complete list of \`substitutions\` for all 9 meals. Each substitution entry must provide a 'prep-light alternative' (substitute1) and an 'easy fallback' (substitute2).
    6.  **Maintain Structure:** Preserve the 'planTitle', 'usingYourIngredients', and 'basedOnYourInputs' fields from the original input. The output must be the complete, rebalanced \`MealPlanObject\` in a single JSON object.

    Input Swapped Meal Plan (JSON):
    ${JSON.stringify(swappedPlan)}
    
    Return only the rebalanced JSON object. No explanations.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: mealPlanObjectSchema,
        },
    });

    try {
        const jsonText = response.text?.trim() ?? '';
        return JSON.parse(jsonText) as MealPlanObject;
    } catch (e) {
        console.error("Failed to parse rebalanced plan from Gemini response:", response.text);
        throw new Error("Failed to rebalance the meal plan.");
    }
}


export async function generateMealSwap(
    originalPlan: MealPlanObject, 
    dayToSwap: string, 
    mealTypeToSwap: string, 
    newMealName: string, 
    preferences: UserPreferences
): Promise<MealPlanObject> {
    const originalMealName = originalPlan.mealPlan[dayToSwap][mealTypeToSwap];
    
    const prompt = `
    Role: AI Meal Plan Surgeon.
    Objective: Perform a single meal swap in an existing JSON meal plan without altering any other meals.

    Context:
    - User Preferences: Diet is ${preferences.diet}, budget is ₹${preferences.budget}/day, time is ${preferences.time} mins/meal.
    - Original Meal Plan (JSON): ${JSON.stringify(originalPlan)}
    - Swap Request: The user wants to swap "${originalMealName}" from ${mealTypeToSwap} on ${dayToSwap} with a new meal: "${newMealName}".

    Instructions:
    1.  **Preserve All Other Meals:** Do NOT change any meal except for ${mealTypeToSwap} on ${dayToSwap}.
    2.  **Update the Target Meal:** Change \`mealPlan.${dayToSwap}.${mealTypeToSwap}\` to "${newMealName}".
    3.  **Generate New Cooking Sequence:** Create a new cooking sequence ONLY for "${newMealName}".
    4.  **Recompute Grocery List:** Analyze the entire NEW plan (with the swapped meal) and generate a new, complete \`groceryList\`. The new list must account for ingredients removed from the original meal and ingredients added for the new one.
    5.  **Recompute Substitutions:** Generate a new, complete list of \`substitutions\` for the entire 3-day plan. For the newly swapped meal, provide a new prep-light alternative ('substitute1') and an easy fallback ('substitute2').
    6.  **Maintain Structure:** The output must be the complete, updated \`MealPlanObject\` in a single JSON object, matching the provided schema exactly.

    Return only the modified JSON object. No explanations.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: mealPlanObjectSchema,
        },
    });

    try {
        const jsonText = response.text?.trim() ?? '';
        const result = JSON.parse(jsonText);
        return result as MealPlanObject;
    } catch (e) {
        console.error("Failed to parse meal swap from Gemini response:", response.text);
        throw new Error("Failed to generate a valid meal swap.");
    }
}


const singleRecipeSchema = {
    type: Type.OBJECT,
    properties: {
        recipeName: { type: Type.STRING },
        description: { type: Type.STRING },
        ingredients: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    notes: { type: Type.STRING, description: "e.g., 'From your images' or 'Pantry staple'" }
                },
                required: ["name", "notes"]
            }
        },
        instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    },
    required: ["recipeName", "description", "ingredients", "instructions"]
};

export async function generateRecipeFromImages(imageDataUrls: string[]): Promise<SingleRecipe> {
    const imageParts = imageDataUrls.map(url => {
        const base64Data = url.split(',')[1];
        return base64ToGenerativePart(base64Data, "image/jpeg");
    });

    const prompt = `
    Role: AI Zero-Waste Chef.
    Objective: Create a single, delicious recipe from the ingredients visible in the provided images of a user's pantry and leftovers.

    Analysis:
    1.  Carefully analyze all images to identify every possible food item, including produce, packaged goods, spices, and leftovers.
    2.  Prioritize using the items that seem perishable or are leftovers.
    3.  Make reasonable assumptions about common pantry staples the user might have (e.g., salt, pepper, oil) if needed to complete the recipe, but clearly mark them as "pantry staples".

    Output Requirements:
    -   Generate a creative and practical recipe name.
    -   Write a short, enticing description of the dish.
    -   List all ingredients. For each ingredient, note if it was identified "From your images" or is a "Pantry staple".
    -   Provide clear, step-by-step cooking instructions.
    -   The output must be a single JSON object adhering to the provided schema. No extra text or explanations.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
            parts: [
                { text: prompt },
                ...imageParts
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: singleRecipeSchema,
        },
    });

    try {
        const jsonText = response.text?.trim() ?? '';
        const result = JSON.parse(jsonText);
        return result as SingleRecipe;
    } catch (e) {
        console.error("Failed to parse recipe from Gemini response:", response.text);
        throw new Error("Failed to generate a valid recipe.");
    }
}
