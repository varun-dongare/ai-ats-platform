import { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

const COLUMNS = ['Applied', 'Screening', 'Interview', 'Offered'];

// ==========================================
// PAGE 1: THE JOBS DASHBOARD
// ==========================================
// ==========================================
// PAGE 1: THE JOBS DASHBOARD
// ==========================================
function JobsDashboard() {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/jobs/');
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  // NEW: Auto-capitalize functions for Job inputs
  const handleTitleChange = (e) => {
    setTitle(e.target.value.replace(/\b\w/g, (char) => char.toUpperCase()));
  };

  const handleDescChange = (e) => {
    setDescription(e.target.value.replace(/\b\w/g, (char) => char.toUpperCase()));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);

    try {
      await axios.post('http://127.0.0.1:8000/jobs/', formData);
      setTitle('');
      setDescription('');
      fetchJobs();
      alert("Job Created Successfully!");
    } catch (error) {
      console.error("Error creating job:", error);
      // NEW: Alert you if the backend is down!
      alert("Failed to create job! Please check your Python terminal to ensure the server is running.");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Delete this job? This won't delete the candidates.")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/jobs/${id}`);
      fetchJobs();
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  return (
    <div className="dashboard-page">
      <h2>🏢 Manage Job Postings</h2>
      
      <div className="upload-section">
        <form onSubmit={handleCreateJob} className="upload-form">
          {/* UPDATED: Now using the new capitalize functions */}
          <input type="text" placeholder="Job Title (e.g. React Developer)" value={title} onChange={handleTitleChange} required />
          <input type="text" placeholder="Required Skills (e.g. React, Node, SQL)" value={description} onChange={handleDescChange} required style={{ flex: 2 }} />
          <button type="submit">Create Job</button>
        </form>
      </div>

      <div className="jobs-list">
        {jobs.map(job => (
          <div key={job.id} className="job-card">
            <div>
              <h3>{job.title} <span>(ID: {job.id})</span></h3>
              <p>{job.description}</p>
            </div>
            <button className="delete-btn" onClick={() => handleDeleteJob(job.id)}>✕ Delete</button>
          </div>
        ))}
        {jobs.length === 0 && <p>No active jobs. Create one above!</p>}
      </div>
    </div>
  );
}

// ==========================================
// PAGE 2: THE CANDIDATE PIPELINE (KANBAN)
// ==========================================
function KanbanBoard() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]); 
  
  const [name, setName] = useState('');
  const [jobId, setJobId] = useState(''); 
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // NEW: State to control the Pop-up Modal
  const [selectedApp, setSelectedApp] = useState(null);

  const handleNameChange = (e) => {
    const input = e.target.value;
    setName(input.replace(/\b\w/g, (char) => char.toUpperCase()));
  };

  useEffect(() => {
    fetchApplications();
    fetchJobs(); 
    setIsMounted(true);
  }, []);

  const fetchApplications = async () => {
    const response = await axios.get('http://127.0.0.1:8000/applications/');
    setApplications(response.data);
  };

  const fetchJobs = async () => {
    const response = await axios.get('http://127.0.0.1:8000/jobs/');
    setJobs(response.data);
    if (response.data.length > 0) setJobId(response.data[0].id);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('candidate_name', name);
    formData.append('job_id', jobId);
    formData.append('file', file);

    try {
      await axios.post('http://127.0.0.1:8000/upload-resume/', formData);
      fetchApplications();
      setName('');
      setFile(null);
    } catch (error) {
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevents the modal from opening when you click delete
    if (!window.confirm("Delete this candidate?")) return;
    await axios.delete(`http://127.0.0.1:8000/applications/${id}`);
    fetchApplications();
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const newStatus = destination.droppableId;
    const updatedApps = applications.map(app => 
      app.id.toString() === draggableId ? { ...app, status: newStatus } : app
    );
    setApplications(updatedApps);

    try {
      await axios.put(`http://127.0.0.1:8000/applications/${draggableId}/status`, { status: newStatus });
    } catch (error) {
      fetchApplications(); 
    }
  };

  return (
    <div className="dashboard-page">
      <div className="upload-section">
        <form onSubmit={handleUpload} className="upload-form">
          <input type="text" placeholder="Candidate Name" value={name} onChange={handleNameChange} required />
          <select value={jobId} onChange={e => setJobId(e.target.value)} required>
            {jobs.length === 0 ? <option value="">Create a job first!</option> : null}
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
          <button type="submit" disabled={loading || jobs.length === 0}>
            {loading ? "AI is Parsing..." : "Upload Resume"}
          </button>
        </form>
      </div>

      {isMounted && (
        <DragDropContext onDragEnd={onDragEnd}>        
          <div className="kanban-board">
            {COLUMNS.map(columnStatus => {
              const columnApps = applications.filter(app => app.status === columnStatus);
              return (
                <div key={columnStatus} className="kanban-column-wrapper">
                  <h2>{columnStatus} ({columnApps.length})</h2>
                  <Droppable droppableId={columnStatus}>
                    {(provided) => (
                      <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
                        {columnApps.map((app, index) => (
                          <Draggable key={app.id.toString()} draggableId={app.id.toString()} index={index}>
                            {(provided) => (
                              <div 
                                className="candidate-card" 
                                ref={provided.innerRef} 
                                {...provided.draggableProps} 
                                {...provided.dragHandleProps} 
                                style={provided.draggableProps.style}
                                onClick={() => setSelectedApp(app)} /* NEW: Opens Modal */
                              >
                                <div className="card-header">
                                  <h3>{app.candidate_name}</h3>
                                  <button className="delete-btn" onClick={(e) => handleDelete(e, app.id)}>✕</button>
                                </div>
                                <div className="score-badge">AI Match: {Math.round(app.ai_match_score * 100)}%</div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* NEW: The Pop-up Modal Component */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => setSelectedApp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedApp(null)}>✕</button>
            <h2>{selectedApp.candidate_name}</h2>
            <div className="modal-stats">
              <span className="modal-badge status">{selectedApp.status}</span>
              <span className="modal-badge score">AI Match: {Math.round(selectedApp.ai_match_score * 100)}%</span>
            </div>
            
            <div className="modal-skills-section">
              <h3>Extracted Skills</h3>
              <div className="skills-container">
                {selectedApp.extracted_skills ? (
                  selectedApp.extracted_skills.split(',').map((skill, index) => (
                    <span key={index} className="skill-tag">{skill.trim()}</span>
                  ))
                ) : (
                  <p className="no-skills">No specific tech skills detected by AI.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN APP COMPONENT (Handles the Routing)
// ==========================================
function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <h1>AI-Powered ATS</h1>
          <div className="nav-links">
            <Link to="/jobs" className="nav-btn">Job Postings</Link>
            <Link to="/" className="nav-btn">Job Tracker</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/jobs" element={<JobsDashboard />} />
          <Route path="/" element={<KanbanBoard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;