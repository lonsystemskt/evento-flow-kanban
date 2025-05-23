
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
        return 'bg-emerald-500';
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
    <div className="min-w-[280px] max-w-[280px] bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-3 relative group hover:bg-white">
      {/* Urgency Indicator */}
      <div 
        className={`absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full ${getUrgencyColor(demand.urgency)} shadow-sm`}
        title={getUrgencyText(demand.urgency)}
      ></div>

      {/* Content */}
      <div className="pr-4 mb-3">
        <h4 className="font-semibold text-slate-800 text-sm mb-1.5 line-clamp-2 leading-tight">{demand.title}</h4>
        <p className="text-slate-600 text-xs mb-2 line-clamp-2 leading-relaxed">{demand.subject}</p>
        <p className="text-slate-500 text-xs font-medium">{demand.date.toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
        <div className="flex items-center gap-0.5">
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
          className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-2.5 py-1 h-6 text-xs rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
        >
          <Check className="w-3 h-3 mr-1" />
          Concluir
        </Button>
      </div>
    </div>
  );
};

export default DemandCard;
