import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const systemPrompt = `You are a 5S workplace organization expert and auditor. Analyze the provided workplace images and generate a detailed assessment.

5S Categories:
1. SORT (Seiri) - Remove unnecessary items
2. SET IN ORDER (Seiton) - Organize for easy access  
3. SHINE (Seiso) - Clean and inspect regularly
4. STANDARDIZE (Seiketsu) - Create standards
5. SUSTAIN (Shitsuke) - Maintain improvements

For each image, identify SPECIFIC observations with exact locations.

Respond with valid JSON only:
{
  "scores": {
    "sort": <0-100>,
    "set_in_order": <0-100>,
    "shine": <0-100>,
    "standardize": <0-100>,
    "sustain": <0-100>
  },
  "findings": {
    "sort": [{"observation": "...", "location": "...", "severity": "minor|moderate|major"}],
    "set_in_order": [...],
    "shine": [...],
    "standardize": [...],
    "sustain": [...]
  },
  "recommendations": ["...", "...", "..."],
  "overall_score": <0-100>,
  "summary": "Brief overall assessment"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, workspace_name } = await req.json();

    if (!images || images.length === 0) {
      throw new Error('No images provided');
    }

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Build content array with images
    const content: any[] = [
      {
        type: "text",
        text: `Analyze these ${images.length} image(s) of "${workspace_name || 'workspace'}" for 5S compliance. Be specific about locations and items observed.`
      }
    ];

    // Add each image
    for (const base64Image of images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64Image
        }
      });
    }

    content.push({
      type: "text", 
      text: "Provide your complete 5S assessment as JSON."
    });

    // Call Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          { role: 'user', content }
        ],
        system: systemPrompt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const result = await response.json();
    const text = result.content[0].text;

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response');
    }

    const assessment = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(assessment), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
