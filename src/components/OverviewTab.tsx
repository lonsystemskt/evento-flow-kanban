
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Check } from 'lucide-react';
import { Event, Demand } from '@/types/event';

interface OverviewTabProps {
  events: Event[];
  onEditDemand: (demand: Demand) => void;
  onCompleteDemand: (eventId: string, demandId: string) => void;
}

const OverviewTab = ({ events, onEditDemand, onCompleteDemand }: OverviewTabProps) => {
  const allDemands = events.flatMap(event => 
    event.demands.filter(demand => !demand.completed)
      .map(demand => ({ ...demand, eventName: event.name, eventLogo: event.logo }))
  );

  const sortedDemands = allDemands.sort((a, b) => {
    const urgencyOrder = { 'overdue': 0, 'today': 1, 'tomorrow': 2, 'future': 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

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

  return (
    <div className="space-y-1">
      {sortedDemands.length > 0 ? (
        sortedDemands.map((demand) => (
          <div key={demand.id} className="bg-gray-50/40 rounded-lg border border-gray-200/30 p-3 hover:bg-gray-50/60 transition-all duration-200">
            <div className="flex items-center gap-3">
              {/* Event Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-50/50 to-green-50/50 rounded-full flex items-center justify-center flex-shrink-0">
                {demand.eventLogo ? (
                  <img src={demand.eventLogo} alt={demand.eventName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-[#122A3A] font-bold text-sm">{demand.eventName.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* Event Name */}
              <div className="min-w-0 w-32 flex-shrink-0">
                <p className="text-sm font-medium text-[#122A3A] truncate">{demand.eventName}</p>
              </div>

              {/* Demand Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[#122A3A] text-sm mb-1 truncate">{demand.title}</h4>
                <p className="text-[#122A3A]/60 text-xs truncate">{demand.subject}</p>
              </div>

              {/* Date */}
              <div className="text-xs text-[#122A3A]/50 font-medium w-20 text-center flex-shrink-0">
                {demand.date.toLocaleDateString('pt-BR')}
              </div>

              {/* Priority Indicator */}
              <div className={`w-3 h-3 rounded-full ${getUrgencyColor(demand.urgency)} flex-shrink-0`}></div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditDemand(demand)}
                  className="w-8 h-8 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => onCompleteDemand(demand.eventId, demand.id)}
                  className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-3 py-1 h-8 text-xs font-medium rounded-md transition-all duration-200 hover:scale-105"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Concluir
                </Button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-6xl mb-6">📊</div>
          <p className="text-xl font-medium text-[#122A3A] mb-3">Nenhuma demanda ativa</p>
          <p className="text-lg text-[#122A3A]/70">Todas as demandas foram concluídas</p>
        </div>
      )}
    </div>
  );
};

export default OverviewTab;
