import React, { useState } from 'react';
import {
  CheckSquare,
  Edit2,
  ListPlus,
  Plus,
  PlusCircle,
  Trash2,
  X,
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { ChecklistItem, ChecklistTemplate } from '../../types';

export const ChecklistsPage: React.FC = () => {
  const { checklistTemplates, departments, saveChecklistTemplate } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<string[]>([
    'Inspect drive belt tension and pulleys',
    'Lubricate cylinder bearings with specified grease',
    'Inspect electrical control panel & interlocks',
    'Check suction pipe and remove waste accumulation',
  ]);
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    setItems([...items, newItemText.trim()]);
    setNewItemText('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || items.length === 0) return;

    const dept = departments.find((d) => d.id === departmentId);
    const formattedItems: ChecklistItem[] = items.map((label, idx) => ({
      id: `ci-${Date.now()}-${idx}`,
      displayOrder: idx + 1,
      label,
      isRequired: true,
    }));

    saveChecklistTemplate({
      id: `chk-${Date.now()}`,
      templateName,
      departmentId,
      taskCategory: 'Preventive Maintenance',
      items: formattedItems,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setIsModalOpen(false);
    setTemplateName('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Maintenance Checklist Templates
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Standard operating inspection checklists used by technicians when completing machine preventive tasks.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Create New Checklist Template
        </button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {checklistTemplates.map((template) => (
          <div
            key={template.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-400 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-700">{template.templateCode}</span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{template.templateName}</h3>
                  <span className="text-xs font-semibold text-emerald-800">{template.departmentName}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  {template.items.length} items
                </span>
              </div>

              {template.description && (
                <p className="mt-2 text-xs text-slate-700">{template.description}</p>
              )}

              <div className="mt-4 border-t border-slate-100 pt-3">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Sample Inspection Checkpoints
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {template.items.slice(0, 5).map((item, idx) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </li>
                  ))}
                  {template.items.length > 5 && (
                    <li className="text-[11px] text-slate-600 italic">
                      +{template.items.length - 5} more checkpoints...
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3 flex justify-end">
              <span className="text-xs text-slate-700 font-medium">Standard YFL ISO/Preventive Template</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="my-8 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                New Checklist Template
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Draw Frame Weekly Preventive Maintenance"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / ISO Standard
                </label>
                <input
                  type="text"
                  placeholder="Standard PM routine for yarn processing machines"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                />
              </div>

              {/* Checkpoint Builder */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inspection Checkpoints ({items.length})
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 text-xs bg-slate-50 p-1.5 rounded">
                      <span className="text-slate-800 font-medium">#{idx + 1} {it}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Type new checkpoint..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  Save Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
