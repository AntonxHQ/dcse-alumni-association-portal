'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Country } from 'country-state-city';

type Props = {
  q: string;
  selectedDegrees: string[];
  gradFrom: string;
  gradTo: string;
  country: string;
  selectedSkills: string[];
  sort: string;
  allSkills: string[];
};

export function DirectoryFilters({
  q,
  selectedDegrees,
  gradFrom,
  gradTo,
  country,
  selectedSkills,
  sort,
  allSkills,
}: Props) {
  const router = useRouter();

  // Local state only for debounced search and grad year Apply button
  const [localQ, setLocalQ] = useState(q);
  const [localGradFrom, setLocalGradFrom] = useState(gradFrom);
  const [localGradTo, setLocalGradTo] = useState(gradTo);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Sync local search/grad values when URL-driven props change (e.g. clear all)
  useEffect(() => setLocalQ(q), [q]);
  useEffect(() => {
    setLocalGradFrom(gradFrom);
    setLocalGradTo(gradTo);
  }, [gradFrom, gradTo]);

  // Close popovers on outside click
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build URL from full filter state
  const buildUrl = useCallback(
    (overrides: {
      q?: string;
      degrees?: string[];
      gradFrom?: string;
      gradTo?: string;
      country?: string;
      skills?: string[];
      sort?: string;
    }) => {
      const nextQ = overrides.q !== undefined ? overrides.q : q;
      const nextDegrees =
        overrides.degrees !== undefined ? overrides.degrees : selectedDegrees;
      const nextGradFrom =
        overrides.gradFrom !== undefined ? overrides.gradFrom : gradFrom;
      const nextGradTo =
        overrides.gradTo !== undefined ? overrides.gradTo : gradTo;
      const nextCountry =
        overrides.country !== undefined ? overrides.country : country;
      const nextSkills =
        overrides.skills !== undefined ? overrides.skills : selectedSkills;
      const nextSort = overrides.sort !== undefined ? overrides.sort : sort;

      const params = new URLSearchParams();
      if (nextQ) params.set('q', nextQ);
      nextDegrees.forEach((d) => params.append('degree', d));
      if (nextGradFrom) params.set('grad_from', nextGradFrom);
      if (nextGradTo) params.set('grad_to', nextGradTo);
      if (nextCountry) params.set('country', nextCountry);
      nextSkills.forEach((s) => params.append('skill', s));
      if (nextSort && nextSort !== 'relevance') params.set('sort', nextSort);

      const qs = params.toString();
      return qs ? `/alumni?${qs}` : '/alumni';
    },
    [q, selectedDegrees, gradFrom, gradTo, country, selectedSkills, sort],
  );

  // Debounced search
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setLocalQ(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      router.replace(buildUrl({ q: value }));
    }, 400);
  };

  const hasActiveFilters =
    selectedDegrees.length > 0 ||
    !!gradFrom ||
    !!gradTo ||
    !!country ||
    selectedSkills.length > 0;

  const allCountries = Country.getAllCountries();

  return (
    <div className="mb-4" ref={containerRef}>
      {/* Search bar */}
      <div className="flex items-center gap-2 rounded-md border border-border-control bg-surface-200 px-3">
        <Search className="h-4 w-4 shrink-0 text-foreground-lighter" />
        <input
          type="text"
          value={localQ}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name, company, degree or bio..."
          className="flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-foreground-lighter"
        />
        {/* Sort select */}
        <div className="border-l border-border-control pl-3">
          <select
            value={sort}
            onChange={(e) => {
              router.replace(buildUrl({ sort: e.target.value }));
            }}
            className="bg-transparent text-xs text-foreground-light outline-none"
          >
            <option value="relevance">Relevance</option>
            <option value="name_asc">Name A–Z</option>
            <option value="grad_newest">Grad year (newest)</option>
            <option value="grad_oldest">Grad year (oldest)</option>
          </select>
        </div>
        {localQ ? (
          <button
            type="button"
            onClick={() => handleSearchChange('')}
            className="text-foreground-lighter transition-colors hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {/* Filter pills row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Degree filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenPopover(openPopover === 'degree' ? null : 'degree')
            }
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedDegrees.length > 0
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-border-control bg-surface-200 text-foreground-light hover:border-border-secondary'
            }`}
          >
            Degree
            {selectedDegrees.length > 0 ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-foreground-contrast">
                {selectedDegrees.length}
              </span>
            ) : null}
            <ChevronDown className="h-3 w-3" />
          </button>
          {openPopover === 'degree' ? (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[140px] rounded-md border border-default bg-surface-200 p-2 shadow-lg">
              {(['BS', 'MS', 'PhD'] as const).map((level) => (
                <label
                  key={level}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-300"
                >
                  <input
                    type="checkbox"
                    checked={selectedDegrees.includes(level)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedDegrees, level]
                        : selectedDegrees.filter((d) => d !== level);
                      router.replace(buildUrl({ degrees: next }));
                    }}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  <span className="text-xs text-foreground">{level}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        {/* Grad year filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenPopover(openPopover === 'grad' ? null : 'grad')
            }
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              gradFrom || gradTo
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-border-control bg-surface-200 text-foreground-light hover:border-border-secondary'
            }`}
          >
            Grad year
            {gradFrom || gradTo ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-foreground-contrast">
                1
              </span>
            ) : null}
            <ChevronDown className="h-3 w-3" />
          </button>
          {openPopover === 'grad' ? (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[210px] rounded-md border border-default bg-surface-200 p-3 shadow-lg">
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="mb-1 text-[11px] text-foreground-lighter">
                    From
                  </p>
                  <input
                    type="number"
                    value={localGradFrom}
                    placeholder="1980"
                    min={1980}
                    max={new Date().getFullYear() + 1}
                    onChange={(e) => setLocalGradFrom(e.target.value)}
                    className="w-full rounded border border-border-control bg-surface-300 px-2 py-1 text-xs text-foreground outline-none focus:border-brand"
                  />
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-[11px] text-foreground-lighter">
                    To
                  </p>
                  <input
                    type="number"
                    value={localGradTo}
                    placeholder={String(new Date().getFullYear())}
                    min={1980}
                    max={new Date().getFullYear() + 1}
                    onChange={(e) => setLocalGradTo(e.target.value)}
                    className="w-full rounded border border-border-control bg-surface-300 px-2 py-1 text-xs text-foreground outline-none focus:border-brand"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  router.replace(
                    buildUrl({
                      gradFrom: localGradFrom,
                      gradTo: localGradTo,
                    }),
                  );
                  setOpenPopover(null);
                }}
                className="mt-2 w-full rounded-md bg-brand py-1 text-xs font-medium text-foreground-contrast transition-colors hover:bg-brand-600"
              >
                Apply
              </button>
              {(gradFrom || gradTo) ? (
                <button
                  type="button"
                  onClick={() => {
                    setLocalGradFrom('');
                    setLocalGradTo('');
                    router.replace(buildUrl({ gradFrom: '', gradTo: '' }));
                    setOpenPopover(null);
                  }}
                  className="mt-1 w-full text-center text-[11px] text-foreground-lighter hover:text-foreground"
                >
                  Clear
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Country filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenPopover(openPopover === 'country' ? null : 'country')
            }
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              country
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-border-control bg-surface-200 text-foreground-light hover:border-border-secondary'
            }`}
          >
            Country
            {country ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-foreground-contrast">
                1
              </span>
            ) : null}
            <ChevronDown className="h-3 w-3" />
          </button>
          {openPopover === 'country' ? (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[200px] rounded-md border border-default bg-surface-200 p-2 shadow-lg">
              <select
                value={country}
                onChange={(e) => {
                  router.replace(buildUrl({ country: e.target.value }));
                  setOpenPopover(null);
                }}
                size={7}
                className="w-full rounded border border-border-control bg-surface-300 px-2 py-1 text-xs text-foreground outline-none"
              >
                <option value="">All countries</option>
                {allCountries.map((c) => (
                  <option key={c.isoCode} value={c.isoCode}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {/* Skills filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenPopover(openPopover === 'skills' ? null : 'skills')
            }
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedSkills.length > 0
                ? 'border-brand bg-brand/5 text-brand'
                : 'border-border-control bg-surface-200 text-foreground-light hover:border-border-secondary'
            }`}
          >
            Skills
            {selectedSkills.length > 0 ? (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-foreground-contrast">
                {selectedSkills.length}
              </span>
            ) : null}
            <ChevronDown className="h-3 w-3" />
          </button>
          {openPopover === 'skills' ? (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[200px] rounded-md border border-default bg-surface-200 p-2 shadow-lg">
              {allSkills.length === 0 ? (
                <p className="px-2 py-2 text-xs text-foreground-lighter">
                  No skills available.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {allSkills.map((skill) => (
                    <label
                      key={skill}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selectedSkills, skill]
                            : selectedSkills.filter((s) => s !== skill);
                          router.replace(buildUrl({ skills: next }));
                        }}
                        className="h-3.5 w-3.5 accent-brand"
                      />
                      <span className="text-xs text-foreground">{skill}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Clear all */}
        {(localQ || hasActiveFilters) ? (
          <button
            type="button"
            onClick={() => {
              setLocalQ('');
              setLocalGradFrom('');
              setLocalGradTo('');
              router.replace('/alumni');
            }}
            className="ml-auto text-xs text-foreground-lighter transition-colors hover:text-brand"
          >
            Clear all filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
