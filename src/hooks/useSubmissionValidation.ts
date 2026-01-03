import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ValidationResult {
  status: 'valid' | 'invalid' | 'warning';
  score: number;
  documentAnalysis?: {
    detectedType: string;
    matchesSubmissionType: boolean;
    matchPercentage: number;
    analysis: string;
  };
  formatAnalysis: {
    isAcceptable: boolean;
    currentFormat?: string;
    details: string;
    recommendedFormats: string[];
  };
  namingConvention: {
    isAcceptable: boolean;
    issues: string[];
    suggestedName: string;
  };
  sizeAssessment: {
    isAcceptable: boolean;
    details: string;
    currentSize?: string;
    maxRecommendedSize: string;
  };
  issues: string[];
  corrections: string[];
  bestPractices: string[];
}

export const useSubmissionValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateFile = async (file: File, submissionType: string) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('validate-submission', {
        body: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          submissionType,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setValidationResult(data);
      return data;
    } catch (error: any) {
      console.error('Validation error:', error);
      toast.error('Failed to validate file: ' + error.message);
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  const resetValidation = () => {
    setValidationResult(null);
  };

  return {
    isValidating,
    validationResult,
    validateFile,
    resetValidation,
  };
};
