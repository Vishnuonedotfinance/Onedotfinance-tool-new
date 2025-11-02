import { Filter, ArrowUpDown } from 'lucide-react';

export default function FilterSort({ 
  onSortChange, 
  onFilterChange, 
  sortOptions = [],
  filterOptions = [],
  currentSort = '',
  currentFilter = ''
}) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      {sortOptions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpDown size={16} />
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '2px solid #e2e8f0' }}
            data-testid="sort-select"
          >
            <option value="">Sort by...</option>
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {filterOptions.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} />
          <select
            value={currentFilter}
            onChange={(e) => onFilterChange(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '2px solid #e2e8f0' }}
            data-testid="filter-select"
          >
            <option value="">Filter by...</option>
            {filterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
