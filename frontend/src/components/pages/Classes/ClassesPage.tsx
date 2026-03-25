import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../common/Card';
import { Table } from '../../common/Table';
import { SearchBar } from '../../common/SearchBar';
import { TableColumn } from '../../../types';
import { fetchClasses, type ApiClass } from '../../../services/api';

type ClassRow = ApiClass;

const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchClasses().then(setClasses).catch(() => setClasses([]));
  }, []);

  const filteredClasses = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return classes;
    return classes.filter(
      cls =>
        String(cls.id).includes(q) ||
        cls.division.toLowerCase().includes(q) ||
        String(cls.year).includes(q) ||
        String(cls.floor).includes(q),
    );
  }, [classes, query]);

  const columns: TableColumn<ClassRow>[] = [
    { key: 'id', header: 'Class ID', width: '130px' },
    { key: 'division', header: 'Division', width: '130px' },
    {
      key: 'year',
      header: 'Year',
      width: '100px',
    },
    { key: 'floor', header: 'Floor', width: '100px' },
    {
      key: 'strength',
      header: 'Strength',
      width: '100px',
      render: (value) => `${value} students`,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Classes</h1>
        <p className="text-sm text-slate-500 mt-1">Manage class sections and student groups</p>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar onSearch={setQuery} placeholder="Search by class id, year, floor, or division..." />
          <Table<ClassRow>
            data={filteredClasses}
            columns={columns}
            onRowClick={(cls) => console.log('Clicked class:', cls)}
            rowsPerPage={10}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Total Classes</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{classes.length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Total Students</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{classes.reduce((sum, c) => sum + c.strength, 0)}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Avg Class Strength</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {classes.length ? Math.round(classes.reduce((sum, c) => sum + c.strength, 0) / classes.length) : 0}
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Floors Used</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {new Set(classes.map(c => c.floor)).size}
          </p>
        </div>
      </div>

      <Card title="Classes by Year">
        <div className="space-y-2">
          {Array.from(new Set(classes.map(c => c.year))).sort().map(year => {
            const yearClasses = classes.filter(c => c.year === year);
            return (
              <div
                key={year}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100 hover:bg-slate-100/70 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-800">Year {year}</p>
                  <p className="text-sm text-slate-500">{yearClasses.length} class section(s)</p>
                </div>
                <span className="text-xs bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full font-semibold">
                  {yearClasses.reduce((sum, c) => sum + c.strength, 0)} students
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default ClassesPage;
