
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
    <div className="min-w-[260px] max-w-[260px] bg-white border border-gray-100 rounded-lg transition-all duration-200 p-3 relative group hover:border-gray-200">
      {/* Urgency Indicator */}
      <div 
        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getUrgencyColor(demand.urgency)}`}
        title={getUrgencyText(demand.urgency)}
      ></div>

      {/* Content */}
      <div className="pr-3 mb-3">
        <h4 className="font-medium text-gray-900 text-sm mb-1.5 line-clamp-2 leading-tight">{demand.title}</h4>
        <p className="text-gray-600 text-xs mb-2 line-clamp-2 leading-relaxed">{demand.subject}</p>
        <p className="text-gray-500 text-xs">{demand.date.toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="w-6 h-6 p-0 hover:bg-gray-100 hover:text-gray-700 rounded transition-colors duration-200"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="w-6 h-6 p-0 hover:bg-red-50 hover:text-red-600 rounded transition-colors duration-200"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        
        <Button
          size="sm"
          onClick={onComplete}
          className="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 h-6 text-xs rounded transition-all duration-200 hover:scale-105"
        >
          <Check className="w-3 h-3 mr-1" />
          Concluir
        </Button>
      </div>
    </div>
  );
};

export default DemandCard;
