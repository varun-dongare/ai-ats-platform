from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware # Add this import
from sqlalchemy.orm import Session
from pydantic import BaseModel # <-- ADD THIS LINE
import models
from models import SessionLocal, engine
from nlp_engine import extract_text_from_pdf,extract_skills, calculate_match_score

app = FastAPI(title="AI Recruitment API")

# --- ADD THIS CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, you would put your React app's URL here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ------
# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class StatusUpdate(BaseModel):
    status: str

@app.post("/jobs/")
def create_job(title: str = Form(...), description: str = Form(...), db: Session = Depends(get_db)):
    """Creates a new job posting in the database."""
    new_job = models.Job(title=title, description=description)
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return {"message": "Job created", "job_id": new_job.id}

@app.get("/jobs/")
def get_all_jobs(db: Session = Depends(get_db)):
    """Fetches all job postings from the database."""
    jobs = db.query(models.Job).all()
    return jobs

@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    """Deletes a job posting."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}

@app.post("/upload-resume/")
async def upload_and_score_resume(
    job_id: int = Form(...),
    candidate_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Receives a PDF, scores it against the job, and saves the application."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # 1. Fetch the job description from the Database
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # 2. Extract text from the uploaded PDF
    file_bytes = await file.read()
    resume_text = extract_text_from_pdf(file_bytes)

    # 3. AI Scoring & Extraction
    match_score = calculate_match_score(resume_text, job.description)
    
    from nlp_engine import extract_skills # Make sure to import it at the top of the file ideally, or just call it if already imported
    skills_found = extract_skills(resume_text)

    # 4. Save the Candidate Application to Database
    application = models.Application(
        candidate_name=candidate_name,
        job_id=job.id,
        ai_match_score=match_score,
        extracted_skills=skills_found # <--- SAVE THE SKILLS HERE
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "message": "Resume processed successfully",
        "candidate": candidate_name,
        "match_score": match_score,
        "status": application.status
    }
@app.get("/applications/")
def get_all_applications(db: Session = Depends(get_db)):
    """Fetches all candidate applications to display on the Kanban board."""
    applications = db.query(models.Application).all()
    return applications

@app.put("/applications/{app_id}/status")
def update_application_status(app_id: int, status_update: StatusUpdate, db: Session = Depends(get_db)):
    """Updates a candidate's status when dragged to a new column."""
    application = db.query(models.Application).filter(models.Application.id == app_id).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.status = status_update.status
    db.commit()
    
    return {"message": f"Status updated to {status_update.status}", "id": app_id}
@app.delete("/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    """Deletes a candidate application from the database."""
    application = db.query(models.Application).filter(models.Application.id == app_id).first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(application)
    db.commit()
    
    return {"message": "Application deleted successfully"}