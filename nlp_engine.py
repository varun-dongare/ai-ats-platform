import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer, util
import re # <--- ADD THIS LINE
import json # <--- ADD THIS
import os   # <--- ADD THIS

# Load the model globally so it only loads once when the server starts
print("Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded successfully!")

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts raw text from a PDF file byte stream."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text.strip()

def calculate_match_score(resume_text: str, job_description: str) -> float:
    """Calculates a hybrid score based on AI semantic meaning and exact skill overlap."""
    
    # 1. Calculate the base Semantic AI Score (Context)
    embeddings1 = model.encode(resume_text, convert_to_tensor=True)
    embeddings2 = model.encode(job_description, convert_to_tensor=True)
    semantic_score = util.pytorch_cos_sim(embeddings1, embeddings2).item()
    
    # Normalize semantic score (sometimes it drops below 0, we want it between 0 and 1)
    semantic_score = max(0.0, semantic_score)

    # 2. Calculate the exact Keyword Score
    # Extract skills from both the resume AND the job description
    # Note: ensure extract_skills is defined above this function in the file, or it's accessible.
    resume_skills = set(extract_skills(resume_text).split(", "))
    job_skills = set(extract_skills(job_description).split(", "))
    
    # Remove empty strings just in case
    resume_skills.discard("")
    job_skills.discard("")

    if len(job_skills) == 0:
        # If the HR person didn't list any specific skills, just use the AI context score
        keyword_score = semantic_score 
    else:
        # Count how many required job skills the candidate actually has
        matched_skills = job_skills.intersection(resume_skills)
        keyword_score = len(matched_skills) / len(job_skills)

    # 3. The Hybrid Formula: 70% exact skills, 30% overall context
    final_score = (keyword_score * 0.70) + (semantic_score * 0.30)
    
    # Ensure it doesn't accidentally go over 100%
    return min(1.0, final_score)# Load the dictionary ONCE when the server starts, not every time a resume is uploaded.
# This makes the app much faster!
SKILLS_FILE = os.path.join(os.path.dirname(__file__), "skills.json")
try:
    with open(SKILLS_FILE, "r") as f:
        SKILL_DICTIONARY = json.load(f)
except FileNotFoundError:
    print("Warning: skills.json not found. Using empty dictionary.")
    SKILL_DICTIONARY = {}

def extract_skills(resume_text: str) -> str:
    """Extracts skills using a robust external JSON dictionary mapping."""
    
    text_clean = resume_text.lower().replace('\n', ' ')
    found_skills = set() 
    
    # Iterate through the keys (e.g., "python", "aws", "p&l")
    for search_term, display_name in SKILL_DICTIONARY.items():
        
        # Strict word boundaries to prevent false positives (e.g., "C" inside "React")
        pattern = r'(?<![a-z0-9])' + re.escape(search_term) + r'(?![a-z0-9])'
        
        if re.search(pattern, text_clean):
            # If found, add the properly formatted display name!
            found_skills.add(display_name)
                
    return ", ".join(sorted(found_skills))