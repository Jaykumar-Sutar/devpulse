'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email?: string;
  role: string;
}

interface Project {
  id: number;
  title?: string;
  name?: string;
  description: string;
}

interface Task {
  id: number;
  title?: string;
  name?: string;
  task_name?: string;
  description?: string;
  status: string;
  project_id?: number;
  projectId?: number;
  assigned_to?: number;
  userId?: number;
  user_id?: number;
}

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Form input states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');

  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');

  // Filter States for Interactivity
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://devpulse-5fvi.onrender.com';

  const fetchData = async () => {
    try {
      const [usersRes, projectsRes, tasksRes] = await Promise.all([
        fetch(`${API_URL}/api/users`),
        fetch(`${API_URL}/api/projects`),
        fetch(`${API_URL}/api/tasks`),
      ]);
      const usersData = await usersRes.json();
      const projectsData = await projectsRes.json();
      const tasksData = await tasksRes.json();

      setUsers(usersData);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserRole.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole.trim(),
        }),
      });
      if (res.ok) {
        setNewUserName('');
        setNewUserEmail('');
        setNewUserRole('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  // Create Project Handler
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProjectTitle.trim(),
          description: newProjectDesc.trim(),
        }),
      });
      if (res.ok) {
        setNewProjectTitle('');
        setNewProjectDesc('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }
  };

  // Create Task Handler
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          project_id: newTaskProjectId ? Number(newTaskProjectId) : (selectedProjectId || projects[0]?.id || 1),
          assigned_to: newTaskAssignedTo ? Number(newTaskAssignedTo) : (selectedUserId || users[0]?.id || 1),
          status: 'In Progress',
        }),
      });

      if (res.ok) {
        setNewTaskTitle('');
        setNewTaskProjectId('');
        setNewTaskAssignedTo('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  // Update Task Status Handler
  const handleUpdateStatus = async (taskId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'In Progress' : 'Completed';
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Delete Task Handler
  const handleDeleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (userId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  // Delete Project Handler
  const handleDeleteProject = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  // Flexible Filter logic supporting multiple database key variations
  const filteredTasks = tasks.filter((task) => {
    const taskProjectId = task.project_id ?? task.projectId;
    const taskUserId = task.assigned_to ?? task.userId ?? task.user_id;

    if (selectedProjectId && taskProjectId !== selectedProjectId) return false;
    if (selectedUserId && taskUserId !== selectedUserId) return false;
    return true;
  });

  // Strict Filter for projects associated with the selected user's tasks
  const filteredProjects = projects.filter((project) => {
    if (!selectedUserId) return true;
    const hasAssignedTask = tasks.some((task) => {
      const taskProjectId = task.project_id ?? task.projectId;
      const taskUserId = task.assigned_to ?? task.userId ?? task.user_id;
      return taskProjectId === project.id && taskUserId === selectedUserId;
    });
    return hasAssignedTask;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-indigo-400 font-medium text-lg gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
        Loading DevPulse Enterprise Workspace...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20 relative overflow-hidden">
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Enterprise Navbar */}
      <nav className="border-b border-indigo-500/20 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 px-8 py-4 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.6)] text-xl font-black">
            ⚡
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              DevPulse <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-semibold shadow-[0_0_10px_rgba(99,102,241,0.3)]">v1.0 Enterprise</span>
            </h1>
            <p className="text-xs text-slate-400">Engineering Analytics & Task Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {(selectedProjectId || selectedUserId) && (
            <button
              onClick={() => { setSelectedProjectId(null); setSelectedUserId(null); }}
              className="text-xs bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-full font-medium transition cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.2)]"
            >
              Reset Filters ✕
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs text-emerald-400 font-medium shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]"></span>
            Neon DB Connected
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 pt-10 relative z-10">
        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/60 border border-indigo-500/30 p-5 rounded-2xl backdrop-blur flex items-center justify-between shadow-[0_0_25px_rgba(99,102,241,0.1)]">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Users</p>
              <p className="text-2xl font-extrabold text-indigo-400 mt-1">{users.length}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl text-xl border border-indigo-500/20">👤</div>
          </div>

          <div className="bg-slate-900/60 border border-amber-500/30 p-5 rounded-2xl backdrop-blur flex items-center justify-between shadow-[0_0_25px_rgba(245,158,11,0.1)]">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Projects</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{projects.length}</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl text-xl border border-amber-500/20">📁</div>
          </div>

          <div className="bg-slate-900/60 border border-emerald-500/30 p-5 rounded-2xl backdrop-blur flex items-center justify-between shadow-[0_0_25px_rgba(16,185,129,0.1)]">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Tasks</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{tasks.length}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl text-xl border border-emerald-500/20">📝</div>
          </div>
        </div>

        {/* Top Creation Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 1. Add User Form */}
          <div className="bg-slate-900/80 border border-indigo-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.15)] backdrop-blur flex flex-col justify-between">
            <h2 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center gap-2">
              <span>👤</span> Add New Team Member
            </h2>
            <form onSubmit={handleCreateUser} className="flex flex-col gap-2.5">
              <input
                type="text"
                name="userName"
                id="userName"
                autoComplete="name"
                placeholder="Name (e.g., Alex)"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
              <input
                type="email"
                name="userEmail"
                id="userEmail"
                autoComplete="email"
                placeholder="Email (e.g., alex@landmark.com)"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
              <input
                type="text"
                name="userRole"
                id="userRole"
                autoComplete="organization-title"
                placeholder="Role (e.g., Backend Lead)"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl font-semibold text-xs transition shadow-[0_0_15px_rgba(99,102,241,0.5)] cursor-pointer mt-1">
                Add User
              </button>
            </form>
          </div>

          {/* 2. Add Project Form */}
          <div className="bg-slate-900/80 border border-amber-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.15)] backdrop-blur flex flex-col justify-between">
            <h2 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <span>📁</span> Add New Project
            </h2>
            <form onSubmit={handleCreateProject} className="flex flex-col gap-2.5">
              <input
                type="text"
                name="projectTitle"
                id="projectTitle"
                autoComplete="off"
                placeholder="Project Title"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
              />
              <textarea
                name="projectDescription"
                id="projectDescription"
                autoComplete="off"
                placeholder="Short Description"
                rows={2}
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs resize-none"
              />
              <button type="submit" className="bg-amber-600 hover:bg-amber-500 py-2.5 rounded-xl font-semibold text-xs transition shadow-[0_0_15px_rgba(245,158,11,0.5)] cursor-pointer mt-1">
                Add Project
              </button>
            </form>
          </div>

          {/* 3. Create Task Form */}
          <div className="bg-slate-900/80 border border-emerald-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.15)] backdrop-blur flex flex-col justify-between">
            <h2 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <span>✨</span> Create New Task
            </h2>
            <form onSubmit={handleCreateTask} className="flex flex-col gap-2.5">
              <input
                type="text"
                name="taskTitle"
                id="taskTitle"
                autoComplete="off"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="taskProject"
                  id="taskProject"
                  autoComplete="off"
                  value={newTaskProjectId}
                  onChange={(e) => setNewTaskProjectId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title || p.name}</option>
                  ))}
                </select>
                <select
                  name="taskAssignee"
                  id="taskAssignee"
                  autoComplete="off"
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Assign To</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 py-2.5 rounded-xl font-semibold text-xs transition shadow-[0_0_15px_rgba(16,185,129,0.5)] cursor-pointer mt-1">
                Add Task
              </button>
            </form>
          </div>
        </div>

        {/* 3-Column Enterprise Data Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Users Column */}
          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur">
            <h3 className="text-base font-bold mb-4 text-indigo-400 flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="flex items-center gap-2">👤 Team Members</span>
              <span className="text-[10px] text-slate-500 font-normal">(Click to filter)</span>
            </h3>
            {users.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No users found.</p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => {
                  const isSelected = selectedUserId === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserId(isSelected ? null : user.id)}
                      className={`p-4 rounded-xl transition cursor-pointer border flex justify-between items-start ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                          : 'bg-slate-950/70 border-slate-800/70 hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                          {user.name}
                          {isSelected && <span className="text-[10px] text-indigo-400 font-bold">Active ✓</span>}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{user.email || 'No email provided'}</p>
                        <p className="text-xs text-indigo-300/80 mt-0.5 font-medium">{user.role}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteUser(user.id, e)}
                        className="text-xs text-rose-400 hover:text-rose-300 p-1 transition cursor-pointer font-medium"
                        title="Delete User"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Projects Column */}
          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur">
            <h3 className="text-base font-bold mb-4 text-amber-400 flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="flex items-center gap-2">📁 Projects</span>
              <span className="text-[10px] text-slate-500 font-normal">(Click to filter)</span>
            </h3>
            {filteredProjects.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No projects found for this user.</p>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => {
                  const isSelected = selectedProjectId === project.id;
                  return (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProjectId(isSelected ? null : project.id)}
                      className={`p-4 rounded-xl transition cursor-pointer border flex justify-between items-start ${
                        isSelected
                          ? 'bg-amber-950/80 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                          : 'bg-slate-950/70 border-slate-800/70 hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                          {project.title || project.name}
                          {isSelected && <span className="text-[10px] text-amber-400 font-bold">Active ✓</span>}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteProject(project.id, e)}
                        className="text-xs text-rose-400 hover:text-rose-300 p-1 transition cursor-pointer font-medium"
                        title="Delete Project"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tasks Column */}
          <div className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur">
            <h3 className="text-base font-bold mb-4 text-emerald-400 flex items-center gap-2 border-b border-slate-800/60 pb-3">
              <span>📝</span> Tasks & Workflow
            </h3>
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No tasks found for this filter.</p>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task, index) => {
                  const assignedProject = projects.find(p => p.id === (task.project_id || task.projectId));
                  const assignedUser = users.find(u => u.id === (task.assigned_to || task.userId || task.user_id));

                  return (
                    <div key={task.id || index} className="p-4 bg-slate-950/70 border border-slate-800/70 rounded-xl hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition shadow-sm flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <p className="font-bold text-white text-sm tracking-wide">
                            {task.title || task.task_name || task.name || task.description || 'Untitled Task'}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            task.status === 'Completed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          }`}>
                            {task.status || 'In Progress'}
                          </span>
                        </div>

                        {/* Project & Assignee Badges */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {assignedProject && (
                            <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium">
                              📁 {assignedProject.title || assignedProject.name}
                            </span>
                          )}
                          {assignedUser && (
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-medium">
                              👤 {assignedUser.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                        <button
                          onClick={() => handleUpdateStatus(task.id, task.status)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer"
                        >
                          Toggle Status
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 font-medium transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}