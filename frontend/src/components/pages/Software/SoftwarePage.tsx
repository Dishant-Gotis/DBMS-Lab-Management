import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Table } from '../../common/Table';
import { SearchBar } from '../../common/SearchBar';
import { useSoftware } from '../../../hooks';
import { mockData } from '../../../mockData';
import { Software } from '../../../types';
import { TableColumn } from '../../../types';

const SoftwarePage: React.FC = () => {
  const { software } = useSoftware();
  const [filteredSoftware, setFilteredSoftware] = useState(software);

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setFilteredSoftware(software);
    } else {
      const lowerQuery = query.toLowerCase();
      setFilteredSoftware(
        software.filter(
          soft =>
            soft.name.toLowerCase().includes(lowerQuery) ||
            soft.category.toLowerCase().includes(lowerQuery) ||
            soft.version.toLowerCase().includes(lowerQuery)
        )
      );
    }
  };

  const columns: TableColumn<Software>[] = [
    { key: 'name', header: 'Software Name', width: '250px' },
    { key: 'version', header: 'Version', width: '120px' },
    { key: 'category', header: 'Category', width: '150px' },
    {
      key: 'installDate',
      header: 'Install Date',
      width: '150px',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'id',
      header: 'Installed On',
      width: '200px',
      render: (softId) => {
        const pcsCount = mockData.pcs.filter(pc => pc.installedSoftware.includes(softId)).length;
        return `${pcsCount} PC${pcsCount !== 1 ? 's' : ''}`;
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Software</h1>
        <p className="text-sm text-slate-500 mt-1">Track and manage installed software</p>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar onSearch={handleSearch} placeholder="Search by software name, category, or version..." />
          <Table<Software>
            data={filteredSoftware}
            columns={columns}
            onRowClick={(soft) => console.log('Clicked software:', soft)}
            rowsPerPage={10}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Total Software</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{software.length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">IDE/Editors</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {software.filter(s => s.category === 'IDE').length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Databases</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {software.filter(s => s.category === 'Database').length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Categories</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {new Set(software.map(s => s.category)).size}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <Card title="Software by Category">
        <div className="space-y-3">
          {Array.from(new Set(software.map(s => s.category))).map(category => (
            <div key={category} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100">
              <span className="font-medium text-slate-800">{category}</span>
              <span className="text-xs bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full font-semibold">
                {software.filter(s => s.category === category).length}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SoftwarePage;
