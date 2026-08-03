import React from 'react';

export const ClothingIcon = ({ type, color = "#64748b", className = "w-12 h-12" }) => {
  switch (type) {
    case 'tshirt':
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M30 18 C38 28 62 28 70 18 L90 32 L80 48 L72 42 L72 85 L28 85 L28 42 L20 48 L10 32 Z" fill={color} stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M38 18 C44 24 56 24 62 18" stroke="#0f172a" strokeWidth="2.5" fill="none" />
          <path d="M28 42 L10 32" stroke="#0f172a" strokeWidth="2" />
          <path d="M72 42 L90 32" stroke="#0f172a" strokeWidth="2" />
        </svg>
      );
    case 'shirt':
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M30 18 L40 28 L50 22 L60 28 L70 18 L92 34 L82 50 L74 44 L74 88 L26 88 L26 44 L18 50 L8 34 Z" fill={color} stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M50 22 L50 88" stroke="#0f172a" strokeWidth="2" strokeDasharray="4 3" />
          <circle cx="50" cy="36" r="2" fill="#0f172a" />
          <circle cx="50" cy="50" r="2" fill="#0f172a" />
          <circle cx="50" cy="64" r="2" fill="#0f172a" />
          <circle cx="50" cy="78" r="2" fill="#0f172a" />
          <path d="M60 46 L70 46 L70 58 L60 58 Z" fill="none" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );
    case 'pants':
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M22 18 L78 18 L74 88 L54 88 L50 46 L46 88 L26 88 Z" fill={color} stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M22 28 L78 28" stroke="#0f172a" strokeWidth="2" />
          <path d="M50 18 L50 46" stroke="#0f172a" strokeWidth="2" />
          <path d="M32 28 C34 38 42 40 48 40" stroke="#0f172a" strokeWidth="1.5" fill="none" />
          <path d="M68 28 C66 38 58 40 52 40" stroke="#0f172a" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'dress':
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M35 15 C42 22 58 22 65 15 L72 26 L64 32 L60 48 L82 88 L18 88 L40 48 L36 32 L28 26 Z" fill={color} stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M40 48 L60 48" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="50" cy="48" r="3.5" fill="#f8fafc" stroke="#0f172a" />
        </svg>
      );
    case 'jacket':
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M25 15 L40 25 L50 20 L60 25 L75 15 L92 34 L82 52 L74 45 L74 88 L26 88 L26 45 L18 52 L8 34 Z" fill={color} stroke="#0f172a" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M40 25 L32 88" stroke="#0f172a" strokeWidth="2" />
          <path d="M60 25 L68 88" stroke="#0f172a" strokeWidth="2" />
          <rect x="30" y="52" width="12" height="14" rx="2" stroke="#0f172a" strokeWidth="1.5" fill="none" />
          <rect x="58" y="52" width="12" height="14" rx="2" stroke="#0f172a" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'cap':
    default:
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <path d="M20 52 C20 30 35 22 50 22 C65 22 80 30 80 52 Z" fill={color} stroke="#0f172a" strokeWidth="2.5" />
          <path d="M15 52 C40 52 75 52 92 60 C85 68 60 68 15 52 Z" fill="#334155" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="50" cy="22" r="3" fill="#0f172a" />
        </svg>
      );
  }
};
