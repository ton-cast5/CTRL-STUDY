type IconProps = { size?: number; className?: string };

const stroke = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function IconUsers({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconCalendar({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function IconFolder({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IconChart({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

export function IconStar({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function IconSearch({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function IconDownload({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

export function IconFilter({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function IconCheck({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconChevronLeft({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconFile({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function IconLogOut({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function IconX({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconClock({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function IconMessage({ size = 24, className }: IconProps) {
  return (
    <svg {...stroke(size)} className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
