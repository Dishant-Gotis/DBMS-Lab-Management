import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Table } from '../../common/Table';
import { SearchBar } from '../../common/SearchBar';
import { useLabs } from '../../../hooks';
import { mockData } from '../../../mockData';
import { Lab } from '../../../types';
import { TableColumn } from '../../../types';

const LabsPage: React.FC = () => {
  const { labs } = useLabs();
  const [filteredLabs, setFilteredLabs] = useState(labs);
  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setFilteredLabs(labs);
    } else {
      const lowerQuery = query.toLowerCase();
      setFilteredLabs(
        labs.filter(
          lab =>
            lab.name.toLowerCase().includes(lowerQuery) ||
            lab.labNo.toLowerCase().includes(lowerQuery) ||
            lab.description.toLowerCase().includes(lowerQuery)
        )
      );
    }
  };

  const columns: TableColumn<Lab>[] = [
    { key: 'labNo', header: 'Lab Number', width: '100px' },
    { key: 'name', header: 'Lab Name', width: '200px' },
    {
      key: 'capacity',
      header: 'Capacity',
      width: '100px',
      render: (value) => `${value} seats`,
    },
    {
      key: 'collegeId',
      header: 'College',
      width: '200px',
      render: (value) => mockData.colleges.find(c => c.id === value)?.name || 'Unknown',
    },
    {
      key: 'assignedAssistant',
      header: 'Lab Assistant',
      width: '200px',
      render: (value) =>
        value ? mockData.labAssistants.find(a => a.id === value)?.name || 'Unassigned' : 'Unassigned',
    },
    {
      key: 'description',
      header: 'Description',
      width: '300px',
      render: (value) => (value ? value.substring(0, 50) + '...' : '-'),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Labs</h1>
        <p className="text-sm text-slate-500 mt-1">Manage and view laboratory facilities</p>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar onSearch={handleSearch} placeholder="Search labs by name, number, or description..." />
          <Table<Lab>
            data={filteredLabs}
            columns={columns}
            onRowClick={(lab) => console.log('Clicked lab:', lab)}
            rowsPerPage={10}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Total Labs</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{labs.length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Total Capacity</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{labs.reduce((sum, lab) => sum + lab.capacity, 0)}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Avg Capacity</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {Math.round(labs.reduce((sum, lab) => sum + lab.capacity, 0) / labs.length)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Assigned Assistants</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{labs.filter(l => l.assignedAssistant).length}</p>
        </div>
      </div>
    </div>
  );
};

export default LabsPage;
