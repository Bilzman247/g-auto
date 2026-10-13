import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];
  let prevEMA = data[0];
  emaArray.push(prevEMA);
  for (let i = 1; i < data.length; i++) {
    prevEMA = (data[i] - prevEMA) * k + prevEMA;
    emaArray.push(prevEMA);
  }
  return emaArray;
}

function calculateMACD(prices: number[]) {
  if (prices.length < 35) return { macd: 0, signal: 0, histogram: 0, isAccumulating: true };

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const latestMacd = macdLine[macdLine.length - 1];
  const latestSignal = signalLine[signalLine.length - 1];
  const histogram = latestMacd - latestSignal;

  // Check market accumulation (low variance / sideways check)
  const recentSlice = prices.slice(-15);
  const mean = recentSlice.reduce((a, b) => a + b, 0) / recentSlice.length;
  const variance = recentSlice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / recentSlice.length;
  const stdDev = Math.sqrt(variance);
  const isAccumulating = stdDev < (mean * 0.0001); // Very low movement indicates accumulation / sideways

  return { macd: latestMacd, signal: latestSignal, histogram, isAccumulating };
}

export async function POST(req: NextRequest) {
  try {
    const { prices } = await req.json();

    if (!Array.isArray(prices) || prices.length < 30) {
      return NextResponse.json({ shouldTrade: false, direction: 'CALL' });
    }

    const macdData = calculateMACD(prices);

    // If deterministic accumulation check triggers, skip trading
    if (macdData.isAccumulating) {
      return NextResponse.json({ shouldTrade: false, direction: 'CALL' });
    }

    let aiDirection: 'CALL' | 'PUT' = macdData.histogram >= 0 ? 'CALL' : 'PUT';
    let shouldTrade = true;

    try {
      const prompt = `Analyze recent market price ticks for a Deriv asset. 
Recent prices (last 20): ${JSON.stringify(prices.slice(-20))}
MACD Histogram: ${macdData.histogram}
Is market consolidating/accumulating: ${macdData.isAccumulating}

Task: Determine if this market is in a clean momentum phase (suitable for a 5-tick Rise/Fall trade) or in accumulation/sideways consolidation.
Return a valid JSON object with exactly these fields:
{
  "shouldTrade": boolean,
  "direction": "CALL" or "PUT"
}
Do not include any markdown formatting or extra text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (typeof parsed.shouldTrade === 'boolean') {
        shouldTrade = parsed.shouldTrade;
      }
      if (parsed.direction === 'CALL' || parsed.direction === 'PUT') {
        aiDirection = parsed.direction;
      }
    } catch {
      // Fallback to deterministic MACD signal if Gemini fails or is unavailable
      aiDirection = macdData.histogram >= 0 ? 'CALL' : 'PUT';
      shouldTrade = Math.abs(macdData.histogram) > 0.00001;
    }

    return NextResponse.json({ shouldTrade, direction: aiDirection });
  } catch {
    return NextResponse.json({ shouldTrade: false, direction: 'CALL' });
  }
}
