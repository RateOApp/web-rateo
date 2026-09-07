'use client';

import { useId, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SuggestInputProps<T> = {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  /** Fired when a suggestion is clicked or picked with Enter. */
  onSelect: (item: T) => void;
  items: readonly T[];
  itemKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  /** Draws a spinner inside the field (async suggestion sources). */
  loading?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
};

/**
 * Text field with a filtered suggestion list underneath - the pattern all three
 * setup lookups share (job title, industry, company).
 *
 * It is a real ARIA 1.2 combobox: the input keeps focus at all times and the
 * active option is announced through `aria-activedescendant`, so arrow keys and
 * Enter work without the list ever stealing focus. The list is absolutely
 * positioned so opening it never reflows the card.
 */
export function SuggestInput<T>({
  id,
  value,
  onValueChange,
  onSelect,
  items,
  itemKey,
  renderItem,
  placeholder,
  disabled = false,
  loading = false,
  invalid = false,
  describedBy,
  autoFocus = false,
}: SuggestInputProps<T>) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActive] = useState(-1);

  // A shrinking result set (async company search) can strand the highlight past
  // the end of the list. Clamping while reading keeps that impossible without an
  // effect that would re-render on every result.
  const active = activeIndex < items.length ? activeIndex : -1;
  const visible = open && !disabled && items.length > 0;

  function choose(item: T) {
    onSelect(item);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!items.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current + 1) % items.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current <= 0 ? items.length - 1 : current - 1));
      return;
    }
    if (event.key === 'Enter' && visible && active >= 0) {
      event.preventDefault();
      const item = items[active];
      if (item !== undefined) choose(item);
    }
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        className={cn('h-11 rounded-xl', loading && 'pr-10')}
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          visible && active >= 0 ? `${listId}-${active}` : undefined
        }
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => {
          onValueChange(event.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
        }}
        onKeyDown={handleKeyDown}
      />

      {loading ? (
        <Loader2
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-accent-600"
        />
      ) : null}

      <ul
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        hidden={!visible}
        className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover py-1 shadow-md"
      >
        {items.map((item, index) => (
          <li
            key={itemKey(item)}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={index === active}
            className={cn(
              'cursor-pointer px-3 py-2 text-sm text-brand-900',
              index === active ? 'bg-brand-50' : 'hover:bg-muted',
            )}
            onMouseEnter={() => setActive(index)}
            // Keeps focus on the input, so the blur handler never closes the
            // list out from under the click that is selecting an option.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(item)}
          >
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}
