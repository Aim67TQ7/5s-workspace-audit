import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const systemPrompt = `You are a 5S workplace organization auditor and expert. Your task is to analyze images for 5S compliance and generate a detailed, structured audit report. For each category, provide at least 3-5 SPECIFIC, ACTIONABLE observations.

When analyzing images, you must:
1. Identify exact items, locations, and conditions that need attention
2. Use precise language and specific examples
3. Focus on concrete, observable details
4. Quantify issues when possible (e.g., "3 unmarked containers" rather than "several containers")
5. For each weakness, provide the exact location and specific impact

5S Categories:
1. SORT (Seiri) - Remove unnecessary items from the workspace
   - Look for: obsolete equipment, unused tools, expired materials, redundant items
   
2. SET IN ORDER (Seiton) - Organize remaining items for easy access
   - Look for: labeling, shadow boards, color coding, designated storage, visual controls
   
3. SHINE (Seiso) - Clean and inspect the workspace regularly
   - Look for: dust, debris, spills, worn equipment, cleanliness standards
   
4. STANDARDIZE (Seiketsu) - Create standards for organization and cleanliness
   - Look for: checklists, standard procedures, visual standards, documented processes
   
5. SUSTAIN (Shitsuke) - Maintain and continuously improve standards
   - Look for: audit schedules, improvement tracking, training evidence, engagement

For each weakness, follow this format:
"[Specific observation] located at/in [exact location]"

Example findings:
- "6 obsolete equipment manuals stored on top shelf of documentation cabinet"
- "Mixing of different bolt sizes in unlabeled bins at workstation 3"
- "Accumulated metal shavings and cutting fluid under CNC machine 2"
- "Missing shadow board outline for torque wrench on tool panel A"

IMPORTANT: 
- Generate at least 3-5 specific findings for EACH category
- If Shine score is below 60, focus primarily on Sort, Set in Order, and Shine
- Be extremely specific about what you observe - mention exact items, quantities, and locations
- Scores should reflect actual workplace conditions (most workplaces score 50-80)

Respond with valid JSON only - no markdown, no extra text:`;

const responseFormat = `{
  "scores": {
    "sort": <0-100 based on unnecessary items present>,
    "set_in_order": <0-100 based on organization quality>,
    "shine": <0-100 based on cleanliness>,
    "standardize": <0-100 based on visible standards>,
    "sustain": <0-100 based on maintenance evidence>
  },
  "findings": {
    "sort": [{"observation": "specific finding", "location": "exact location", "severity": "minor|moderate|major"}],
    "set_in_order": [{"observation": "...", "location": "...", "severity": "..."}],
    "shine": [{"observation": "...", "location": "...", "severity": "..."}],
    "standardize": [{"observation": "...", "location": "...", "severity": "..."}],
    "sustain": [{"observation": "...", "location": "...", "severity": "..."}]
  },
  "recommendations": [
    "Immediate: <action needed this week>",
    "Short-term: <action for next 30 days>",
    "Long-term: <systemic improvement>"
  ],
  "overall_score": <weighted average, penalize heavily for major findings>,
  "summary": "2-3 sentence executive summary of workspace condition"
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
        text: `Analyze these ${images.length} image(s) of "${workspace_name || 'workspace'}" for 5S compliance. 

Examine every visible area carefully:
- Count specific items that need attention
- Note exact locations (left side, center table, under machine, etc.)
- Identify both strengths and weaknesses
- Be realistic with scoring - perfection is rare

After analysis, provide your complete assessment.`
      }
    ];

    // Add each image with specific instructions
    images.forEach((base64Image: string, index: number) => {
      content.push({
        type: "text",
        text: `Image ${index + 1} of ${images.length}:`
      });
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64Image
        }
      });
    });

    content.push({
      type: "text", 
      text: `Now provide your complete 5S assessment as JSON in this exact format:\n${responseFormat}`
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
      console.error('Claude API error:', error);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.content[0].text;

    // Parse JSON from response - handle potential markdown wrapping
    let jsonStr = text;
    
    // Remove markdown code blocks if present
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```\s*/g, '');
    }
    
    // Find the JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not parse JSON from:', text);
      throw new Error('Could not parse JSON from response');
    }

    const assessment = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!assessment.scores || !assessment.findings || !assessment.overall_score) {
      throw new Error('Invalid assessment structure');
    }

    // Ensure all category arrays exist
    const categories = ['sort', 'set_in_order', 'shine', 'standardize', 'sustain'];
    categories.forEach(cat => {
      if (!assessment.findings[cat]) {
        assessment.findings[cat] = [];
      }
      if (typeof assessment.scores[cat] !== 'number') {
        assessment.scores[cat] = 50; // Default if missing
      }
    });

    return new Response(JSON.stringify(assessment), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      hint: 'Check that ANTHROPIC_API_KEY is set in Supabase edge function secrets'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
