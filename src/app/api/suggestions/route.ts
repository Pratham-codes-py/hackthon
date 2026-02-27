import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: Request) {
    try {

        const body = await request.json();
        const { transport, energy, diet, waste, total } = body;

        if (!transport || !energy || !diet || !waste || !total) {
            return NextResponse.json({ error: 'Missing footprint data in request body' }, { status: 400 });
        }

        if (!genAI) {
            return NextResponse.json({
                error: 'Server is missing GEMINI_API_KEY configuration.',
                fallbackSuggestions: [
                    "Drive less or carpool to reduce your transportation emissions.",
                    "Switch to LED lightbulbs to save energy.",
                    "Incorporate more plant-based meals into your diet."
                ]
            }, { status: 503 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are an expert sustainability and carbon reduction coach.
        I have a user who just calculated their annual carbon footprint:
        - Transport: ${transport} tons CO2
        - Energy (Home): ${energy} tons CO2
        - Diet: ${diet} tons CO2
        - Waste: ${waste} tons CO2
        - Total: ${total} tons CO2

        Based ONLY on this specific breakdown, provide exactly 3 highly personalized, actionable suggestions to reduce their footprint.
        
        Focus heavily on their WORST producing categories.
        
        Format your response as a JSON array of objects. Example:
        [
            {
                "title": "Short title",
                "description": "Detailed explanation of the action",
                "impact": "Estimated tons of CO2 saved",
                "difficulty": "Easy, Medium, or Hard"
            }
        ]
        
        Do not return any markdown formatting around the JSON, just the raw JSON text.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        // Strip out potential markdown code block formatting
        const cleanedJson = responseText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();

        const suggestions = JSON.parse(cleanedJson);

        return NextResponse.json({ suggestions });

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate suggestions' }, { status: 500 });
    }
}
