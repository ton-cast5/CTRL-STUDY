import { useMemo, useRef, useState } from 'react';
import { subjects } from '../data/mockData';
import { IconDownload, IconFile, IconSearch, IconX } from '../components/Icons';
import { useApp } from '../context/AppContext';
import {
  createResourceWithFile,
  updateResource,
  deleteResource,
  replaceResourceFile,
} from '../services/resources.service';
import { formatFileSize, getDocumentDownloadUrl, inferResourceType } from '../services/storage.service';
import { shortName } from '../types/database';
import './Screens.css';

const ACCEPTED_TYPES =
  '.pdf,.doc,.docx,.txt,.md,.zip,.rar,.py,.java,.js,.ts,.jsx,.tsx,.html,.css,.sql,.json,.ppt,.pptx,.xls,.xlsx';

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
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setForm({ title: '', subject: 'Python', type: 'PDF' });
    setSelectedFile(null);
    setEditingId(null);
    setFormError(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setFormError(null);
    if (file && !form.title.trim()) {
      const baseName = file.name.replace(/\.[^.]+$/, '');
      setForm((prev) => ({
        ...prev,
        title: baseName,
        type: inferResourceType(file.name),
      }));
    } else if (file) {
      setForm((prev) => ({ ...prev, type: inferResourceType(file.name) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (!tutorId) {
      setFormError('Tu cuenta de tutor no tiene perfil de tutor vinculado.');
      return;
    }

    if (!editingId && !selectedFile) {
      setFormError('Selecciona un archivo para subir.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (editingId) {
        await updateResource(editingId, {
          title: form.title.trim(),
          subject: form.subject,
          type: form.type,
        });
        if (selectedFile) {
          await replaceResourceFile(editingId, tutorId, selectedFile);
        }
      } else if (selectedFile) {
        await createResourceWithFile({
          tutorId,
          file: selectedFile,
          title: form.title.trim(),
          subject: form.subject,
          uploadedBy: shortName(userName),
        });
      }
      await refreshResources();
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el recurso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (file: typeof resources[0]) => {
    setForm({
      title: file.title,
      subject: file.subject,
      type: file.type,
    });
    setSelectedFile(null);
    setEditingId(file.id);
    setFormError(null);
    setShowForm(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"? Se borrará también el archivo del repositorio.`)) return;
    try {
      await deleteResource(id);
      await refreshResources();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el recurso');
    }
  };

  const canManage = role === 'tutor';

  return (
    <div className="screen animate-in">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Material de estudio</p>
          <h2>Repositorio de Recursos</h2>
          <p className="screen-desc">
            {canManage
              ? 'Sube documentos para que tus alumnos asesorados los descarguen'
              : 'Guías, PDFs y código compartidos por tus tutores'}
          </p>
        </div>
        {canManage && (
          <button type="button" className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cerrar' : '+ Subir recurso'}
          </button>
        )}
      </header>

      {showForm && canManage && (
        <form className="card-panel resource-form stagger-1" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Editar recurso' : 'Subir nuevo recurso'}</h3>

          <label className="field-inline">
            <span>Archivo {editingId ? '(opcional, reemplaza el actual)' : '*'}</span>
            <div className="file-upload-zone">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <p className="file-selected">
                  <IconFile size={16} /> {selectedFile.name} · {formatFileSize(selectedFile.size)}
                </p>
              ) : (
                <p className="file-hint">PDF, guías, código, ZIP, etc. (máx. 50 MB)</p>
              )}
            </div>
          </label>

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

          {formError && <p className="form-error">{formError}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Subiendo...' : editingId ? 'Actualizar' : 'Publicar recurso'}
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
                      {file.fileName && <span className="resource-filename"> · {file.fileName}</span>}
                    </p>
                  </div>
                  <div className="resource-actions">
                    {file.fileUrl ? (
                      <a
                        href={getDocumentDownloadUrl(file.fileUrl, file.fileName)}
                        download={file.fileName ?? file.title}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download"
                        aria-label={`Descargar ${file.title}`}
                      >
                        <IconDownload size={18} />
                      </a>
                    ) : (
                      <span className="resource-no-file" title="Sin archivo adjunto">
                        Sin archivo
                      </span>
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
        <p className="empty-state">
          {role === 'student'
            ? 'Cuando un tutor acepte tu solicitud de asesoría, aquí verás los recursos que comparta contigo.'
            : 'No hay recursos que coincidan con tu búsqueda. Sube el primero con "+ Subir recurso".'}
        </p>
      )}
    </div>
  );
}
