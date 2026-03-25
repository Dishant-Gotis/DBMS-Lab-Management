import React, { useMemo, useState } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { type DemoPC } from '../../../utils/labData';

type SoftwareEntry = { id: string; name: string; version: string; category: string };

interface SoftwareManagerProps {
  pc: DemoPC;
  installedIds: string[];
  availableSoftware?: SoftwareEntry[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
}

const SoftwareManager: React.FC<SoftwareManagerProps> = ({ pc, installedIds, availableSoftware = [], onSave, onClose }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(installedIds));
  const [customSoftware, setCustomSoftware] = useState<SoftwareEntry[]>([]);
  const [newSoftwareForm, setNewSoftwareForm] = useState({ name: '', version: '', category: '' });

  const allAvailableSoftware = useMemo(
    () => [...availableSoftware, ...customSoftware],
    [availableSoftware, customSoftware]
  );

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddSoftware = () => {
    const { name, version, category } = newSoftwareForm;
    if (!name.trim() || !version.trim() || !category.trim()) return;
    const newEntry: SoftwareEntry = { id: `custom-${Date.now()}`, name: name.trim(), version: version.trim(), category: category.trim() };
    setCustomSoftware(prev => [...prev, newEntry]);
    setSelected(prev => new Set(prev).add(newEntry.id));
    setNewSoftwareForm({ name: '', version: '', category: '' });
  };

  const newSoftwareValid =
    newSoftwareForm.name.trim() && newSoftwareForm.version.trim() && newSoftwareForm.category.trim();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Software — ${pc.pcNo}`}
      size="md"
      footer={
        <div className="w-full space-y-3">
          {/* Add New Software — pinned in footer so always visible */}
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Add New Software</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <input
                className="col-span-3 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="Software name *"
                value={newSoftwareForm.name}
                onChange={e => setNewSoftwareForm(f => ({ ...f, name: e.target.value }))}
              />
              <input
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="Version"
                value={newSoftwareForm.version}
                onChange={e => setNewSoftwareForm(f => ({ ...f, version: e.target.value }))}
              />
              <input
                className="col-span-2 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                placeholder="Category (e.g. IDE)"
                value={newSoftwareForm.category}
                onChange={e => setNewSoftwareForm(f => ({ ...f, category: e.target.value }))}
              />
            </div>
            <Button label="+ Add to List" size="sm" disabled={!newSoftwareValid} onClick={handleAddSoftware} />
          </div>
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="secondary" onClick={onClose} />
            <Button label="Save Changes" onClick={() => onSave([...selected])} />
          </div>
        </div>
      }
    >
      <p className="text-xs text-slate-500 mb-3">Check software to mark as installed on this PC.</p>
      <div className="space-y-1.5">
        {allAvailableSoftware.map(sw => (
          <label
            key={sw.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              selected.has(sw.id) ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50 border border-transparent'
            }`}
          >
            <input
              type="checkbox"
              className="accent-sky-500"
              checked={selected.has(sw.id)}
              onChange={() => toggle(sw.id)}
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-800">{sw.name}</span>
              <span className="ml-2 font-mono text-xs text-slate-400">{sw.version}</span>
            </div>
            <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{sw.category}</span>
          </label>
        ))}
      </div>
    </Modal>
  );
};

export default SoftwareManager;
