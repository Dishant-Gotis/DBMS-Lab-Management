import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../common/Card';
import { Table } from '../../common/Table';
import { SearchBar } from '../../common/SearchBar';
import { TableColumn } from '../../../types';
import { fetchFacultyCatalog, type ApiFacultyCatalogRow } from '../../../services/api';

type FacultyRow = ApiFacultyCatalogRow;

const FacultyPage: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyRow[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchFacultyCatalog().then(setFaculty).catch(() => setFaculty([]));
  }, []);

  const filteredFaculty = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return faculty;
    return faculty.filter(
      fac =>
        fac.name.toLowerCase().includes(q) ||
        fac.email.toLowerCase().includes(q) ||
        fac.department.toLowerCase().includes(q),
    );
  }, [faculty, query]);

  const columns: TableColumn<FacultyRow>[] = [
    { key: 'name', header: 'Name', width: '200px' },
    { key: 'email', header: 'Email', width: '250px' },
    { key: 'phone', header: 'Phone', width: '150px' },
    { key: 'department', header: 'Department', width: '200px' },
    {
      key: 'id',
      header: 'Courses',
      width: '200px',
      render: (_, row) => row.coursesCount,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Faculty</h1>
        <p className="text-sm text-slate-500 mt-1">Manage faculty and assignment distribution</p>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar onSearch={setQuery} placeholder="Search by name, email, or department..." />
          <Table<FacultyRow>
            data={filteredFaculty}
            columns={columns}
            onRowClick={(fac) => console.log('Clicked faculty:', fac)}
            rowsPerPage={10}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Total Faculty</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{faculty.length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Departments</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {new Set(faculty.map(f => f.department)).size}
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Total Courses</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {faculty.reduce((sum, f) => sum + f.coursesCount, 0)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Avg Courses/Faculty</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {faculty.length > 0 ? (faculty.reduce((sum, f) => sum + f.coursesCount, 0) / faculty.length).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      <Card title="Faculty by Department">
        <div className="space-y-2">
          {Array.from(new Set(faculty.map(f => f.department))).map(dept => {
            const deptFaculty = faculty.filter(f => f.department === dept);
            return (
              <div
                key={dept}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100 hover:bg-slate-100/70 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-800">{dept}</p>
                  <p className="text-sm text-slate-500">{deptFaculty.length} faculty member(s)</p>
                </div>
                <span className="text-xs bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full font-semibold">
                  {deptFaculty.reduce((sum, f) => sum + f.coursesCount, 0)} courses
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default FacultyPage;
