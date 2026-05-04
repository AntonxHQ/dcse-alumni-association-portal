import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

type AlumniCardProps = {
  alumni: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    city: string | null;
    country: string | null;
    current_job: { job_title: string; company: string } | null;
    degrees: { level: string; graduation_year: number }[];
    skills: string[];
  };
};

export function AlumniCard({ alumni }: AlumniCardProps) {
  const initials = alumni.full_name
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const location = [alumni.city, alumni.country].filter(Boolean).join(', ');

  return (
    <Link
      href={`/alumni/${alumni.id}`}
      className="block rounded-lg border border-default bg-surface-100 p-4 transition-colors duration-150 hover:border-border-secondary"
    >
      {alumni.avatar_url ? (
        <Image
          src={alumni.avatar_url}
          alt={alumni.full_name}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-300 text-sm font-medium text-foreground-light">
          {initials}
        </div>
      )}

      <p className="mt-3 text-sm font-medium text-foreground">{alumni.full_name}</p>

      {alumni.current_job ? (
        <p className="mt-0.5 truncate text-xs text-foreground-light">
          {alumni.current_job.job_title} at {alumni.current_job.company}
        </p>
      ) : null}

      {alumni.degrees.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {alumni.degrees.map((d) => (
            <span
              key={d.level}
              className="rounded bg-surface-300 px-1.5 py-0.5 text-[11px] text-foreground-lighter"
            >
              {d.level}
            </span>
          ))}
        </div>
      ) : null}

      {location ? (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-foreground-lighter">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          {location}
        </p>
      ) : null}
    </Link>
  );
}
