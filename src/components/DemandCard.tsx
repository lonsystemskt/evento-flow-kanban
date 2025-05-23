
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
        return 'bg-slate-300';
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
    <div className="min-w-[300px] max-w-[300px] bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 relative group">
      {/* Urgency Indicator */}
      <div 
        className={`absolute top-3 right-3 w-3 h-3 rounded-full ${getUrgencyColor(demand.urgency)}`}
        title={getUrgencyText(demand.urgency)}
      ></div>

      {/* Content */}
      <div className="pr-6">
        <h4 className="font-semibold text-slate-800 text-sm mb-2 line-clamp-2">{demand.title}</h4>
        <p className="text-slate-600 text-xs mb-3 line-clamp-3">{demand.subject}</p>
        <p className="text-slate-500 text-xs font-medium">{demand.date.toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="w-7 h-7 p-0 hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="w-7 h-7 p-0 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        
        <Button
          size="sm"
          onClick={onComplete}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 h-7 text-xs rounded-md transition-all duration-200 hover:scale-105"
        >
          <Check className="w-3 h-3 mr-1" />
          Concluir
        </Button>
      </div>
    </div>
  );
};

export default DemandCard;
