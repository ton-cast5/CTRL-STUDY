import { useMemo, useState } from 'react';
import { subjects } from '../data/mockData';
import { IconDownload, IconFile, IconSearch, IconX } from '../components/Icons';
import { useApp } from '../context/AppContext';
import { createResource, updateResource, deleteResource } from '../services/resources.service';
import { shortName } from '../types/database';
import './Screens.css';

export function Recursos() {
  const { resources, role, tutorId, userName, refreshResources } = useApp();
  const [subject, setSubject] = useState('Todas');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    subject: 'Python',
    type: 'PDF' as 'PDF' | 'Guía' | 'Código',
    size: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchSubject = subject === 'Todas' || r.subject === subject;
      const matchSearch =
        !search || r.title.toLowerCase().includes(search.toLowerCase());
      return matchSubject && matchSearch;
    });
  }, [resources, subject, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    filtered.forEach((r) => {
      const list = map.get(r.subject) ?? [];
      list.push(r);
      map.set(r.subject, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const resetForm = () => {
    setForm({ title: '', subject: 'Python', type: 'PDF', size: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateResource(editingId, {
          title: form.title.trim(),
          subject: form.subject,
          type: form.type,
          size: form.size || '—',
        });
      } else {
        await createResource({
          tutorId: role === 'tutor' ? tutorId : null,
          title: form.title.trim(),
          subject: form.subject,
          type: form.type,
          size: form.size || '—',
          uploadedBy: shortName(userName),
        });
      }
      await refreshResources();
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (file: typeof resources[0]) => {
    setForm({
      title: file.title,
      subject: file.subject,
      type: file.type,
      size: file.size,
    });
    setEditingId(file.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    await deleteResource(id);
    await refreshResources();
  };

  const canManage = role === 'tutor';

  return (
    <div className="screen animate-in">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Material de estudio</p>
          <h2>Repositorio de Recursos</h2>
          <p className="screen-desc">Guías, PDFs y código compartido por tutores DACYTI</p>
        </div>
        {canManage && (
          <button type="button" className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cerrar' : '+ Agregar recurso'}
          </button>
        )}
      </header>

      {showForm && canManage && (
        <form className="card-panel resource-form stagger-1" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Editar recurso' : 'Nuevo recurso'}</h3>
          <label className="field-inline">
            <span>Título</span>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label className="field-inline">
            <span>Materia</span>
            <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
              {subjects.filter((s) => s !== 'Todas').map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field-inline">
            <span>Tipo</span>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
            >
              <option value="PDF">PDF</option>
              <option value="Guía">Guía</option>
              <option value="Código">Código</option>
            </select>
          </label>
          <label className="field-inline">
            <span>Tamaño</span>
            <input
              placeholder="Ej. 2.4 MB"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Publicar'}
            </button>
            <button type="button" className="btn-outline btn-sm" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="toolbar stagger-1">
        <div className="search-box">
          <IconSearch size={18} />
          <input
            type="search"
            placeholder="Buscar archivos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select-compact"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="resource-groups">
        {grouped.map(([subj, items], gi) => (
          <section key={subj} className={`resource-group animate-in stagger-${Math.min(gi + 1, 4)}`}>
            <h3 className="group-title">
              <span className="gold-accent" />
              {subj}
            </h3>
            <ul className="resource-list">
              {items.map((file) => (
                <li key={file.id} className="resource-item">
                  <div className="resource-icon">
                    <IconFile size={20} />
                  </div>
                  <div className="resource-info">
                    <p className="resource-title">{file.title}</p>
                    <p className="resource-meta">
                      <span className={`type-badge type-${file.type.toLowerCase()}`}>{file.type}</span>
                      {file.size} · {file.uploadedBy}
                    </p>
                  </div>
                  <div className="resource-actions">
                    {file.fileUrl ? (
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download"
                        aria-label={`Descargar ${file.title}`}
                      >
                        <IconDownload size={18} />
                      </a>
                    ) : (
                      <button type="button" className="btn-download" aria-label={`Descargar ${file.title}`}>
                        <IconDownload size={18} />
                      </button>
                    )}
                    {canManage && (
                      <>
                        <button
                          type="button"
                          className="btn-outline btn-sm"
                          onClick={() => handleEdit(file)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-icon-msg"
                          aria-label={`Eliminar ${file.title}`}
                          onClick={() => handleDelete(file.id, file.title)}
                        >
                          <IconX size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="empty-state">No hay recursos que coincidan con tu búsqueda.</p>
      )}
    </div>
  );
}
