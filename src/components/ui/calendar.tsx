import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const handleDayClick = (day: Date, modifiers: any, e: React.MouseEvent) => {
    if (!modifiers.disabled) {
      // Handle different selection modes properly
      if ('onSelect' in props && typeof props.onSelect === 'function') {
        if (props.mode === 'single') {
          (props.onSelect as any)(day, day, modifiers, e);
        } else if (props.mode === 'multiple') {
          // For multiple mode, we need to handle array of dates
          const currentSelected = props.selected as Date[] || [];
          const isSelected = currentSelected.some(date => 
            date.toDateString() === day.toDateString()
          );
          let newSelected: Date[];
          if (isSelected) {
            newSelected = currentSelected.filter(date => 
              date.toDateString() !== day.toDateString()
            );
          } else {
            newSelected = [...currentSelected, day];
          }
          (props.onSelect as any)(newSelected, day, modifiers, e);
        } else {
          // Default case
          (props.onSelect as any)(day, day, modifiers, e);
        }
      }
      
      // Close popover after selection for single mode
      if (props.mode === 'single') {
        setTimeout(() => {
          const popoverTrigger = document.querySelector('[data-state="open"]');
          if (popoverTrigger) {
            const closeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            document.dispatchEvent(closeEvent);
          }
        }, 100);
      }
    }
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      onDayClick={handleDayClick}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
