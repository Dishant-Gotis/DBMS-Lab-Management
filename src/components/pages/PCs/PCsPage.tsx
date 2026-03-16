import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Table } from '../../common/Table';
import { SearchBar } from '../../common/SearchBar';
import { usePCs } from '../../../hooks';
import { mockData } from '../../../mockData';
import { PC } from '../../../types';
import { TableColumn } from '../../../types';
import { FiGrid, FiList } from 'react-icons/fi';

const PCsPage: React.FC = () => {
  const { pcs } = usePCs();
  const [filteredPCs, setFilteredPCs] = useState(pcs);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSearch = (query: string) => {
    if (query.trim() === '') {
      setFilteredPCs(pcs);
    } else {
      const lowerQuery = query.toLowerCase();
      setFilteredPCs(
        pcs.filter(
          pc =>
            pc.pcNo.toLowerCase().includes(lowerQuery) ||
            pc.os.toLowerCase().includes(lowerQuery) ||
            pc.specs.processor.toLowerCase().includes(lowerQuery)
        )
      );
    }
  };

  const columns: TableColumn<PC>[] = [
    { key: 'pcNo', header: 'PC Number', width: '150px' },
    {
      key: 'labId',
      header: 'Lab',
      width: '200px',
      render: (value) => mockData.labs.find(l => l.id === value)?.name || 'Unknown',
    },
    { key: 'os', header: 'Operating System', width: '200px' },
    {
      key: 'specs',
      header: 'Processor',
      width: '250px',
      render: (_, row) => row.specs.processor,
    },
    {
      key: 'specs',
      header: 'RAM',
      width: '100px',
      render: (_, row) => row.specs.ram,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            value === 'active'
              ? 'bg-green-100 text-green-800'
              : value === 'inactive'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">PCs</h1>
        <p className="text-sm text-slate-500 mt-1">View and monitor lab machines</p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <SearchBar onSearch={handleSearch} placeholder="Search by PC number, OS, or processor..." />
            <div className="flex gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-700 border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FiGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-700 border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FiList size={16} />
              </button>
            </div>
          </div>

          {viewMode === 'list' ? (
            <Table<PC> data={filteredPCs} columns={columns} rowsPerPage={10} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPCs.map(pc => (
                <div
                  key={pc.id}
                  className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-900 tracking-tight">{pc.pcNo}</h3>
                    <p className="text-sm text-slate-500">
                      {mockData.labs.find(l => l.id === pc.labId)?.name}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-slate-500">OS</p>
                      <p className="font-semibold text-slate-900">{pc.os}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Processor</p>
                      <p className="font-semibold text-slate-900 truncate">{pc.specs.processor}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-slate-500">RAM</p>
                        <p className="font-semibold text-slate-900">{pc.specs.ram}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Storage</p>
                        <p className="font-semibold text-slate-900">{pc.specs.storage}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        pc.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : pc.status === 'inactive'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {pc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Total PCs</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{pcs.length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Active</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{pcs.filter(p => p.status === 'active').length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Maintenance</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{pcs.filter(p => p.status === 'maintenance').length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-lg">
          <p className="text-xs text-slate-500">Inactive</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{pcs.filter(p => p.status === 'inactive').length}</p>
        </div>
      </div>
    </div>
  );
};

export default PCsPage;
