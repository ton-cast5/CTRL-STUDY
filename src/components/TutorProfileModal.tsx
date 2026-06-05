import { useState } from 'react';
import type { Tutor } from '../data/mockData';
import { IconStar, IconX } from './Icons';
import { useApp } from '../context/AppContext';
import { createReview } from '../services/tutors.service';
import './TutorProfileModal.css';

interface TutorProfileModalProps {
  tutor: Tutor;
  onClose: () => void;
  onAgendar: () => void;
}

export function TutorProfileModal({ tutor, onClose, onAgendar }: TutorProfileModalProps) {
  const { profile, role, refreshTutors } = useApp();
  const [reviews, setReviews] = useState(tutor.reviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reviewCount = reviews.length;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !reviewText.trim()) return;
    setSubmitting(true);
    try {
      const newReview = await createReview({
        tutorId: tutor.id,
        author: profile.name,
        authorSemester: profile.semester ?? 1,
        rating,
        text: reviewText.trim(),
        studentId: profile.id,
      });
      setReviews((prev) => [newReview, ...prev]);
      setReviewText('');
      setShowReviewForm(false);
      await refreshTutors();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-panel animate-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="tutor-profile-title"
        aria-modal="true"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          <IconX size={20} />
        </button>

        <header className="modal-profile-header">
          <div className="modal-avatar-lg">{tutor.avatar}</div>
          <div>
            <h2 id="tutor-profile-title">{tutor.name}</h2>
            <p className="modal-specialty">{tutor.specialty} · {tutor.semester}° semestre</p>
            <div className="modal-rating-row">
              <IconStar size={16} />
              <strong>{tutor.rating.toFixed(1)}</strong>
              <span>({reviewCount} reseñas)</span>
              <span className="modal-sessions-dot">·</span>
              <span>{tutor.sessions} sesiones</span>
            </div>
          </div>
        </header>

        <section className="modal-section">
          <h3>Sobre el tutor</h3>
          <p className="modal-bio">{tutor.bio}</p>
          <p className="modal-availability">
            <strong>Disponibilidad:</strong> {tutor.availability}
          </p>
          <div className="modal-subjects">
            {tutor.subjects.map((s) => (
              <span key={s} className="tag">{s}</span>
            ))}
          </div>
        </section>

        <section className="modal-section modal-reviews">
          <div className="section-title-row">
            <h3>Reseñas de estudiantes</h3>
            {role === 'student' && (
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                {showReviewForm ? 'Cancelar' : 'Escribir reseña'}
              </button>
            )}
          </div>

          {showReviewForm && (
            <form className="review-form" onSubmit={handleSubmitReview}>
              <label>
                Calificación
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} estrellas</option>
                  ))}
                </select>
              </label>
              <label>
                Comentario
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Cuéntanos tu experiencia..."
                  rows={3}
                  required
                />
              </label>
              <button type="submit" className="btn-primary btn-sm" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Publicar reseña'}
              </button>
            </form>
          )}

          <ul className="reviews-list">
            {reviews.map((review) => (
              <li key={review.id} className="review-card">
                <div className="review-header">
                  <div>
                    <strong>{review.author}</strong>
                    <span className="review-meta">{review.semester}° sem · {review.date}</span>
                  </div>
                  <div className="review-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IconStar
                        key={i}
                        size={12}
                        className={i < review.rating ? 'star-filled' : 'star-empty'}
                      />
                    ))}
                  </div>
                </div>
                <p className="review-text">{review.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {role === 'student' && (
          <button
            type="button"
            className="btn-primary modal-cta"
            onClick={() => {
              onClose();
              onAgendar();
            }}
          >
            Agendar con {tutor.name.split(' ')[0]}
          </button>
        )}
      </div>
    </div>
  );
}
