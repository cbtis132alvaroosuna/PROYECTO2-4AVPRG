import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon, FiCalendar, FiSearch, FiCheck, FiEdit2, FiTrash2, FiClock, FiArchive } from 'react-icons/fi';
import './App.css';

const App = () => {
  // Estados
  const [tasks, setTasks] = useState([]);
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [timeLeft, setTimeLeft] = useState({});
  const intervalRef = useRef({});

  // Cargar datos al iniciar
  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const savedDeleted = JSON.parse(localStorage.getItem('deletedTasks')) || [];
    const savedDarkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
    
    setTasks(savedTasks);
    setDeletedTasks(savedDeleted);
    setDarkMode(savedDarkMode);
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [tasks, deletedTasks, darkMode]);

  // Calcular tiempo restante para cada tarea
  useEffect(() => {
    tasks.forEach(task => {
      if (task.dueDate && task.status === 'pending') {
        startTimer(task.id, task.dueDate);
      } else {
        clearInterval(intervalRef.current[task.id]);
      }
    });

    return () => {
      Object.values(intervalRef.current).forEach(interval => clearInterval(interval));
    };
  }, [tasks]);

  const startTimer = (taskId, dueDate) => {
    clearInterval(intervalRef.current[taskId]);
    
    const updateTimeLeft = () => {
      const now = new Date();
      const due = new Date(dueDate);
      const diff = due - now;
      
      if (diff <= 0) {
        clearInterval(intervalRef.current[taskId]);
        setTimeLeft(prev => ({ ...prev, [taskId]: 'Vencido' }));
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(prev => ({ 
        ...prev, 
        [taskId]: `${days}d ${hours}h ${minutes}m` 
      }));
    };
    
    updateTimeLeft();
    intervalRef.current[taskId] = setInterval(updateTimeLeft, 60000);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editId) {
      setTasks(tasks.map(task => 
        task.id === editId ? { ...task, ...formData } : task
      ));
      setEditId(null);
    } else {
      const newTask = {
        id: uuidv4(),
        ...formData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, newTask]);
    }

    setFormData({ title: '', description: '', dueDate: '' });
  };

  // Manejar edición de tarea
  const handleEdit = (task) => {
    setFormData({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate
    });
    setEditId(task.id);
  };

  // Manejar eliminación de tarea
  const handleDelete = (id) => {
    const taskToDelete = tasks.find(task => task.id === id);
    setTasks(tasks.filter(task => task.id !== id));
    setDeletedTasks([...deletedTasks, { ...taskToDelete, deletedAt: new Date().toISOString() }]);
  };

  // Restaurar tarea desde la papelera
  const handleRestore = (id) => {
    const taskToRestore = deletedTasks.find(task => task.id === id);
    setDeletedTasks(deletedTasks.filter(task => task.id !== id));
    setTasks([...tasks, taskToRestore]);
  };

  // Eliminar permanentemente
  const handlePermanentDelete = (id) => {
    setDeletedTasks(deletedTasks.filter(task => task.id !== id));
  };

  // Vaciar papelera
  const emptyTrash = () => {
    setDeletedTasks([]);
  };

  // Cambiar estado de tarea
  const toggleStatus = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { 
        ...task, 
        status: task.status === 'pending' ? 'completed' : 'pending',
        completedAt: task.status === 'pending' ? new Date().toISOString() : null
      } : task
    ));
  };

  // Filtrar y buscar tareas
  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'completed') return task.status === 'completed';
      if (filter === 'pending') return task.status === 'pending';
      return true;
    })
    .filter(task => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(term) ||
        (task.description && task.description.toLowerCase().includes(term))
      );
    });

  // Verificar si una tarea está vencida
  const isTaskOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Animaciones
  const taskVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -100 }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <header className="app-header">
        <div className="logo-title">
          <img 
            src="https://png.pngtree.com/png-clipart/20230915/original/pngtree-letter-og-logo-vector-icon-illustration-og-logo-go-letters-management-png-image_12175290.png" 
            alt="Logo OG" 
            className="app-logo"
          />
          <h1 className="app-title"> ADMINISTRADOR DE TAREAS OG</h1>
        </div>
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="theme-toggle"
          aria-label={`Cambiar a modo ${darkMode ? 'claro' : 'oscuro'}`}
        >
          {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>
      </header>

      {/* Contenido principal */}
      <main className="app-main">
        {/* Formulario */}
        <section className="form-section">
          <motion.form 
            onSubmit={handleSubmit} 
            className="task-form"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="form-title">
              {editId ? <><FiEdit2 /> Editar Tarea</> : <><FiCheck /> Nueva Tarea</>}
            </h2>

            <div className="form-group">
              <label htmlFor="title" className="form-label">Título </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Ej: Tarea de Ingles"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Ej: realizar pagina libro 12-25..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueDate" className="form-label"><FiCalendar /> Fecha Límite</label>
              <input
                type="datetime-local"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="form-control"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editId ? 'Actualizar' : 'Agregar'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setFormData({ title: '', description: '', dueDate: '' });
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              )}
            </div>
          </motion.form>

          {/* Botón de papelera */}
          <div className="trash-toggle">
            <button 
              onClick={() => setShowTrash(!showTrash)} 
              className="btn btn-trash"
            >
              <FiArchive /> Papelera ({deletedTasks.length})
            </button>
          </div>
        </section>

        {/* Lista de tareas */}
        <section className="tasks-section">
          <div className="tasks-container">
            <div className="tasks-header">
              <h2 className="section-title"><FiCheck /> Mis Tareas</h2>
              <div className="controls">
                <div className="search-box">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar tareas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todas</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completadas</option>
                </select>
              </div>
            </div>

            <div className="tasks-stats">
              <div className="stat-item">
                <span className="stat-label">Total:</span>
                <span className="stat-value">{tasks.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pendientes:</span>
                <span className="stat-value">
                  {tasks.filter(t => t.status === 'pending').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completadas:</span>
                <span className="stat-value">
                  {tasks.filter(t => t.status === 'completed').length}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {filteredTasks.length === 0 ? (
                <motion.div 
                  className="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {tasks.length === 0 ? (
                    <>
                      <p>¡No hay tareas aún!</p>
                      <p>Comienza agregando tu primera tarea.</p>
                    </>
                  ) : (
                    <>
                      <p>No se encontraron tareas</p>
                      <p>Intenta con otros términos de búsqueda o filtros.</p>
                    </>
                  )}
                </motion.div>
              ) : (
                <ul className="task-list">
                  <AnimatePresence>
                    {filteredTasks.map(task => (
                      <motion.li 
                        key={task.id}
                        className={`task-item ${task.status} ${isTaskOverdue(task.dueDate) ? 'overdue' : ''}`}
                        variants={taskVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                      >
                        <div className="task-content">
                          <div className="task-header">
                            <h3 className="task-title">
                              <input
                                type="checkbox"
                                checked={task.status === 'completed'}
                                onChange={() => toggleStatus(task.id)}
                                className="status-checkbox"
                              />
                              <span>{task.title}</span>
                            </h3>
                            {task.dueDate && (
                              <span className="task-date">
                                <FiCalendar />
                                {new Date(task.dueDate).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                                {isTaskOverdue(task.dueDate) && task.status !== 'completed' && (
                                  <span className="badge overdue-badge">Vencida</span>
                                )}
                              </span>
                            )}
                          </div>

                          {task.description && (
                            <p className="task-description">{task.description}</p>
                          )}

                          {task.dueDate && task.status === 'pending' && timeLeft[task.id] && (
                            <div className={`time-left ${isTaskOverdue(task.dueDate) ? 'critical' : ''}`}>
                              <FiClock />
                              <span>Tiempo restante: {timeLeft[task.id]}</span>
                            </div>
                          )}

                          <div className="task-footer">
                            <span className="task-meta">
                              Creada: {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                            {task.status === 'completed' && task.completedAt && (
                              <span className="task-meta">
                                Completada: {new Date(task.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="task-actions">
                          <button
                            onClick={() => handleEdit(task)}
                            className="btn btn-icon"
                            title="Editar tarea"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="btn btn-icon btn-danger"
                            title="Eliminar tarea"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Papelera */}
        <AnimatePresence>
          {showTrash && (
            <motion.div 
              className="trash-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="trash-header">
                <h3><FiArchive /> Papelera</h3>
                <button onClick={emptyTrash} className="btn btn-danger btn-sm">
                  Vaciar papelera
                </button>
              </div>
              <AnimatePresence>
                {deletedTasks.length === 0 ? (
                  <motion.p 
                    className="empty-trash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    La papelera está vacía
                  </motion.p>
                ) : (
                  <ul className="trash-list">
                    <AnimatePresence>
                      {deletedTasks.map(task => (
                        <motion.li 
                          key={task.id}
                          className="trash-item"
                          variants={taskVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                        >
                          <div className="trash-content">
                            <span className="trash-title">{task.title}</span>
                            <span className="trash-date">
                              Eliminada: {new Date(task.deletedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="trash-actions">
                            <button
                              onClick={() => handleRestore(task.id)}
                              className="btn btn-success btn-sm"
                              title="Restaurar tarea"
                            >
                              Restaurar
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(task.id)}
                              className="btn btn-danger btn-sm"
                              title="Eliminar permanentemente"
                            >
                              Eliminar
                            </button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="app-footer">
        <p>© 2025 ADMINISTRADOR DE TAREAS  OG</p>
      </footer>
    </div>
  );
};

export default App;