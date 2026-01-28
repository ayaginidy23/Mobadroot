from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Literal, Optional
from enum import Enum
from groq import Groq
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import re

# Load environment variables
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("GROQ_API_KEY is not set in the environment.")

# Initialize Groq client
client = Groq(api_key=api_key)

# Available models
AVAILABLE_MODELS = {
    "llama3-70b": "llama3-70b-8192",
    "llama3-8b": "llama3-8b-8192",
    "gemma": "gemma-7b-it"
}

MODEL = AVAILABLE_MODELS["llama3-70b"]

# Strategy types
class StrategyType(str, Enum):
    TAX = "tax"
    EMPLOYMENT = "employment"
    MARKETING = "marketing"
    FINANCE = "finance"
    GENERAL = "general"

# Initialize FastAPI app
app = FastAPI(
    title="منظومة توليد الاستراتيجيات",
    description="واجهة برمجية لتوليد استراتيجيات أعمال مع مخططات سير العمل",
    version="5.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class StrategyRequest(BaseModel):
    strategy_type: StrategyType
    stage: str
    industry: str
    keywords: List[str]
    preferred_model: Optional[str] = None
    diagram_style: Literal["TD", "LR"] = "TD"  # TD (Top-Down) or LR (Left-Right)

class StrategyResponse(BaseModel):
    success: bool
    strategy: str
    kpis: List[str]
    workflow_diagram: str
    model_used: str
    strategy_type: str

# Helper functions (keep all your existing helper functions exactly as they were)
def is_arabic(text: str) -> bool:
    """Check if the text contains Arabic characters."""
    return bool(re.search(r'[\u0600-\u06FF]', text))

def clean_arabic_text(text: str) -> str:
    """Remove non-Arabic characters (except punctuation and spaces) from the text."""
    return re.sub(r'[^\u0600-\u06FF\s.,:;0-9-]', '', text).strip()

def ensure_complete_sentence(text: str, target_language: str) -> str:
    """Ensure the text ends with a period (or Arabic equivalent)."""
    text = text.strip()
    if target_language == "Arabic":
        if not text.endswith(('،', '۔', '.')):
            text += '۔'
    else:
        if not text.endswith('.'):
            text += '.'
    return text

def extract_workflow_components(strategy: str, target_language: str) -> dict:
    """Extract dynamic components from strategy text to build workflow"""
    components = {
        'research': [],
        'development': [],
        'execution': [],
        'evaluation': [],
        'additional': []
    }
    
    # Split strategy into sentences
    sentences = re.split(r'[.!?]', strategy)
    sentences = [s.strip() for s in sentences if s.strip()]

    # Keywords for each phase (in both languages)
    if target_language == "Arabic":
        research_keywords = ['تحليل', 'دراسة', 'بحث', 'استكشاف', 'جمع', 'مراجعة', 'تحديد']
        development_keywords = ['تطوير', 'بناء', 'تصميم', 'خطة', 'صياغة', 'وضع']
        execution_keywords = ['تنفيذ', 'إطلاق', 'تطبيق', 'بدء', 'تشغيل']
        evaluation_keywords = ['تقييم', 'قياس', 'مراجعة', 'تقييم', 'متابعة', 'تعليقات']
        fallback_research = "تحليل السوق"
        fallback_development = "تطوير الخطة"
        fallback_execution = "مرحلة التنفيذ"
        fallback_evaluation = "التقييم"
    else:  # English
        research_keywords = ['analysis', 'study', 'research', 'explore', 'gather', 'review', 'identify']
        development_keywords = ['develop', 'build', 'design', 'plan', 'formulate', 'outline']
        execution_keywords = ['implement', 'launch', 'execute', 'apply', 'start', 'rollout']
        evaluation_keywords = ['evaluate', 'measure', 'review', 'assess', 'monitor', 'feedback']
        fallback_research = "Market analysis"
        fallback_development = "Develop the plan"
        fallback_execution = "Implementation phase"
        fallback_evaluation = "Evaluation"

    # Consolidate sentences within the same phase
    for sentence in sentences:
        # Check for research phase
        if any(keyword in sentence.lower() for keyword in research_keywords):
            if not components['research']:  # Only add the first matching sentence
                components['research'].append(sentence.strip())
        
        # Check for development phase
        elif any(keyword in sentence.lower() for keyword in development_keywords):
            if not components['development']:
                components['development'].append(sentence.strip())
        
        # Check for execution phase
        elif any(keyword in sentence.lower() for keyword in execution_keywords):
            if not components['execution']:
                components['execution'].append(sentence.strip())
        
        # Check for evaluation phase
        elif any(keyword in sentence.lower() for keyword in evaluation_keywords):
            if not components['evaluation']:
                components['evaluation'].append(sentence.strip())
        
        # If the sentence doesn't fit any category, add it to additional steps
        else:
            phase_count = sum([
                any(keyword in sentence.lower() for keyword in research_keywords),
                any(keyword in sentence.lower() for keyword in development_keywords),
                any(keyword in sentence.lower() for keyword in execution_keywords),
                any(keyword in sentence.lower() for keyword in evaluation_keywords)
            ])
            if phase_count <= 1 and sentence not in components['additional']:
                components['additional'].append(sentence)

    # Fallback if no components are extracted for a phase
    if not components['research']:
        components['research'].append(fallback_research)
    if not components['development']:
        components['development'].append(fallback_development)
    if not components['execution']:
        components['execution'].append(fallback_execution)
    if not components['evaluation']:
        components['evaluation'].append(fallback_evaluation)

    return components

def generate_dynamic_workflow(strategy: str, style: str, target_language: str) -> str:
    """Generate a dynamic workflow diagram based on strategy content"""
    components = extract_workflow_components(strategy, target_language)
    
    # Initialize the Mermaid diagram
    diagram = f"""graph {style}\n"""
    
    # Define nodes dynamically
    nodes = []
    node_id = 0
    node_map = {}  # To map components to node IDs

    # Labels for evaluation outcomes based on language
    if target_language == "Arabic":
        eval_label = "التقييم"
        success_label = "التوسع"
        failure_label = "إعادة التخطيط"
        success_edge = "نجاح"
        improve_edge = "تحسين"
        failure_edge = "فشل"
    else:
        eval_label = "Evaluation"
        success_label = "Expand"
        failure_label = "Re-plan"
        success_edge = "Success"
        improve_edge = "Improve"
        failure_edge = "Failure"

    # Add research phase node (only one)
    node_id += 1
    node_map['research'] = f"A{node_id}"
    nodes.append(f"{node_map['research']}[\"{components['research'][0]}\"]")
    
    # Add development phase node (only one)
    node_id += 1
    node_map['development'] = f"A{node_id}"
    nodes.append(f"{node_map['development']}[\"{components['development'][0]}\"]")
    
    # Add execution phase node (only one)
    node_id += 1
    node_map['execution'] = f"A{node_id}"
    nodes.append(f"{node_map['execution']}[\"{components['execution'][0]}\"]")
    
    # Add evaluation phase node (only one)
    node_id += 1
    node_map['evaluation'] = f"A{node_id}"
    nodes.append(f"{node_map['evaluation']}{{\"{eval_label}\"}}")  # Diamond shape for evaluation
    
    # Add additional steps (if any) as parallel paths
    for i, add in enumerate(components['additional'][:2]):  # Limit to 2 to avoid clutter
        node_id += 1
        node_map[f"additional_{i}"] = f"A{node_id}"
        nodes.append(f"{node_map[f'additional_{i}']}[\"{add[:20]}...\"]")  # Shorten for clarity

    # Define relationships (simplified linear flow)
    relationships = [
        f"{node_map['research']} --> {node_map['development']}",
        f"{node_map['development']} --> {node_map['execution']}",
        f"{node_map['execution']} --> {node_map['evaluation']}"
    ]
    
    # Add evaluation outcomes (success, improve, failure)
    node_id += 1
    success_node = f"A{node_id}"
    nodes.append(f"{success_node}[\"{success_label}\"]")
    relationships.append(f"{node_map['evaluation']} -->|{success_edge}| {success_node}")

    node_id += 1
    relationships.append(f"{node_map['evaluation']} -->|{improve_edge}| {node_map['execution']}")  # Loop back to execution

    node_id += 1
    failure_node = f"A{node_id}"
    nodes.append(f"{failure_node}[\"{failure_label}\"]")
    relationships.append(f"{node_map['evaluation']} -->|{failure_edge}| {failure_node}")

    # Add additional steps as parallel paths (if any)
    if components['additional']:
        for i in range(len(components['additional'][:2])):
            relationships.append(f"{node_map['development']} --> {node_map[f'additional_{i}']}")
            relationships.append(f"{node_map[f'additional_{i}']} --> {node_map['execution']}")

    # Combine nodes and relationships into the diagram
    diagram += "\n".join(nodes) + "\n"
    diagram += "\n".join(relationships) + "\n"

    # Add styling
    diagram += """
    %% Styling
    style A1 fill:#4CAF50,stroke:#388E3C,color:white
    classDef evaluation fill:#FFC107,stroke:#FFA000
    classDef success fill:#4CAF50,stroke:#388E3C,color:white
    classDef failure fill:#F44336,stroke:#D32F2F,color:white
    classDef default fill:#f8f9fa,stroke:#495057,color:#333
    class A4 evaluation;
    class A5 success;
    class A6 failure;
    """

    return diagram

@app.get("/strategy-types")
async def get_strategy_types():
    """Get available strategy types with descriptions"""
    return {
        "tax": {
            "name": {"ar": "الضرائب", "en": "Tax"},
            "description": {
                "ar": "استراتيجيات لتحسين الإدارة الضريبية وتقليل الالتزامات",
                "en": "Strategies for tax optimization and compliance"
            },
            "keywords": {
                "ar": ["ضريبة", "إقرار ضريبي", "تخفيض ضريبي"],
                "en": ["tax", "tax filing", "tax reduction"]
            }
        },
        "employment": {
            "name": {"ar": "التوظيف", "en": "Employment"},
            "description": {
                "ar": "استراتيجيات لتوظيف الكفاءات وإدارة الموارد البشرية",
                "en": "Strategies for talent acquisition and HR management"
            },
            "keywords": {
                "ar": ["توظيف", "توظيف العمالة", "سياسة التوظيف"],
                "en": ["employment", "hiring", "recruitment policy"]
            }
        },
        "marketing": {
            "name": {"ar": "التسويق", "en": "Marketing"},
            "description": {
                "ar": "استراتيجيات لتعزيز العلامة التجارية وزيادة المبيعات",
                "en": "Strategies for brand promotion and sales growth"
            },
            "keywords": {
                "ar": ["تسويق", "حملة تسويقية", "استراتيجية تسويق"],
                "en": ["marketing", "campaign", "marketing strategy"]
            }
        },
        "finance": {
            "name": {"ar": "التمويل", "en": "Finance"},
            "description": {
                "ar": "استراتيجيات لإدارة التدفقات المالية والاستثمار",
                "en": "Strategies for financial management and investment"
            },
            "keywords": {
                "ar": ["تمويل", "إدارة مالية", "استثمار"],
                "en": ["finance", "financial management", "investment"]
            }
        },
        "general": {
            "name": {"ar": "عام", "en": "General"},
            "description": {
                "ar": "استراتيجيات أعمال عامة تناسب مختلف المجالات",
                "en": "General business strategies suitable for various fields"
            },
            "keywords": {
                "ar": ["استراتيجية", "خطة عمل", "تطوير أعمال"],
                "en": ["strategy", "business plan", "business development"]
            }
        }
    }

@app.post("/generate-strategy", response_model=StrategyResponse)
async def generate_strategy(request: StrategyRequest):
    """Generate business strategy with visual workflow diagram"""
    # Input validation
    if not all([request.stage, request.industry]):
        raise HTTPException(
            status_code=400,
            detail="Stage and industry are required"
        )

    if len(request.keywords) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 keywords allowed"
        )

    # Model selection
    model_to_use = MODEL
    if request.preferred_model:
        if request.preferred_model in AVAILABLE_MODELS.values():
            model_to_use = request.preferred_model
        else:
            available = list(AVAILABLE_MODELS.values())
            raise HTTPException(
                status_code=400,
                detail=f"Model not available. Options: {', '.join(available)}"
            )

    # Get strategy type info
    strategy_types = await get_strategy_types()
    strategy_info = strategy_types[request.strategy_type.value]
    
    # Detect input language based on industry and keywords
    combined_input = request.industry + " " + " ".join(request.keywords)
    target_language = "Arabic" if is_arabic(combined_input) else "English"
    
    # Add strategy type keywords to user keywords
    enhanced_keywords = request.keywords + strategy_info["keywords"]["ar" if target_language == "Arabic" else "en"]
    strategy_name = strategy_info["name"]["ar" if target_language == "Arabic" else "en"]

    # Generate prompt based on strategy type
    if target_language == "Arabic":
        prompt = f"""
بصفتك خبير استراتيجي أعمال متخصص في مجال {strategy_name}، قم بإنشاء:
1. استراتيجية {strategy_name} واضحة لـ: {request.industry} (مرحلة: {request.stage})
2. ثلاثة مؤشرات أداء رئيسية (KPIs) خاصة ب {strategy_name}

الكلمات المفتاحية: {', '.join(enhanced_keywords)}

أكتب الاستراتيجية في فقرة واحدة متكاملة تحتوي على:
- تحليل السوق
- تطوير الخطة
- التنفيذ
- التقييم

يجب أن تكون الفقرة كاملة ومكتملة الجمل، ولا تتوقف في منتصف الجملة.
ثم اذكر المؤشرات الرئيسية (KPIs) في قسم منفصل بعد الاستراتيجية مباشرة، كل مؤشر في سطر منفصل.
التنسيق المطلوب:
### الاستراتيجية
[الاستراتيجية هنا]
### مؤشرات الأداء الرئيسية
- [KPI 1]
- [KPI 2]
- [KPI 3]
"""
        system_message = f"أنت مستشار أعمال محترف متخصص في {strategy_name}. اكتب استراتيجية واضحة في فقرة واحدة متكاملة تحتوي على مراحل: البحث، التطوير، التنفيذ، والتقييم. يجب أن تكون الفقرة كاملة ومكتملة الجمل. ثم اذكر 3 مؤشرات أداء رئيسية (KPIs) في قسم منفصل. كل النصوص يجب أن تكون باللغة العربية فقط، بدون أي حروف أو كلمات من لغات أخرى."
    else:  # English
        prompt = f"""
As a {strategy_name} business strategy expert, create:
1. A clear {strategy_name.lower()} strategy for: {request.industry} (stage: {request.stage})
2. Three key performance indicators (KPIs) specific to {strategy_name.lower()}

Keywords: {', '.join(enhanced_keywords)}

Write the strategy in a single, cohesive paragraph that includes:
- Market analysis
- Plan development
- Implementation
- Evaluation

The paragraph must be complete and not cut off mid-sentence.
Then list the key performance indicators (KPIs) in a separate section directly after the strategy, each on a new line.
Required format:
### Strategy
[The strategy paragraph here]
### KPIs
- [KPI 1]
- [KPI 2]
- [KPI 3]
"""
        system_message = f"You are a professional business consultant specializing in {strategy_name.lower()}. Write a clear strategy in a single cohesive paragraph that includes the phases: research, development, implementation, and evaluation. The paragraph must be complete and not cut off mid-sentence. Then list 3 key performance indicators (KPIs) in a separate section. All text must be in English only, with no characters or words from other languages."

    try:
        # Get AI response
        completion = client.chat.completions.create(
            model=model_to_use,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=3000
        )
        content = completion.choices[0].message.content

        # Process response
        strategy = ""
        kpis = []

        if target_language == "Arabic":
            if "### الاستراتيجية" in content and "### مؤشرات الأداء الرئيسية" in content:
                strategy_part = content.split("### مؤشرات الأداء الرئيسية")[0]
                strategy = strategy_part.split("### الاستراتيجية")[1].strip()
                kpis_part = content.split("### مؤشرات الأداء الرئيسية")[1].strip()
                kpis = [kpi.strip("- ").strip() for kpi in kpis_part.split("\n") if kpi.strip()][:3]
            else:
                strategy = content
                kpis = [
                    f"معدل رضا العملاء في {strategy_name}: يتم قياسه من خلال استطلاعات الرأي",
                    f"معدل تحسين الأداء في {strategy_name}: يتم قياسه بتتبع المقاييس الرئيسية",
                    f"معدل توفير التكاليف في {strategy_name}: يتم قياسه بتحليل بيانات التكلفة"
                ]
            # Clean the strategy and KPIs
            strategy = clean_arabic_text(strategy)
            strategy = ensure_complete_sentence(strategy, target_language)
            kpis = [clean_arabic_text(kpi) for kpi in kpis]
        else:
            if "### Strategy" in content and "### KPIs" in content:
                strategy_part = content.split("### KPIs")[0]
                strategy = strategy_part.split("### Strategy")[1].strip()
                kpis_part = content.split("### KPIs")[1].strip()
                kpis = [kpi.strip("- ").strip() for kpi in kpis_part.split("\n") if kpi.strip()][:3]
            else:
                strategy = content
                kpis = [
                    f"Customer satisfaction rate in {strategy_name.lower()}: Measured through surveys",
                    f"Performance improvement rate in {strategy_name.lower()}: Tracked via key metrics",
                    f"Cost savings rate in {strategy_name.lower()}: Analyzed through cost data"
                ]
            strategy = ensure_complete_sentence(strategy, target_language)

        # Generate workflow diagram
        workflow_diagram = generate_dynamic_workflow(
            strategy=strategy,
            style=request.diagram_style,
            target_language=target_language
        )

        return StrategyResponse(
            success=True,
            strategy=strategy,
            kpis=kpis,
            workflow_diagram=workflow_diagram,
            model_used=model_to_use,
            strategy_type=strategy_name
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"System error: {str(e)}"
        )

@app.get("/health")
async def health_check():
    return {"status": "Working", "model": MODEL}

@app.get("/")
async def root():
    return {"message": "Welcome to the Strategy Generator System"}