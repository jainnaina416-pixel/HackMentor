from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, ConfigDict

# --- Sub-models ---
class SimilarProjectItem(BaseModel):
    title: str
    summary: str
    relevance_score: Optional[float] = None
    technologies: List[str] = Field(default_factory=list)
    awards: List[str] = Field(default_factory=list)
    source_url: Optional[str] = None

class SourceCitation(BaseModel):
    source_id: str
    title: str
    excerpt: str
    relevance: Optional[float] = None
    url: Optional[str] = None

# --- Feature A: Problem/Idea Analysis Response ---
class ProblemAnalysisResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    problem_summary: str = Field(..., alias="simpleWords")
    target_users: List[str] = Field(..., alias="targetUsers")
    core_requirements: List[str] = Field(..., alias="requirements")
    constraints_and_assumptions: List[str] = Field(..., alias="constraints")
    proposed_solution_assessment: str = Field(default="", alias="coreProblem")
    similar_historical_projects: List[SimilarProjectItem] = Field(default_factory=list)
    missing_requirements: List[str] = Field(default_factory=list, alias="importantQuestions")
    risks: List[str] = Field(default_factory=list)
    recommended_next_steps: List[str] = Field(default_factory=list, alias="possibleDirections")
    sources_used: List[SourceCitation] = Field(default_factory=list)

# --- Feature B: Ask Mentor Response ---
class MentorChatResponse(BaseModel):
    message: str
    conversation_id: str
    sources: List[SourceCitation] = Field(default_factory=list)

# --- Feature C: Project Review Response ---
class ProjectReviewResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    problem_solution_fit: str = Field(..., alias="problem")
    technical_feasibility: str = Field(..., alias="feasibility")
    innovation_and_differentiation: str = Field(..., alias="innovation")
    completeness: str = Field(..., alias="solution")
    user_experience: str = Field(..., alias="userExperience")
    risks: Union[str, List[str]]
    missing_pieces: Union[str, List[str]] = Field(..., alias="missingPieces")
    recommended_improvements: List[str] = Field(..., alias="recommendedNextSteps")
    relevant_historical_comparisons: List[SimilarProjectItem] = Field(default_factory=list)
    evidence_and_sources: List[SourceCitation] = Field(default_factory=list)
    technical_implementation: str = Field(default="", alias="technicalImplementation")

# --- Feature D: Pitch Generation Response ---
class SlideItem(BaseModel):
    slide_number: int
    title: str
    bullets: List[str]

class JudgeQuestionItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    question: str
    suggested_answer: str = Field(..., alias="suggestedAnswer")

class PitchGenerationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    project_title_and_tagline: str = Field(..., alias="pitch")
    problem: str = Field(..., alias="problemExplanation")
    proposed_solution: str = Field(..., alias="solutionExplanation")
    target_users_and_impact: str
    key_features: List[str] = Field(default_factory=list, alias="talkingPoints")
    technical_architecture_explanation: str = Field(..., alias="architectureExplanation")
    differentiation: str
    demo_sequence: List[str] = Field(default_factory=list, alias="demoFlow")
    suggested_slide_outline: List[Union[str, SlideItem]] = Field(default_factory=list, alias="structure")
    likely_judge_questions: List[JudgeQuestionItem] = Field(default_factory=list, alias="judgeQuestions")
    missing_information_to_fill: List[str] = Field(default_factory=list)

# --- PDF Upload Response ---
class PDFUploadResponse(BaseModel):
    document_id: str
    project_id: str
    filename: str
    file_size: int
    extracted_text_preview: str
    page_count: int
    is_ocr_required: bool
    status_message: str
    uploaded_at: str
    bucket: Optional[str] = None
    s3_key: Optional[str] = None
    s3_uri: Optional[str] = None

# --- Health Check Response ---
class HealthResponse(BaseModel):
    status: str
    version: str
    llm_provider: str
    embedding_provider: str
    vector_store_status: str
    database_status: str
