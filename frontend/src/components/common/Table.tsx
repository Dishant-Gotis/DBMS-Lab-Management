import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { TableProps } from '../../types';

export const Table = <T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  selectable = false,
  rowsPerPage = 10,
  className = '',
}: TableProps<T>): React.ReactElement => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortColumn(column);
    setSortDirection('asc');
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;

    const left = a[sortColumn];
    const right = b[sortColumn];

    if (left == null && right == null) return 0;
    if (left == null) return 1;
    if (right == null) return -1;

    if (typeof left === 'number' && typeof right === 'number') {
      return sortDirection === 'asc' ? left - right : right - left;
    }

    const leftStr = String(left).toLowerCase();
    const rightStr = String(right).toLowerCase();

    if (leftStr < rightStr) return sortDirection === 'asc' ? -1 : 1;
    if (leftStr > rightStr) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handleSelectRow = (index: number) => {
    const next = new Set(selectedRows);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedRows(next);
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            {selectable && (
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(paginatedData.map((_, i) => startIndex + i)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                  className="rounded border-slate-300"
                />
              </th>
            )}

            {columns.map(column => (
              <th
                key={String(column.key)}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
                className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${
                  column.sortable ? 'cursor-pointer hover:text-slate-600 select-none' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {column.header}
                  {column.sortable && sortColumn === column.key && (
                    <span className="text-slate-500">
                      {sortDirection === 'asc' ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(row)}
                className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(startIndex + index)}
                      onChange={() => handleSelectRow(startIndex + index)}
                      onClick={e => e.stopPropagation()}
                      className="rounded border-slate-300"
                    />
                  </td>
                )}

                {columns.map(column => (
                  <td
                    key={String(column.key)}
                    style={{ width: column.width }}
                    className="px-4 py-3 text-slate-600"
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-10 text-center text-slate-400 text-sm"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1 py-2">
          <p className="text-xs text-slate-400">
            {startIndex + 1}-{Math.min(startIndex + rowsPerPage, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  page === currentPage
                    ? 'bg-indigo-600 text-white'
                    : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
