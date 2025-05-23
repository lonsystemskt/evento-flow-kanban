
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
  const getUrgencyColor = (urgency: Demand['urgency']) => {
    switch (urgency) {
      case 'overdue':
        return 'bg-red-500';
      case 'today':
        return 'bg-orange-500';
      case 'tomorrow':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
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
    <div className="min-w-[280px] max-w-[280px] min-h-[220px] bg-white border border-gray-100 rounded-xl shadow-sm transition-all duration-200 p-4 relative group hover:border-gray-200 hover:shadow-md">
      {/* Urgency Indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 text-xs rounded-full text-white ${getUrgencyColor(demand.urgency).replace('bg-', 'bg-').replace('500', '600')}`}>
          {getUrgencyText(demand.urgency)}
        </span>
        <div 
          className={`w-3 h-3 rounded-full ${getUrgencyColor(demand.urgency)}`}
          title={getUrgencyText(demand.urgency)}
        ></div>
      </div>

      {/* Content */}
      <div className="pr-2 mb-24">
        <h4 className="font-bold text-[#122A3A] text-base mb-2 line-clamp-2 leading-tight">{demand.title}</h4>
        <p className="text-[#122A3A]/70 text-sm mb-3 line-clamp-3 leading-relaxed">{demand.subject}</p>
        <p className="text-[#122A3A]/60 text-xs">{demand.date.toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="w-7 h-7 p-0 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-colors duration-200"
          >
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="w-7 h-7 p-0 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors duration-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        <Button
          size="sm"
          onClick={onComplete}
          className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-3 py-1 h-7 text-xs rounded-full transition-all duration-200 hover:scale-105 border-none"
        >
          <Check className="w-3.5 h-3.5 mr-1" />
          Concluir
        </Button>
      </div>
    </div>
  );
};

export default DemandCard;
