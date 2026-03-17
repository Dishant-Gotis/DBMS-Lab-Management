import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { type DemoLab } from '../../../utils/labData';

interface LabEditorProps {
  mode: 'add' | 'edit';
  initial: Partial<DemoLab>;
  onSave: (data: Omit<DemoLab, 'id'>) => void;
  onClose: () => void;
}

const LabEditor: React.FC<LabEditorProps> = ({ mode, initial, onSave, onClose }) => {
  const [form, setForm] = useState({
    labNo:       initial.labNo       ?? '',
    name:        initial.name        ?? '',
    capacity:    initial.capacity    ?? 30,
    description: initial.description ?? '',
  });

  const valid = form.labNo.trim() && form.name.trim();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={mode === 'add' ? 'Add New Lab' : 'Edit Lab'}
      size="md"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button label="Cancel" variant="secondary" onClick={onClose} />
          <Button label={mode === 'add' ? 'Add Lab' : 'Save'} disabled={!valid} onClick={() => onSave(form)} />
        </div>
      }
    >
      <div className="space-y-3">
        <label className="block text-sm text-slate-600">
          Lab Number *
          <input
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={form.labNo}
            onChange={e => setForm(f => ({ ...f, labNo: e.target.value }))}
            placeholder="e.g. 6113"
            disabled={mode === 'edit'}
          />
        </label>
        <label className="block text-sm text-slate-600">
          Lab Name *
          <input
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Computer Lab 6113"
          />
        </label>
        <label className="block text-sm text-slate-600">
          Capacity (seats)
          <input
            type="number"
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={form.capacity}
            onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
          />
        </label>
        <label className="block text-sm text-slate-600">
          Description
          <textarea
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
            rows={2}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Short description of the lab"
          />
        </label>
      </div>
    </Modal>
  );
};

export default LabEditor;
