
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Plus } from 'lucide-react';
import { CRM } from '@/types/event';
import CRMModal from './CRMModal';

interface CRMTabProps {
  crmRecords: CRM[];
  onAddCRM: (crm: Omit<CRM, 'id'>) => void;
  onUpdateCRM: (id: string, crm: Partial<CRM>) => void;
  onDeleteCRM: (id: string) => void;
}

const CRMTab = ({ crmRecords, onAddCRM, onUpdateCRM, onDeleteCRM }: CRMTabProps) => {
  const [isCRMModalOpen, setIsCRMModalOpen] = useState(false);
  const [editingCRM, setEditingCRM] = useState<CRM | null>(null);

  const handleAddCRM = () => {
    setEditingCRM(null);
    setIsCRMModalOpen(true);
  };

  const handleEditCRM = (crm: CRM) => {
    setEditingCRM(crm);
    setIsCRMModalOpen(true);
  };

  const handleSaveCRM = (crmData: Omit<CRM, 'id'>) => {
    if (editingCRM) {
      onUpdateCRM(editingCRM.id, crmData);
    } else {
      onAddCRM(crmData);
    }
    setIsCRMModalOpen(false);
    setEditingCRM(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={handleAddCRM}
          className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl text-base font-medium"
        >
          <Plus className="w-5 h-5" />
          Novo Registro CRM
        </Button>
      </div>

      <div className="space-y-1">
        {crmRecords.length > 0 ? (
          crmRecords.map((crm) => (
            <div key={crm.id} className="bg-gray-50/40 rounded-lg border border-gray-200/30 p-3 hover:bg-gray-50/60 transition-all duration-200">
              <div className="flex items-center gap-3">
                {/* Status Indicator */}
                <div className={`w-3 h-3 rounded-full ${crm.completed ? 'bg-green-500' : 'bg-gray-400'} flex-shrink-0`}></div>

                {/* Name */}
                <div className="min-w-0 w-40 flex-shrink-0 text-left">
                  <p className="text-xs font-medium text-[#122A3A] truncate">{crm.name}</p>
                </div>

                {/* Contact */}
                <div className="min-w-0 w-32 flex-shrink-0 text-left">
                  <p className="text-xs text-[#122A3A]/60 truncate">{crm.contact}</p>
                </div>

                {/* Email */}
                <div className="min-w-0 w-48 flex-shrink-0 text-left">
                  <p className="text-xs text-[#122A3A]/60 truncate">{crm.email}</p>
                </div>

                {/* Subject */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs text-[#122A3A] truncate">{crm.subject}</p>
                </div>

                {/* Date */}
                <div className="text-xs text-[#122A3A]/50 font-medium w-20 text-center flex-shrink-0">
                  {crm.date.toLocaleDateString('pt-BR')}
                </div>

                {/* File */}
                {crm.file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(crm.file, '_blank')}
                    className="text-xs text-blue-600 hover:text-blue-800 flex-shrink-0"
                  >
                    Ver arquivo
                  </Button>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCRM(crm)}
                    className="w-8 h-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateCRM(crm.id, { completed: !crm.completed })}
                    className={`w-8 h-8 p-0 rounded-md transition-colors duration-200 ${
                      crm.completed 
                        ? 'hover:bg-gray-50 hover:text-gray-600' 
                        : 'hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    ✓
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-left py-20 bg-white rounded-xl border border-gray-200 shadow-sm px-6">
            <div className="text-6xl mb-6">📞</div>
            <p className="text-xl font-medium text-[#122A3A] mb-3">Nenhum registro CRM</p>
            <p className="text-base text-[#122A3A]/70">Clique em "Novo Registro CRM" para começar</p>
          </div>
        )}
      </div>

      <CRMModal
        isOpen={isCRMModalOpen}
        onClose={() => {
          setIsCRMModalOpen(false);
          setEditingCRM(null);
        }}
        onSave={handleSaveCRM}
        editingCRM={editingCRM}
      />
    </div>
  );
};

export default CRMTab;
