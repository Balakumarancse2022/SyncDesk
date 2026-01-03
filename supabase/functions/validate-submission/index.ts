import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Authenticated user:", user.id);

    const { fileName, fileType, fileSize, submissionType, fileContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Define submission type requirements
    const submissionRequirements: Record<string, { formats: string[]; maxSize: number; naming: string; contentExpectations: string }> = {
      resume: {
        formats: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize: 5 * 1024 * 1024, // 5MB
        naming: 'FirstName_LastName_Resume or Resume_FirstName_LastName',
        contentExpectations: 'Should contain: contact info, work experience, education, skills. Professional formatting with clear sections.'
      },
      cv: {
        formats: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize: 10 * 1024 * 1024, // 10MB
        naming: 'FirstName_LastName_CV or CV_FirstName_LastName',
        contentExpectations: 'Should contain: detailed work history, publications, research, education, certifications. Academic formatting preferred.'
      },
      cover_letter: {
        formats: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize: 2 * 1024 * 1024, // 2MB
        naming: 'CoverLetter_CompanyName or FirstName_LastName_CoverLetter',
        contentExpectations: 'Should be addressed to specific company/role, express interest, highlight relevant experience, include call to action.'
      },
      college_assignment: {
        formats: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        maxSize: 25 * 1024 * 1024, // 25MB
        naming: 'SubjectCode_AssignmentNumber_StudentID or StudentName_Assignment_Date',
        contentExpectations: 'Should include title page, student details, proper citations, bibliography if applicable.'
      },
      research_paper: {
        formats: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize: 50 * 1024 * 1024, // 50MB
        naming: 'ResearchTitle_AuthorName or Paper_Topic_Date',
        contentExpectations: 'Should include abstract, introduction, methodology, results, discussion, conclusion, references. Follow academic formatting (APA, MLA, etc.).'
      },
      thesis: {
        formats: ['application/pdf'],
        maxSize: 100 * 1024 * 1024, // 100MB
        naming: 'Thesis_Title_AuthorName_Year',
        contentExpectations: 'Should include title page, abstract, acknowledgements, table of contents, chapters, bibliography, appendices.'
      },
      project_report: {
        formats: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        maxSize: 50 * 1024 * 1024, // 50MB
        naming: 'ProjectName_Report_Date or TeamName_ProjectReport',
        contentExpectations: 'Should include project overview, objectives, methodology, implementation details, results, conclusion.'
      },
      presentation: {
        formats: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/pdf'],
        maxSize: 50 * 1024 * 1024, // 50MB
        naming: 'Topic_Presentation or PresentationTitle_Author',
        contentExpectations: 'Should have clear slides, consistent formatting, visual aids, speaker notes if applicable.'
      },
      spreadsheet: {
        formats: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
        maxSize: 25 * 1024 * 1024, // 25MB
        naming: 'DataTitle_Date or FileName_Version',
        contentExpectations: 'Should have proper headers, organized data, formulas documentation if applicable.'
      },
      others: {
        formats: [],
        maxSize: 50 * 1024 * 1024, // 50MB
        naming: 'DescriptiveName_Date',
        contentExpectations: 'General document formatting and organization expected.'
      }
    };

    const requirements = submissionRequirements[submissionType] || submissionRequirements.others;
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    
    // Initial validation checks
    const formatValid = requirements.formats.length === 0 || requirements.formats.some(f => 
      fileType === f || 
      (f.includes(fileExtension))
    );
    const sizeValid = fileSize <= requirements.maxSize;

    const prompt = `You are an expert document submission validator for academic and corporate environments. Perform a comprehensive analysis of this submission.

## FILE INFORMATION
- File Name: ${fileName}
- File Type: ${fileType}
- File Size: ${(fileSize / 1024).toFixed(2)} KB (${(fileSize / (1024 * 1024)).toFixed(2)} MB)
- Submission Type: ${submissionType}
- File Extension: ${fileExtension}

## SUBMISSION TYPE REQUIREMENTS
- Expected Formats: ${requirements.formats.join(', ') || 'Any format accepted'}
- Maximum Size: ${(requirements.maxSize / (1024 * 1024)).toFixed(0)} MB
- Naming Convention: ${requirements.naming}
- Content Expectations: ${requirements.contentExpectations}

## INITIAL CHECKS
- Format Valid: ${formatValid}
- Size Valid: ${sizeValid}

${fileContent ? `## FILE CONTENT PREVIEW (First 2000 characters)
${fileContent.substring(0, 2000)}` : ''}

## YOUR ANALYSIS TASKS

### 1. Document Analysis
- What type of content is in the file based on the name and type?
- Does it match the selected submission type (${submissionType})?
- Rate the match between content and submission type (0-100%)

### 2. Format Assessment
- Is the file format appropriate for ${submissionType}?
- What would be better formats if current is not ideal?
- Any compatibility concerns?

### 3. Naming Convention Analysis
- Does the filename follow professional standards?
- What issues exist in the current naming?
- Provide a suggested better filename

### 4. Size Assessment
- Is the file size appropriate for this type?
- Any concerns about the file being too large or too small?

### 5. Quality Improvements
- What specific improvements would make this submission better?
- What are common issues to avoid for this submission type?
- Best practices to follow

Respond in JSON format ONLY with this exact structure:
{
  "status": "valid" | "invalid" | "warning",
  "score": number (0-100),
  "documentAnalysis": {
    "detectedType": string,
    "matchesSubmissionType": boolean,
    "matchPercentage": number,
    "analysis": string
  },
  "formatAnalysis": {
    "isAcceptable": boolean,
    "currentFormat": string,
    "details": string,
    "recommendedFormats": string[]
  },
  "namingConvention": {
    "isAcceptable": boolean,
    "issues": string[],
    "suggestedName": string
  },
  "sizeAssessment": {
    "isAcceptable": boolean,
    "details": string,
    "currentSize": string,
    "maxRecommendedSize": string
  },
  "issues": string[],
  "corrections": string[],
  "bestPractices": string[]
}`;

    console.log("Sending request to AI gateway for validation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional document submission validator. Analyze submissions thoroughly and provide actionable feedback. Always respond with valid JSON only, no markdown formatting." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response received, parsing...");
    
    // Parse the JSON response from AI
    let validationResult;
    try {
      // Remove potential markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      validationResult = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse AI response:", content);
      validationResult = {
        status: "warning",
        score: 50,
        documentAnalysis: {
          detectedType: fileType,
          matchesSubmissionType: true,
          matchPercentage: 50,
          analysis: "Unable to fully analyze document content"
        },
        formatAnalysis: { 
          isAcceptable: formatValid, 
          currentFormat: fileType,
          details: formatValid ? "Format is acceptable" : "Format may not be optimal",
          recommendedFormats: requirements.formats.slice(0, 3) 
        },
        namingConvention: { 
          isAcceptable: true, 
          issues: [], 
          suggestedName: fileName 
        },
        sizeAssessment: { 
          isAcceptable: sizeValid, 
          details: sizeValid ? "Size is within limits" : "File may be too large",
          currentSize: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
          maxRecommendedSize: `${(requirements.maxSize / (1024 * 1024)).toFixed(0)} MB`
        },
        issues: ["AI analysis incomplete - basic validation performed"],
        corrections: [],
        bestPractices: ["Ensure file follows submission guidelines", "Use appropriate file naming", "Keep file size reasonable"]
      };
    }

    console.log("Validation complete, returning result");

    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Validation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});