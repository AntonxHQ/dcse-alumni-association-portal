'use client';

import { ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Option = { value: string; label: string };

type SearchableSelectProps = {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
};

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Search…',
    disabled = false,
    className = '',
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

    const filtered = query
        ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
        : options;

    // Close on outside click
    useEffect(() => {
        function handleMouseDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', handleMouseDown);
        return () => document.removeEventListener('mousedown', handleMouseDown);
    }, []);

    // Focus search when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [open]);

    function handleSelect(val: string) {
        onChange(val);
        setOpen(false);
        setQuery('');
    }

    function handleClear(e: React.MouseEvent) {
        e.stopPropagation();
        onChange('');
        setQuery('');
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger */}
            <button
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                    disabled
                        ? 'cursor-not-allowed border-border-muted bg-surface-100 text-foreground-lighter'
                        : 'cursor-pointer border-border-control bg-surface-200 text-foreground hover:border-border-strong'
                } ${open ? 'border-brand ring-1 ring-brand/30' : ''}`}
                disabled={disabled}
                onClick={() => !disabled && setOpen((v) => !v)}
                type="button"
            >
                <span className={selectedLabel ? 'text-foreground' : 'text-foreground-lighter'}>
                    {selectedLabel || placeholder}
                </span>
                <div className="flex items-center gap-1">
                    {value && !disabled && (
                        <span
                            className="rounded p-0.5 text-foreground-lighter transition-colors hover:text-foreground"
                            onClick={handleClear}
                            role="button"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-foreground-lighter transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-surface-200 shadow-lg">
                    {/* Search input */}
                    <div className="flex items-center gap-2 border-b border-border-muted px-3 py-2">
                        <Search className="h-3.5 w-3.5 shrink-0 text-foreground-lighter" />
                        <input
                            className="!m-0 flex-1 border-0 bg-transparent !p-0 text-sm !shadow-none !ring-0 placeholder:text-foreground-lighter focus:outline-none"
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type to search…"
                            ref={searchRef}
                            type="text"
                            value={query}
                        />
                    </div>

                    {/* Options list */}
                    <ul
                        className="max-h-52 overflow-y-auto py-1"
                        ref={listRef}
                    >
                        {filtered.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-foreground-lighter">No results found.</li>
                        ) : (
                            filtered.map((opt) => (
                                <li key={opt.value}>
                                    <button
                                        className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-surface-300 ${
                                            opt.value === value ? 'bg-brand/10 font-medium text-brand' : 'text-foreground'
                                        }`}
                                        onClick={() => handleSelect(opt.value)}
                                        type="button"
                                    >
                                        {opt.label}
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
