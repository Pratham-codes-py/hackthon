import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: Request) {
    try {

        const body = await request.json();
        const { transport, energy, diet, waste, total, habitDescription } = body;

        if (transport == null || energy == null || diet == null || waste == null || total == null) {
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

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const habitContext = habitDescription?.trim()
            ? `\n        The user describes their habits as: "${habitDescription.trim()}"\n        Factor this into your suggestions.`
            : '';

        const prompt = `
        You are an expert sustainability coach for an Indian audience.
        A user just calculated their annual carbon footprint:
        - Transport: ${transport} tons CO2
        - Energy (Home): ${energy} tons CO2
        - Diet: ${diet} tons CO2
        - Waste: ${waste} tons CO2
        - Total: ${total} tons CO2
        ${habitContext}

        Based on this breakdown, provide exactly 3 highly personalized, actionable suggestions.
        Focus on their WORST categories. Use Indian context (public transport, local diet etc.).
        
        IMPORTANT: Return ONLY a raw JSON array. No markdown, no explanation outside JSON.
        Format:
        [
            {
                "title": "Short action title (max 8 words)",
                "description": "Practical explanation (2-3 sentences)",
                "impact": 0.5,
                "difficulty": "Easy"
            }
        ]
        The "impact" field must be a NUMBER (tons CO2 saved per year), not a string.
        "difficulty" must be exactly one of: Easy, Medium, Hard
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Strip markdown code fences if present
        responseText = responseText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();

        // Extract JSON array if there's surrounding text
        const arrayMatch = responseText.match(/(\[[\s\S]*\])/);
        const cleanedJson = arrayMatch ? arrayMatch[1] : responseText;

        let parsed: any[];
        try {
            parsed = JSON.parse(cleanedJson);
        } catch {
            console.error('Suggestions JSON parse failed. Raw response:', responseText.slice(0, 500));
            // Graceful fallback — return generic suggestions rather than a 500
            parsed = [
                { title: "Use public transport", description: "Switch to bus or metro for your daily commute to significantly cut transport emissions.", impact: 0.8, difficulty: "Easy" },
                { title: "Reduce meat consumption", description: "Going meat-free 3 days a week can cut your diet footprint by up to 30%.", impact: 0.6, difficulty: "Easy" },
                { title: "Switch to LED bulbs", description: "Replacing all bulbs with LEDs saves energy and reduces your home electricity bill.", impact: 0.3, difficulty: "Easy" },
            ];
        }

        // Normalize: ensure impact is always a number
        const suggestions = parsed.map((s: any) => ({
            ...s,
            impact: typeof s.impact === 'number' ? s.impact : parseFloat(String(s.impact)) || 0.5,
        }));

        return NextResponse.json({ suggestions });

    } catch (error: any) {
        console.error("Gemini Suggestions Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate suggestions' }, { status: 500 });
    }
}
