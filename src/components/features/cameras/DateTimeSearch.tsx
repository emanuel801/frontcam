
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, set } from 'date-fns';
import { Calendar as CalendarIcon, Search, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";

interface DateTimeSearchProps extends React.HTMLAttributes<HTMLDivElement> {
  onSearch: (dateTime: Date) => void; // Updated signature to accept a single Date object
  isLoading: boolean;
}

const DateTimeSearch: React.FC<DateTimeSearchProps> = ({ onSearch, isLoading, className, ...props }) => {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(now);
  const [selectedTime, setSelectedTime] = useState<string>(format(now, 'HH:mm'));
  const { toast } = useToast();

  const handleSearchClick = () => {
    if (selectedDate && selectedTime) {
      const dateTime = set(selectedDate, {
          hours: parseInt(selectedTime.split(':')[0], 10),
          minutes: parseInt(selectedTime.split(':')[1], 10),
          seconds: 0,
          milliseconds: 0,
      });

      // Basic validation: Ensure selected time is not in the future (allow a small buffer)
      const buffer = 5 * 60 * 1000; // 5 minutes buffer
      if (dateTime.getTime() > Date.now() + buffer) {
         toast({
           title: "Invalid Time",
           description: "Cannot search for recordings in the future.",
           variant: "destructive",
         });
         return;
      }

      onSearch(dateTime);
    } else {
      toast({
        title: "Missing Information",
        description: "Please select both a date and time.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={cn("w-full shadow-md rounded-lg border border-border bg-card overflow-hidden", className)} {...props}>
      <CardHeader className="pb-4 pt-5 bg-gradient-to-b from-muted/30 to-transparent border-b border-border/50">
        <CardTitle className="text-lg font-semibold text-primary text-center flex items-center justify-center gap-2">
          <Search className="h-5 w-5" /> Search Recording at Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-4 py-6 sm:px-6">
        {/* Combined Date and Time Selection */}
        <div className="space-y-5">
           <p className="text-sm font-medium text-muted-foreground text-center sm:text-left">Select Date & Time</p>
           <div className="flex flex-col sm:flex-row sm:items-end gap-4">
               {/* Date Picker */}
               <div className="flex-1 space-y-1.5">
                  <Label htmlFor="date-picker" className="flex items-center gap-1.5 text-sm font-medium">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" /> Date
                  </Label>
                  <Popover>
                      <PopoverTrigger asChild>
                      <Button
                          variant={"outline"}
                          className={cn(
                              "w-full justify-start text-left font-normal rounded-lg border-input shadow-sm",
                              !selectedDate && "text-muted-foreground",
                              "focus-visible:ring-primary/50 focus-visible:border-primary"
                          )}
                          id="date-picker"
                      >
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-popover border-border rounded-lg shadow-xl">
                      <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          disabled={(d) => d > new Date() || d < new Date("2000-01-01")}
                          className="bg-popover text-popover-foreground rounded-lg"
                       />
                      </PopoverContent>
                  </Popover>
               </div>

              {/* Time Input */}
              <div className="flex-1 space-y-1.5">
                  <Label htmlFor="time-input" className="flex items-center gap-1.5 text-sm font-medium">
                      <Clock className="h-4 w-4 text-muted-foreground" /> Time (HH:MM)
                  </Label>
                  <Input
                      id="time-input"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full rounded-lg border-input shadow-sm focus-visible:ring-primary/50 focus-visible:border-primary"
                      aria-label="Time for search"
                  />
              </div>
          </div>
        </div>


        {/* Search Button */}
        <Button
          onClick={handleSearchClick}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg py-3 text-base font-semibold shadow-md transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
          disabled={isLoading || !selectedDate || !selectedTime}
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
