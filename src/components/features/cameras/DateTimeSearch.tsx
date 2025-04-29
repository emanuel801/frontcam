"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Clock } from 'lucide-react'; // Added Clock icon
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface DateTimeSearchProps {
  onSearch: (date: Date, time: string) => void;
  isLoading: boolean;
}

const DateTimeSearch: React.FC<DateTimeSearchProps> = ({ onSearch, isLoading }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>(format(new Date(), 'HH:mm')); // Default to current time

  const handleSearchClick = () => {
    if (date) {
      onSearch(date, time);
    } else {
        // Consider using a toast notification here instead of alert
        alert("Please select a date.");
    }
  };

  return (
    // Adjusted max-width and added mx-auto for centering, rounded-lg
    <Card className="w-full max-w-lg mx-auto shadow-md rounded-lg border border-border bg-card">
        <CardHeader className="pb-4 pt-5"> {/* Adjusted padding */}
             <CardTitle className="text-lg font-semibold text-primary text-center flex items-center justify-center gap-2">
                <Search className="h-5 w-5"/> Search Recordings
             </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-5 sm:px-6"> {/* Adjusted padding and spacing */}
             {/* Use flex-col on small screens, sm:flex-row for larger */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                 <div className="flex-1 space-y-1.5"> {/* Reduced spacing */}
                    <Label htmlFor="date-picker" className="flex items-center gap-1 text-sm">
                         <CalendarIcon className="h-4 w-4 text-muted-foreground" /> Date
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal rounded-md border-input", // Added rounded-md and border-input
                            !date && "text-muted-foreground"
                            )}
                            id="date-picker"
                        >
                            {/* Removed CalendarIcon from here, added to label */}
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover border-border rounded-md shadow-lg"> {/* Ensure popover matches theme */}
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                            disabled={(d) => d > new Date() || d < new Date("2000-01-01")} // Disable future dates and very old dates
                            className="bg-popover text-popover-foreground rounded-md" // Style calendar itself
                         />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex-1 space-y-1.5"> {/* Reduced spacing */}
                    <Label htmlFor="time-input" className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" /> Time (HH:MM)
                    </Label>
                    <Input
                        id="time-input"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full rounded-md border-input" // Added rounded-md and border-input
                        aria-label="Time for search"
                    />
                </div>
            </div>

             <Button onClick={handleSearchClick} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-md shadow transition-shadow hover:shadow-md" disabled={isLoading || !date}>
                 <Search className="mr-2 h-4 w-4" />
                {isLoading ? 'Searching...' : 'Search Now'}
             </Button>
        </CardContent>
    </Card>
  );
};

export default DateTimeSearch;
