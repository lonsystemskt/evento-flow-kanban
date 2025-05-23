
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
    <div className="min-w-[176px] max-w-[176px] min-h-[88px] bg-gray-50/40 rounded-lg border border-gray-200/30 flex flex-col p-3">
      {/* Urgency Indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-md text-white ${getUrgencyColor(demand.urgency)}`}>
          {getUrgencyText(demand.urgency)}
        </span>
        <div 
          className={`w-2 h-2 rounded-full ${getUrgencyColor(demand.urgency)}`}
          title={getUrgencyText(demand.urgency)}
        ></div>
      </div>

      {/* Content - Takes available space */}
      <div className="flex-1 flex flex-col mb-2">
        <h4 className="font-semibold text-[#122A3A] text-[13px] mb-1 line-clamp-2 leading-tight">
          {demand.title || 'Título não informado'}
        </h4>
        <p className="text-[#122A3A]/60 text-[10px] mb-1 line-clamp-2 leading-relaxed flex-1">
          {demand.subject || 'Assunto não informado'}
        </p>
        <p className="text-[#122A3A]/50 text-[10px] font-medium">
          {demand.date ? demand.date.toLocaleDateString('pt-BR') : 'Data não informada'}
        </p>
      </div>

      {/* Actions - Fixed at bottom */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="w-6 h-6 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="w-6 h-6 p-0 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors duration-200"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        
        <Button
          size="sm"
          onClick={onComplete}
          className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-2 py-1 h-6 text-[9px] font-medium rounded-md transition-all duration-200 hover:scale-105 border-none"
        >
          <Check className="w-3 h-3 mr-1" />
          Concluir
        </Button>
      </div>
    </div>
  );
};

export default DemandCard;
