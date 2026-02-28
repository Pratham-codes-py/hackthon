import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_HISTORY = 6; // keep token count low for speed

interface HistoryMessage { role: 'user' | 'assistant'; content: string; }
interface FootprintData {
    transport?: number; energy?: number; diet?: number;
    waste?: number; total?: number; previousTotal?: number;
}

/** Extract "retry in Xs" seconds from 429 error message */
function parseRetryDelay(msg: string, fallback = 15000): number {
    const match = msg.match(/retry[^0-9]*(\d+(?:\.\d+)?)\s*s/i);
    return match ? Math.ceil(parseFloat(match[1])) * 1000 : fallback;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, footprint, habitDescription, history = [] }: {
            message: string;
            footprint?: FootprintData;
            habitDescription?: string;
            history?: HistoryMessage[];
        } = body;

        if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });
        if (!genAI) return NextResponse.json({ reply: '🔑 Missing GEMINI_API_KEY in .env.local' }, { status: 503 });

        // ── Footprint context ─────────────────────────────────────────────────
        const fp = footprint;
        const t = fp?.transport != null ? Number(fp.transport).toFixed(1) : '?';
        const e = fp?.energy != null ? Number(fp.energy).toFixed(1) : '?';
        const d = fp?.diet != null ? Number(fp.diet).toFixed(1) : '?';
        const w = fp?.waste != null ? Number(fp.waste).toFixed(1) : '?';
        const tot = fp?.total != null ? Number(fp.total).toFixed(1) : '?';

        // Habit context — this is what the user described about their daily life
        const habitCtx = habitDescription?.trim()
            ? `\nUser's daily habits: "${habitDescription.trim()}"\nFactor this into your advice.`
            : '';

        const systemInstruction =
            `You are a friendly, expert carbon footprint and sustainable lifestyle coach for Indian users. Keep replies under 130 words.
Footprint data (tons CO₂e/yr): transport=${t}, energy=${e}, diet=${d}, waste=${w}, total=${tot}.${habitCtx}
You can help with: carbon footprint analysis, daily habits, diet changes, transport choices, home energy, lifestyle tips, and sustainable living.
Rules: be specific and actionable; reference the user's numbers or habits when relevant; Indian avg ~1.9t/yr; suggest 2-3 concrete steps when asked; end encouragingly; plain text only.`;

        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, systemInstruction });

        // Only last MAX_HISTORY messages, skip the welcome at index 0
        // Ensure the history always STARTS with a 'user' role (Gemini requirement)
        let chatHistory = history
            .filter((_, i) => i > 0)
            .slice(-MAX_HISTORY)
            .map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            }));

        // Drop leading 'model' entries — Gemini requires history to start with 'user'
        while (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
            chatHistory = chatHistory.slice(1);
        }

        // ── Call Gemini with ONE auto-retry on 429 ───────────────────────────
        const callGemini = async () => {
            const chat = model.startChat({ history: chatHistory });
            const result = await chat.sendMessage(message);
            return result.response.text().trim();
        };

        let reply: string;
        try {
            reply = await callGemini();
        } catch (firstErr: unknown) {
            const msg1 = firstErr instanceof Error ? firstErr.message : String(firstErr);
            const is429 = msg1.includes('429') || msg1.toLowerCase().includes('quota') || msg1.toLowerCase().includes('rate');
            if (is429) {
                // Wait the amount the API tells us, then retry exactly once
                const delay = parseRetryDelay(msg1);
                await new Promise(r => setTimeout(r, delay));
                reply = await callGemini(); // throws if it fails again → caught below
            } else {
                throw firstErr;
            }
        }

        return NextResponse.json({ reply });

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('AI Chat Error:', errMsg);

        if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota')) {
            const delaySec = Math.ceil(parseRetryDelay(errMsg, 30000) / 1000);
            return NextResponse.json({
                reply: `⏳ Gemini is busy right now. Please send your message again in ${delaySec} seconds.`,
                retryAfter: delaySec,
            }, { status: 429 });
        }
        if (errMsg.includes('404'))
            return NextResponse.json({ reply: '🚫 Model not available for this API key.' }, { status: 404 });
        if (errMsg.includes('401') || errMsg.includes('403'))
            return NextResponse.json({ reply: '🔑 Invalid API key — check .env.local.' }, { status: 401 });

        return NextResponse.json({ reply: 'Something went wrong. Please try again! 🌱' }, { status: 500 });
    }
}
