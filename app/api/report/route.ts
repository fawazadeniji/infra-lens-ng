import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for the structured JSON response from Azure OpenAI gpt-4o
 */
interface AIInfrastructureTriage {
  is_valid_infrastructure: boolean;
  category: 'pothole' | 'waste_dump' | 'blocked_drain' | 'broken_utility' | 'other';
  severity: 'low' | 'medium' | 'high';
  hazard_description: string;
  immediate_action_recommendation: string;
}

/**
 * Helper function for exponential backoff retries
 */
async function fetchWithExponentialBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Retry on 429 (Too Many Requests) or 5xx (Server Errors)
      if (response.status === 429 || response.status >= 500) {
        if (attempt === maxRetries) return response;
        throw new Error(`HTTP Error ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) break;
      
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Failed to fetch after retries');
}

/**
 * POST /api/report
 * Processes incoming infrastructure incident reports.
 * - Accepts base64 image and GPS coordinates.
 * - Analyzes image via Azure OpenAI (gpt-4o).
 * - Persists valid infrastructure reports to Supabase.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, lat, lng } = body;

    // 1. Basic Validation
    if (!image) {
      return NextResponse.json({ error: 'Base64 image is required' }, { status: 400 });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'Valid GPS coordinates (lat, lng) are required' }, { status: 400 });
    }

    // 2. Environment Checks
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o';
    const apiVersion = '2024-08-01-preview';

    if (!apiKey || !endpoint) {
      console.error('[Config Error] Azure OpenAI credentials missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 3. Azure OpenAI Analysis
    const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    const systemPrompt = "You are an infrastructure triage assistant. Analyze the image and return strictly valid JSON matching this schema: { 'is_valid_infrastructure': boolean, 'category': 'pothole' | 'waste_dump' | 'blocked_drain' | 'broken_utility' | 'other', 'severity': 'low' | 'medium' | 'high', 'hazard_description': string, 'immediate_action_recommendation': string }.";

    const aiPayload = {
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this infrastructure image from Nigeria and provide a triage report.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${image}`
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500
    };

    const response = await fetchWithExponentialBackoff(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(aiPayload)
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.error(`[AI Error] Azure OpenAI request failed: ${response.status}`, errorMsg);
      return NextResponse.json({ error: 'Image analysis failed' }, { status: response.status });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
    }

    const triageData: AIInfrastructureTriage = JSON.parse(content);

    // 4. Persistence
    if (triageData.is_valid_infrastructure) {
      const { error: dbError } = await supabase.from('reports').insert({
        image, // Prompt says "insert the data (image, ...)"
        lat,
        lng,
        category: triageData.category,
        severity: triageData.severity,
        description: triageData.hazard_description,
        action_recommendation: triageData.immediate_action_recommendation,
        created_at: new Date().toISOString()
      });

      if (dbError) {
        console.error('[DB Error] Failed to save report:', dbError.message);
        return NextResponse.json({ 
          error: 'Report analysis successful but failed to save to database',
          details: dbError.message 
        }, { status: 500 });
      }
    }

    // 5. Success Response
    return NextResponse.json({
      success: true,
      is_valid: triageData.is_valid_infrastructure,
      report: triageData
    });

  } catch (error) {
    console.error('[API Error] Unexpected failure in report processing:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', message }, { status: 500 });
  }
}
