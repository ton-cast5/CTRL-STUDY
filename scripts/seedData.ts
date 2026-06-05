/** Datos iniciales compartidos entre setup.sql y el script Node de verificación */

export const SEED_TUTORS = [
  { id: '1', name: 'María González', semester: 8, specialty: 'Python', rating: 4.9, sessions: 42, avatar: 'MG', bio: 'Estudiante de 8° semestre en DACYTI. Me apasiona enseñar programación desde cero y preparar a compañeros para exámenes parciales.', availability: 'Lun–Vie · 9:00–17:00', subjects: ['Python', 'Algoritmos'] },
  { id: '2', name: 'Carlos Ruiz', semester: 7, specialty: 'MySQL', rating: 4.8, sessions: 35, avatar: 'CR', bio: 'Especialista en bases de datos relacionales. Ayudo con modelado ER, consultas SQL y normalización.', availability: 'Mar–Jue · 10:00–16:00', subjects: ['MySQL', 'Bases de Datos'] },
  { id: '3', name: 'Ana Torres', semester: 9, specialty: 'Java', rating: 5.0, sessions: 58, avatar: 'AT', bio: 'Tutora senior en POO y Java. Enfoque en proyectos integradores y buenas prácticas de código.', availability: 'Lun–Mié–Vie · 14:00–18:00', subjects: ['Java', 'POO'] },
  { id: '4', name: 'Luis Méndez', semester: 8, specialty: 'Redes', rating: 4.7, sessions: 28, avatar: 'LM', bio: 'Apoyo en redes de datos, configuración de servidores y laboratorios prácticos en Linux.', availability: 'Mié–Vie · 11:00–15:00', subjects: ['Redes', 'Linux'] },
  { id: '5', name: 'Sofía Herrera', semester: 7, specialty: 'JavaScript', rating: 4.9, sessions: 31, avatar: 'SH', bio: 'Desarrollo web front-end. React, DOM y proyectos finales de la materia de aplicaciones web.', availability: 'Lun–Jue · 9:00–13:00', subjects: ['JavaScript', 'Web'] },
  { id: '6', name: 'Diego Vargas', semester: 9, specialty: 'Cálculo', rating: 4.6, sessions: 22, avatar: 'DV', bio: 'Refuerzo en cálculo diferencial e integral. Explicaciones claras con ejercicios tipo examen UJAT.', availability: 'Mar–Sáb · 10:00–14:00', subjects: ['Cálculo', 'Matemáticas'] },
] as const;
