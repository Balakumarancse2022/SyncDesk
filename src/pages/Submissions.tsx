import React, { useState } from 'react';
import { 
  FileCheck, Upload, CheckCircle2, XCircle, AlertTriangle, Loader2, 
  FileText, RefreshCw, ChevronRight, ChevronLeft, HelpCircle, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import FileUpload from '@/components/ui/file-upload';
import { useSubmissionValidation, type ValidationResult } from '@/hooks/useSubmissionValidation';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'type' | 'validate' | 'results';

const submissionTypes = [
  { value: 'resume', label: 'Resume / CV', description: 'Professional resume or curriculum vitae', formats: 'PDF, DOCX' },
  { value: 'college_assignment', label: 'College Assignment', description: 'Academic assignments and homework', formats: 'PDF, DOCX, DOC' },
  { value: 'academic_project', label: 'Academic Project', description: 'Project reports and documentation', formats: 'PDF, DOCX, ZIP' },
  { value: 'thesis', label: 'Thesis / Dissertation', description: 'Academic research documents', formats: 'PDF, DOCX' },
  { value: 'research_paper', label: 'Research Paper', description: 'Academic research publications', formats: 'PDF, DOCX, LaTeX' },
  { value: 'office_report', label: 'Office Report', description: 'Professional business reports', formats: 'PDF, DOCX, XLSX' },
  { value: 'client_submission', label: 'Client Submission', description: 'Deliverables for clients', formats: 'PDF, ZIP' },
  { value: 'presentation', label: 'Presentation', description: 'Slides and presentations', formats: 'PPTX, PDF' },
  { value: 'others', label: 'Others', description: 'Custom submission type', formats: 'Any' },
];

const ValidationResultCard: React.FC<{ result: ValidationResult; fileName: string }> = ({ result, fileName }) => {
  const statusConfig = {
    valid: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', borderColor: 'border-success/30', label: 'Valid' },
    invalid: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', borderColor: 'border-destructive/30', label: 'Invalid' },
    warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', borderColor: 'border-warning/30', label: 'Needs Review' },
  };

  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  return (
    <Card className={cn('mt-6 border-2 animate-scale-in', config.borderColor)}>
      <CardHeader className={cn('rounded-t-lg', config.bg)}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Validation Results
          </CardTitle>
          <Badge className={cn('gap-1 text-sm px-3 py-1', config.bg, config.color)}>
            <StatusIcon className="w-4 h-4" />
            {config.label}
          </Badge>
        </div>
        <CardDescription className="text-foreground/70">{fileName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Score */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex justify-between mb-3">
            <span className="font-semibold">Overall Validation Score</span>
            <span className={cn('text-2xl font-bold', 
              result.score >= 80 ? 'text-success' : 
              result.score >= 50 ? 'text-warning' : 'text-destructive'
            )}>
              {result.score}/100
            </span>
          </div>
          <Progress value={result.score} className="h-3" />
        </div>

        {/* Document Analysis */}
        {result.documentAnalysis && (
          <div className="space-y-3 p-4 rounded-lg border border-primary/30 bg-primary/5">
            <h4 className="font-semibold flex items-center gap-2">
              🔍 Document Analysis
              {result.documentAnalysis.matchesSubmissionType ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-warning" />
              )}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Detected Type</p>
                <p className="font-medium">{result.documentAnalysis.detectedType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Match Score</p>
                <p className={cn('font-bold', 
                  result.documentAnalysis.matchPercentage >= 80 ? 'text-success' : 
                  result.documentAnalysis.matchPercentage >= 50 ? 'text-warning' : 'text-destructive'
                )}>
                  {result.documentAnalysis.matchPercentage}%
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{result.documentAnalysis.analysis}</p>
          </div>
        )}

        {/* Format Analysis */}
        <div className="space-y-3 p-4 rounded-lg border">
          <h4 className="font-semibold flex items-center gap-2">
            📄 Format Analysis
            {result.formatAnalysis.isAcceptable ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
          </h4>
          {result.formatAnalysis.currentFormat && (
            <p className="text-sm"><span className="text-muted-foreground">Current format:</span> <strong>{result.formatAnalysis.currentFormat}</strong></p>
          )}
          <p className="text-sm text-muted-foreground">{result.formatAnalysis.details}</p>
          {result.formatAnalysis.recommendedFormats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Recommended:</span>
              {result.formatAnalysis.recommendedFormats.map((format, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{format}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Naming Convention */}
        <div className="space-y-3 p-4 rounded-lg border">
          <h4 className="font-semibold flex items-center gap-2">
            ✏️ Naming Convention
            {result.namingConvention.isAcceptable ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-warning" />
            )}
          </h4>
          {result.namingConvention.issues.length > 0 && (
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              {result.namingConvention.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}
          {result.namingConvention.suggestedName && result.namingConvention.suggestedName !== fileName && (
            <div className="flex items-center gap-2 p-2 rounded bg-info/10">
              <Sparkles className="w-4 h-4 text-info" />
              <span className="text-sm">Suggested: </span>
              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{result.namingConvention.suggestedName}</code>
            </div>
          )}
        </div>

        {/* Size Assessment */}
        <div className="space-y-3 p-4 rounded-lg border">
          <h4 className="font-semibold flex items-center gap-2">
            📊 File Size Assessment
            {result.sizeAssessment.isAcceptable ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
          </h4>
          <p className="text-sm text-muted-foreground">{result.sizeAssessment.details}</p>
          <p className="text-sm"><span className="text-muted-foreground">Max recommended:</span> <strong>{result.sizeAssessment.maxRecommendedSize}</strong></p>
        </div>

        {/* Issues */}
        {result.issues.length > 0 && (
          <div className="space-y-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <h4 className="font-semibold text-destructive flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Issues Found ({result.issues.length})
            </h4>
            <ul className="text-sm list-disc list-inside space-y-1">
              {result.issues.map((issue, i) => (
                <li key={i} className="text-muted-foreground">{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Corrections */}
        {result.corrections.length > 0 && (
          <div className="space-y-3 p-4 rounded-lg border border-warning/30 bg-warning/5">
            <h4 className="font-semibold text-warning flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Recommended Corrections
            </h4>
            <ul className="text-sm list-disc list-inside space-y-1">
              {result.corrections.map((correction, i) => (
                <li key={i} className="text-muted-foreground">{correction}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Best Practices */}
        {result.bestPractices.length > 0 && (
          <div className="space-y-3 p-4 rounded-lg border border-info/30 bg-info/5">
            <h4 className="font-semibold text-info flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Best Practices & Improvements
            </h4>
            <ul className="text-sm list-disc list-inside space-y-1">
              {result.bestPractices.map((practice, i) => (
                <li key={i} className="text-muted-foreground">{practice}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Submissions = () => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [submissionType, setSubmissionType] = useState('');
  const [customType, setCustomType] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { isValidating, validationResult, validateFile, resetValidation } = useSubmissionValidation();

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0]);
      resetValidation();
      setCurrentStep('type');
    }
  };

  const handleTypeSelect = (value: string) => {
    setSubmissionType(value);
    if (value !== 'others') {
      setCurrentStep('validate');
    }
  };

  const handleCustomTypeSubmit = () => {
    if (customType.trim()) {
      setCurrentStep('validate');
    }
  };

  const handleValidate = async () => {
    if (selectedFile) {
      const type = submissionType === 'others' ? customType : submissionType;
      await validateFile(selectedFile, type);
      setCurrentStep('results');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSubmissionType('');
    setCustomType('');
    setCurrentStep('upload');
    resetValidation();
  };

  const steps = [
    { id: 'upload', label: 'Upload File', icon: Upload },
    { id: 'type', label: 'Select Type', icon: FileText },
    { id: 'validate', label: 'Validate', icon: FileCheck },
    { id: 'results', label: 'Results', icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Submission Validator</h1>
        <p className="text-muted-foreground mt-1">AI-powered document validation for error-free submissions</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          
          return (
            <React.Fragment key={step.id}>
              <div className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-full transition-all',
                isActive && 'bg-primary text-primary-foreground shadow-lg',
                isCompleted && 'bg-success/10 text-success',
                !isActive && !isCompleted && 'bg-muted text-muted-foreground'
              )}>
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  isActive && 'bg-primary-foreground/20',
                  isCompleted && 'bg-success/20'
                )}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="hidden sm:inline font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-1 mx-2 rounded-full transition-colors',
                  index < currentStepIndex ? 'bg-success' : 'bg-muted'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {currentStep === 'upload' && (
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              What are you uploading?
            </CardTitle>
            <CardDescription>
              Select the file you want to validate before submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload onUpload={handleFileSelect} />
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Type */}
      {currentStep === 'type' && selectedFile && (
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              What type of submission is this?
            </CardTitle>
            <CardDescription>
              Select the category for accurate validation: <strong>{selectedFile.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissionTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeSelect(type.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-md',
                    submissionType === type.value 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <p className="font-semibold">{type.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                  <Badge variant="secondary" className="mt-2 text-xs">{type.formats}</Badge>
                </button>
              ))}
            </div>

            {submissionType === 'others' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30 animate-fade-in">
                <Label className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  Describe your submission type
                </Label>
                <Textarea
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="e.g., Lab report for Biology class, Marketing proposal, etc."
                  className="min-h-[80px]"
                />
                <Button onClick={handleCustomTypeSubmit} disabled={!customType.trim()} className="gradient-primary text-primary-foreground">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('upload')}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Validate */}
      {currentStep === 'validate' && selectedFile && (
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              Ready to Validate
            </CardTitle>
            <CardDescription>
              Review your selection and start AI validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 rounded-xl border-2 border-dashed bg-muted/30">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <FileText className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{selectedFile.name}</p>
                  <p className="text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {submissionType === 'others' ? customType : submissionTypes.find(t => t.value === submissionType)?.label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-info/10 border border-info/30">
              <Sparkles className="w-5 h-5 text-info shrink-0" />
              <p className="text-sm">
                Our AI will analyze format compatibility, naming conventions, file size, and provide 
                actionable recommendations to ensure your submission meets standards.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentStep('type')}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleValidate} disabled={isValidating} className="flex-1 gradient-primary text-primary-foreground">
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start AI Validation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isValidating && (
        <Card className="animate-pulse">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-primary-foreground animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold">AI is analyzing your file...</p>
                <p className="text-muted-foreground mt-2">Checking format, naming conventions, size, and structure</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {currentStep === 'results' && validationResult && selectedFile && (
        <>
          <ValidationResultCard result={validationResult} fileName={selectedFile.name} />
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Validate Another File
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Submissions;
