
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, set } from 'date-fns';
import { Calendar as CalendarIcon, Search, Clock, Loader2, ArrowRight } from 'lucide-react'; // Added ArrowRight
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";

interface DateTimeSearchProps extends React.HTMLAttributes<HTMLDivElement> {
  onSearch: (startDate: Date, endDate: Date) => void; // Updated signature
  isLoading: boolean;
}

const DateTimeSearch: React.FC<DateTimeSearchProps> = ({ onSearch, isLoading, className, ...props }) => {
  const now = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(now);
  const [startTime, setStartTime] = useState<string>(format(now, 'HH:mm'));
  const [endDate, setEndDate] = useState<Date | undefined>(now);
  const [endTime, setEndTime] = useState<string>(format(now, 'HH:mm')); // Default end time to now initially
  const { toast } = useToast();

  const handleSearchClick = () => {
    if (startDate && endDate && startTime && endTime) {
      const startDateTime = set(startDate, {
          hours: parseInt(startTime.split(':')[0], 10),
          minutes: parseInt(startTime.split(':')[1], 10),
          seconds: 0,
          milliseconds: 0,
      });
      const endDateTime = set(endDate, {
          hours: parseInt(endTime.split(':')[0], 10),
          minutes: parseInt(endTime.split(':')[1], 10),
          seconds: 0,
          milliseconds: 0,
      });

      if (endDateTime <= startDateTime) {
         toast({
           title: "Invalid Date Range",
           description: "End date and time must be after the start date and time.",
           variant: "destructive",
         });
         return;
      }

      onSearch(startDateTime, endDateTime);
    } else {
      toast({
        title: "Missing Information",
        description: "Please select both start and end dates and times.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={cn("w-full shadow-md rounded-lg border border-border bg-card overflow-hidden", className)} {...props}>
      <CardHeader className="pb-4 pt-5 bg-gradient-to-b from-muted/30 to-transparent border-b border-border/50">
        <CardTitle className="text-lg font-semibold text-primary text-center flex items-center justify-center gap-2">
          <Search className="h-5 w-5" /> Search Recordings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-4 py-6 sm:px-6">
        {/* Group Start and End Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 items-end">
          {/* Start Section */}
          <div className="space-y-5 border-b sm:border-b-0 sm:border-r border-dashed border-border/70 pb-5 sm:pb-0 sm:pr-6">
             <p className="text-sm font-medium text-muted-foreground text-center sm:text-left">Start Time</p>
             <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                 {/* Start Date Picker */}
                 <div className="flex-1 space-y-1.5">
                    <Label htmlFor="start-date-picker" className="flex items-center gap-1.5 text-sm font-medium">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" /> Date
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal rounded-lg border-input shadow-sm",
                                !startDate && "text-muted-foreground",
                                "focus-visible:ring-primary/50 focus-visible:border-primary"
                            )}
                            id="start-date-picker"
                        >
                            {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border rounded-lg shadow-xl">
                        <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            disabled={(d) => d > new Date() || d < new Date("2000-01-01")}
                            className="bg-popover text-popover-foreground rounded-lg"
                         />
                        </PopoverContent>
                    </Popover>
                 </div>

                {/* Start Time Input */}
                <div className="flex-1 space-y-1.5">
                    <Label htmlFor="start-time-input" className="flex items-center gap-1.5 text-sm font-medium">
                        <Clock className="h-4 w-4 text-muted-foreground" /> Time (HH:MM)
                    </Label>
                    <Input
                        id="start-time-input"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-lg border-input shadow-sm focus-visible:ring-primary/50 focus-visible:border-primary"
                        aria-label="Start time for search"
                    />
                </div>
            </div>
          </div>

          {/* End Section */}
          <div className="space-y-5 pt-5 sm:pt-0">
             <p className="text-sm font-medium text-muted-foreground text-center sm:text-left">End Time</p>
             <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                 {/* End Date Picker */}
                 <div className="flex-1 space-y-1.5">
                    <Label htmlFor="end-date-picker" className="flex items-center gap-1.5 text-sm font-medium">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" /> Date
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal rounded-lg border-input shadow-sm",
                                !endDate && "text-muted-foreground",
                                "focus-visible:ring-primary/50 focus-visible:border-primary"
                            )}
                            id="end-date-picker"
                        >
                            {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border rounded-lg shadow-xl">
                        <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                             disabled={(d) => d > new Date() || d < (startDate || new Date("2000-01-01"))} // Disable dates before start date
                            className="bg-popover text-popover-foreground rounded-lg"
                         />
                        </PopoverContent>
                    </Popover>
                 </div>

                {/* End Time Input */}
                <div className="flex-1 space-y-1.5">
                    <Label htmlFor="end-time-input" className="flex items-center gap-1.5 text-sm font-medium">
                        <Clock className="h-4 w-4 text-muted-foreground" /> Time (HH:MM)
                    </Label>
                    <Input
                        id="end-time-input"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-lg border-input shadow-sm focus-visible:ring-primary/50 focus-visible:border-primary"
                        aria-label="End time for search"
                    />
                </div>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearchClick}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg py-3 text-base font-semibold shadow-md transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
          disabled={isLoading || !startDate || !endDate || !startTime || !endTime}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Searching...
            </>
          ) : (
            <>
              <Search className="h-5 w-5" /> Search Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DateTimeSearch;
