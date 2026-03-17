import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Table } from '../../common/Table';
import { SearchBar } from '../../common/SearchBar';
import { useClasses } from '../../../hooks';
import { mockData } from '../../../mockData';
import { Class } from '../../../types';
import { TableColumn } from '../../../types';

const ClassesPage: React.FC = () => {
  const { classes } = useClasses();
  const [filteredClasses, setFilteredClasses] = useState(classes);

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setFilteredClasses(classes);
    } else {
      const lowerQuery = query.toLowerCase();
      setFilteredClasses(
        classes.filter(
          cls =>
            cls.name.toLowerCase().includes(lowerQuery) ||
            mockData.courses
              .find(c => c.id === cls.courseId)
              ?.name.toLowerCase()
              .includes(lowerQuery)
        )
      );
    }
  };

  const columns: TableColumn<Class>[] = [
    { key: 'name', header: 'Class Name', width: '150px' },
    {
      key: 'courseId',
      header: 'Course',
      width: '250px',
      render: (value) => mockData.courses.find(c => c.id === value)?.name || 'Unknown',
    },
    {
      key: 'semester',
      header: 'Semester',
      width: '100px',
      render: (value) => `Sem ${value}`,
    },
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
          <SearchBar onSearch={handleSearch} placeholder="Search by class name or course..." />
          <Table<Class>
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
          <p className="text-xs text-slate-500">Avg Class Size</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {Math.round(classes.reduce((sum, c) => sum + c.strength, 0) / classes.length)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Total Courses</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {new Set(classes.map(c => c.courseId)).size}
          </p>
        </div>
      </div>

      <Card title="Classes by Course">
        <div className="space-y-2">
          {Array.from(new Set(classes.map(c => c.courseId))).map(courseId => {
            const course = mockData.courses.find(c => c.id === courseId);
            const courseClasses = classes.filter(c => c.courseId === courseId);
            return (
              <div
                key={courseId}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100 hover:bg-slate-100/70 transition-colors"
              >
                <div>
                  <p className="font-medium text-slate-800">{course?.name}</p>
                  <p className="text-sm text-slate-500">{courseClasses.length} class section(s)</p>
                </div>
                <span className="text-xs bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full font-semibold">
                  {courseClasses.reduce((sum, c) => sum + c.strength, 0)} students
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
