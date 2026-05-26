from sqlalchemy import Column, Integer, String, Float, Text, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- IMPORTANT DATABASE CONFIGURATION ---
# Replace 'postgres' and 'password' with your PostgreSQL username and password.
# Replace 'ats_db' with the name of the database you created in pgAdmin/psql.
DATABASE_URL = "postgresql://postgres:kali@localhost:5432/ats_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Job(Base):
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String)
    job_id = Column(Integer)
    ai_match_score = Column(Float)
    status = Column(String, default="Applied") # Options: Applied, Screening, Interview
    extracted_skills = Column(String, default="") # <--- ADD THIS LINE
    
# This line automatically creates the tables in your database if they don't exist yet
Base.metadata.create_all(bind=engine)