import React from 'react';
import { Student12thGrade } from '../types';

// Canonical Turkish female first names to detect female students if not set
const KNOWN_FEMALE_FIRST_NAMES = new Set([
  'ALARA', 'ALEYNA', 'ASLI', 'AYŞE', 'AZRA', 'BEYZA', 'BÜŞRA', 'CANSU', 'CEMRE', 'CEREN',
  'DAMLA', 'DAMLASU', 'DEFNE', 'DERİN', 'DİCLE', 'DİLA', 'DİLARA', 'DURU', 'DUYGU',
  'EBRU', 'ECE', 'ECEM', 'ECRİN', 'EDA', 'ELA', 'ELİF', 'EMİNE', 'ESMA', 'EYLÜL', 'EZGİ',
  'FATMA', 'GAMZE', 'GİZEM', 'GÜL', 'GÜLŞAH', 'HANDE', 'HATİCE', 'HAVVA', 'HAYAL', 'HİLAL',
  'İLAYDA', 'İNCİ', 'İPEK', 'İREM', 'KARDELEN', 'KÜBRA', 'LARA', 'LEYLA', 'MELİKE', 'MELİSA',
  'MERVE', 'MERYEM', 'MİRA', 'NAZ', 'NAZLI', 'NEHİR', 'NİSA', 'ÖYKÜ', 'ÖZGE', 'PELİN',
  'RABİA', 'RÜYA', 'SARA', 'SEDEF', 'SELEN', 'SELİN', 'SENA', 'SERRA', 'SEVDE', 'SILA',
  'SİMAY', 'SU', 'SUDE', 'SÜMEYYE', 'ŞEVVAL', 'TUĞÇE', 'YAĞMUR', 'YAREN', 'YASEMİN', 'ZEHRA', 'ZEYNEP'
]);

export function getStudentGender(student?: { gender?: 'K' | 'E' | string; name?: string }): 'K' | 'E' {
  if (student?.gender === 'K' || student?.gender === 'E') {
    return student.gender;
  }
  if (!student?.name) return 'E';

  // Check each part of student's name
  const upper = student.name.toLocaleUpperCase('tr-TR');
  const words = upper.split(/\s+/);
  for (const w of words) {
    if (KNOWN_FEMALE_FIRST_NAMES.has(w)) {
      return 'K';
    }
  }
  return 'E';
}

export function getStudentEmoji(student?: { gender?: 'K' | 'E' | string; name?: string }): '👩' | '👨' {
  return getStudentGender(student) === 'K' ? '👩' : '👨';
}

interface StudentAvatarBadgeProps {
  student?: { gender?: 'K' | 'E' | string; name?: string };
  name?: string;
  gender?: 'K' | 'E' | string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const StudentAvatarBadge: React.FC<StudentAvatarBadgeProps> = ({
  student,
  name,
  gender,
  size = 'md',
  className = '',
}) => {
  const g = gender === 'K' || gender === 'E'
    ? gender
    : getStudentGender(student || { name, gender });
  const isFemale = g === 'K';
  const emoji = isFemale ? '👩' : '👨';

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs rounded-md',
    sm: 'w-9 h-9 text-base rounded-xl',
    md: 'w-12 h-12 text-2xl rounded-2xl',
    lg: 'w-14 h-14 text-3xl rounded-2xl',
    xl: 'w-20 h-20 text-4xl rounded-2xl',
  }[size];

  const colorClasses = isFemale
    ? 'bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 shadow-inner'
    : 'bg-indigo-500/15 border-2 border-indigo-500/30 text-indigo-300 shadow-inner';

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none transition-all duration-200 ${sizeClasses} ${colorClasses} ${className}`}
      title={isFemale ? 'Kız Öğrenci (Kadın 👩)' : 'Erkek Öğrenci (Erkek 👨)'}
      aria-label={isFemale ? 'Kadın Öğrenci 👩' : 'Erkek Öğrenci 👨'}
    >
      <span className="leading-none transform hover:scale-110 transition-transform drop-shadow">
        {emoji}
      </span>
    </div>
  );
};
