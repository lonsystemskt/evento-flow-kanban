
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
    <div className="min-w-[160px] max-w-[160px] min-h-[120px] bg-gray-50/30 rounded-lg border border-gray-100/60 flex flex-col p-2.5">
      {/* Urgency Indicator */}
      <div className="flex items-center justify-between mb-1.5">
        <span className={`px-1 py-0.5 text-[9px] font-medium rounded-md text-white ${getUrgencyColor(demand.urgency)}`}>
          {getUrgencyText(demand.urgency)}
        </span>
        <div 
          className={`w-1.5 h-1.5 rounded-full ${getUrgencyColor(demand.urgency)}`}
          title={getUrgencyText(demand.urgency)}
        ></div>
      </div>

      {/* Content - Takes available space */}
      <div className="flex-1 flex flex-col mb-1.5">
        <h4 className="font-semibold text-[#122A3A] text-xs mb-0.5 line-clamp-2 leading-tight">
          {demand.title || 'Título não informado'}
        </h4>
        <p className="text-[#122A3A]/60 text-[9px] mb-1 line-clamp-2 leading-relaxed flex-1">
          {demand.subject || 'Assunto não informado'}
        </p>
        <p className="text-[#122A3A]/50 text-[8px] font-medium">
          {demand.date ? demand.date.toLocaleDateString('pt-BR') : 'Data não informada'}
        </p>
      </div>

      {/* Actions - Fixed at bottom */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="w-5 h-5 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
          >
            <Edit className="w-2.5 h-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="w-5 h-5 p-0 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors duration-200"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </Button>
        </div>
        
        <Button
          size="sm"
          onClick={onComplete}
          className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-1.5 py-0.5 h-5 text-[8px] font-medium rounded-md transition-all duration-200 hover:scale-105 border-none"
        >
          <Check className="w-2.5 h-2.5 mr-0.5" />
          Concluir
        </Button>
      </div>
    </div>
  );
};

export default DemandCard;
