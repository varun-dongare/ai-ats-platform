# 🚀 AI-Powered Applicant Tracking System (ATS)

A robust, full-stack Applicant Tracking System designed to streamline hiring pipelines using AI-driven resume analysis. Built from scratch with a custom NLP engine to help recruiters identify top talent faster.

## 🛠️ Tech Stack

**Core Architecture:**
* **Backend:** FastAPI (Python) for asynchronous API handling.
* **Frontend:** React.js (Vite) with a modern component-based UI.
* **AI/ML:** `sentence-transformers` for semantic job-to-resume matching, combined with a custom Regex-based skill extraction engine.
* **Database:** PostgreSQL (SQLAlchemy ORM).
* **Workflow:** Interactive Kanban board utilizing `@hello-pangea/dnd`.

## ✨ Key Features

* **Semantic AI Matching:** Calculates a hybrid score based on both context (cosine similarity) and exact skill overlap.
* **Intelligent Skill Extraction:** A comprehensive, configurable skill parser that identifies tech, engineering, and business skills from PDFs.
* **Job & Candidate Management:** A multi-page dashboard to manage open job postings and track candidates through a customized hiring pipeline.
* **Professional UI/UX:** Built with a clean, dark-mode-ready interface and responsive components.

## 🚀 Getting Started

### Prerequisites
* Python 3.8+
* Node.js & npm
* PostgreSQL

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Varun-Dongare/ai-ats-platform.git](https://github.com/Varun-Dongare/ai-ats-platform.git)
   cd ai-ats-platform
