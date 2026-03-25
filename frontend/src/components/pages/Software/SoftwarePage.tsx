import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../common/Card';
import { Table } from '../../common/Table';
import { SearchBar } from '../../common/SearchBar';
import { TableColumn } from '../../../types';
import { fetchSoftwareCatalog, type ApiSoftwareCatalogRow } from '../../../services/api';

type SoftwareRow = ApiSoftwareCatalogRow;

const SoftwarePage: React.FC = () => {
  const [software, setSoftware] = useState<SoftwareRow[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchSoftwareCatalog().then(setSoftware).catch(() => setSoftware([]));
  }, []);

  const filteredSoftware = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return software;
    return software.filter(
      soft =>
        soft.name.toLowerCase().includes(q) ||
        soft.category.toLowerCase().includes(q) ||
        soft.version.toLowerCase().includes(q) ||
        soft.pcNo.toLowerCase().includes(q),
    );
  }, [software, query]);

  const columns: TableColumn<SoftwareRow>[] = [
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
      key: 'pcNo',
      header: 'Installed On',
      width: '200px',
      render: (_, row) => `${row.pcNo} (${row.labName})`,
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
          <SearchBar onSearch={setQuery} placeholder="Search by software name, category, version, or PC..." />
          <Table<SoftwareRow>
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
