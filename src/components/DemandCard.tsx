
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Check } from 'lucide-react';
import { Demand } from '@/types/event';

interface DemandCardProps {
  demand: Demand;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}

const DemandCard = ({ demand, onEdit, onDelete, onComplete }: DemandCardProps) => {
  console.log('Rendering DemandCard with:', demand);

  const getUrgencyColor = (urgency: Demand['urgency']) => {
    switch (urgency) {
      case 'overdue':
        return 'bg-red-500';
      case 'today':
        return 'bg-orange-500';
      case 'tomorrow':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getUrgencyText = (urgency: Demand['urgency']) => {
    switch (urgency) {
      case 'overdue':
        return 'Atrasado';
      case 'today':
        return 'Hoje';
      case 'tomorrow':
        return 'Amanhã';
      default:
        return 'Futuro';
    }
  };

  return (
    <div className="min-w-[320px] max-w-[320px] min-h-[260px] bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-200 p-6 relative group hover:border-blue-300 hover:shadow-xl flex flex-col">
      {/* Urgency Indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 text-xs font-medium rounded-full text-white ${getUrgencyColor(demand.urgency)}`}>
          {getUrgencyText(demand.urgency)}
        </span>
        <div 
          className={`w-4 h-4 rounded-full ${getUrgencyColor(demand.urgency)} shadow-md`}
          title={getUrgencyText(demand.urgency)}
        ></div>
      </div>

      {/* Content - Takes available space */}
      <div className="flex-1 flex flex-col mb-4">
        <h4 className="font-bold text-[#122A3A] text-lg mb-3 line-clamp-2 leading-tight">
          {demand.title || 'Título não informado'}
        </h4>
        <p className="text-[#122A3A]/70 text-sm mb-4 line-clamp-3 leading-relaxed flex-1">
          {demand.subject || 'Assunto não informado'}
        </p>
        <p className="text-[#122A3A]/60 text-xs font-medium">
          {demand.date ? demand.date.toLocaleDateString('pt-BR') : 'Data não informada'}
        </p>
      </div>

      {/* Actions - Fixed at bottom */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="w-8 h-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors duration-200"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="w-8 h-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          size="sm"
          onClick={onComplete}
          className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-4 py-2 h-8 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 border-none shadow-md"
        >
          <Check className="w-4 h-4 mr-1" />
          Concluir
        </Button>
      </div>
    </div>
  );
};

export default DemandCard;
