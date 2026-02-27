import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

interface HistoryMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface FootprintData {
    transport?: number;
    energy?: number;
    diet?: number;
    waste?: number;
    total?: number;
    previousTotal?: number;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, footprint, history = [] }: {
            message: string;
            footprint?: FootprintData;
            history?: HistoryMessage[];
        } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        if (!genAI) {
            return NextResponse.json({
                reply: "The AI assistant is not configured. Please add a GEMINI_API_KEY to your .env.local file."
            }, { status: 503 });
        }

        // ── Build transport/energy/diet/waste values ──────────────────────
        const fp = footprint;
        const transport = fp?.transport != null ? Number(fp.transport).toFixed(2) : 'N/A';
        const energy = fp?.energy != null ? Number(fp.energy).toFixed(2) : 'N/A';
        const diet = fp?.diet != null ? Number(fp.diet).toFixed(2) : 'N/A';
        const waste = fp?.waste != null ? Number(fp.waste).toFixed(2) : 'N/A';
        const total = fp?.total != null ? Number(fp.total).toFixed(2) : 'N/A';

        const previousTotal = fp?.previousTotal != null
            ? `${Number(fp.previousTotal).toFixed(2)} tons`
            : 'not available';

        const trend = (fp?.previousTotal != null && fp?.total != null)
            ? (fp.total < fp.previousTotal ? 'improving ✅' : fp.total > fp.previousTotal ? 'worsening ⚠️' : 'stable ➡️')
            : 'unknown';

        // ── New user-specified prompt template ────────────────────────────
        const systemPrompt = `You are an expert and friendly carbon footprint assistant. Your goal is to help users understand their carbon emissions and provide actionable advice to reduce them.

**User's Current Carbon Footprint Data** (tons CO₂e per year):
- Transport: ${transport}
- Home Energy: ${energy}
- Diet: ${diet}
- Waste: ${waste}
- **Total**: ${total}

**Previous Footprint** (if available): ${previousTotal} (shows a ${trend} trend)

**User's Question**: "${message}"

---

### Your Task
Answer the user's question based **only** on the provided data and general knowledge about carbon reduction. Follow these guidelines:

1. **Be friendly and encouraging** – use a warm, conversational tone.
2. **Be concise** – keep answers under 150 words unless the question requires more detail.
3. **Be specific and actionable** – refer to the user's own numbers (e.g., "Your transport emissions are high because you drive 200 miles/week. Try carpooling twice a week to save about 0.5 tons/year.").
4. **If the question is about "how to reduce" or "where to improve"**:
   - Highlight the category with the highest emissions first.
   - Suggest 2–3 concrete changes with estimated savings (in tons/year).
   - Use bullet points for clarity.
5. **If the user asks for comparisons** (e.g., "How do I compare to average?"):
   - Provide context based on typical values (e.g., average US footprint is ~16 tons; average global is ~4 tons).
6. **If the question is unclear or unrelated**, politely ask for clarification.
7. **Always end with a positive, motivating note** (e.g., "Every small step adds up – you're already making a difference by tracking your footprint!").

### Response Format
- Write in plain text (no markdown unless specifically requested by the user).
- Use emojis sparingly to add warmth.

Now, answer the user's question.`;

        // ── Build Gemini chat session with history ────────────────────────
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const chat = model.startChat({
            history: history
                // Skip the first message (the system greeting) — it's just UI chrome
                .filter((_, i) => i > 0)
                .map((msg) => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }],
                })),
        });

        const result = await chat.sendMessage(systemPrompt);
        const reply = result.response.text().trim();

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return NextResponse.json({
            reply: 'Sorry, I had trouble processing that. Please try again! 🌱'
        }, { status: 500 });
    }
}
