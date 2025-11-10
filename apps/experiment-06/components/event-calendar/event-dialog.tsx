"use client";

import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
import { format, isBefore } from "date-fns";

import type { CalendarEvent, EventColor } from "@/components/event-calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  StartHour,
  EndHour,
  DefaultStartHour,
  DefaultEndHour,
} from "@/components/event-calendar/constants";

interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    event: CalendarEvent,
    recurrenceData?: {
      isRecurring: boolean;
      selectedDays: number[];
      recurrenceEndDate: Date;
    }
  ) => void;
  onDelete: (eventId: string) => void;
}

// Move color options outside component to prevent recreation
const colorOptions: Array<{
  value: EventColor;
  label: string;
  bgClass: string;
  borderClass: string;
}> = [
  {
    value: "blue",
    label: "Blue",
    bgClass: "bg-blue-400 data-[state=checked]:bg-blue-400",
    borderClass: "border-blue-400 data-[state=checked]:border-blue-400",
  },
  {
    value: "violet",
    label: "Violet",
    bgClass: "bg-violet-400 data-[state=checked]:bg-violet-400",
    borderClass: "border-violet-400 data-[state=checked]:border-violet-400",
  },
  {
    value: "rose",
    label: "Rose",
    bgClass: "bg-rose-400 data-[state=checked]:bg-rose-400",
    borderClass: "border-rose-400 data-[state=checked]:border-rose-400",
  },
  {
    value: "emerald",
    label: "Emerald",
    bgClass: "bg-emerald-400 data-[state=checked]:bg-emerald-400",
    borderClass: "border-emerald-400 data-[state=checked]:border-emerald-400",
  },
  {
    value: "orange",
    label: "Orange",
    bgClass: "bg-orange-400 data-[state=checked]:bg-orange-400",
    borderClass: "border-orange-400 data-[state=checked]:border-orange-400",
  },
];

// Generate time options once at module level
const generateTimeOptions = () => {
  const options = [];
  for (let hour = StartHour; hour <= EndHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      const value = `${formattedHour}:${formattedMinute}`;
      const date = new Date(2000, 0, 1, hour, minute);
      const label = format(date, "h:mm a");
      options.push({ value, label });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

// Memoized TimeSelect component
const TimeSelect = memo(
  ({
    id,
    value,
    onChange,
    label,
  }: {
    id: string;
    value: string;
    onChange: (value: string) => void;
    label: string;
  }) => (
    <div className="min-w-28 *:not-first:mt-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {timeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
);

TimeSelect.displayName = "TimeSelect";

// Memoized DatePicker component
const DatePicker = memo(
  ({
    id,
    label,
    date,
    onDateChange,
    disabled,
    open,
    onOpenChange,
  }: {
    id: string;
    label: string;
    date: Date;
    onDateChange: (date: Date) => void;
    disabled?: { before: Date };
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <div className="flex-1 *:not-first:mt-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
              !date && "text-muted-foreground"
            )}
          >
            <span className={cn("truncate", !date && "text-muted-foreground")}>
              {date ? format(date, "PPP") : "Pick a date"}
            </span>
            <RiCalendarLine
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            disabled={disabled}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                onDateChange(selectedDate);
                onOpenChange(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
);

DatePicker.displayName = "DatePicker";

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState<EventColor>("blue");
  const [error, setError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const [duration, setDuration] = useState("60");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [recurrenceEndDateOpen, setRecurrenceEndDateOpen] = useState(false);

  const formatTimeForInput = useCallback((date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }, []);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(`${DefaultStartHour}:00`);
    setEndTime(`${DefaultEndHour}:00`);
    setAllDay(false);
    setLocation("");
    setColor("blue");
    setError(null);
    setDuration("60");
    setIsRecurring(false);
    setRecurrenceEndDate(undefined);
    setSelectedDays([]);
  }, []);

  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      const start = new Date(event.start);
      const end = new Date(event.end);
      setStartDate(start);
      setEndDate(end);
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      setAllDay(event.allDay || false);
      setLocation(event.location || "");
      setColor((event.color as EventColor) || "sky");
      setError(null);
    } else if (isOpen && !event) {
      resetForm();
    }
  }, [isOpen, event, formatTimeForInput, resetForm]);

  const handleSave = useCallback(() => {
    const start = new Date(startDate);
    let end = new Date(endDate);

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime.split(":").map(Number);

      if (startHours < StartHour || startHours > EndHour) {
        setError(
          `Selected time must be between ${StartHour}:00 and ${EndHour}:00`
        );
        return;
      }

      start.setHours(startHours, startMinutes, 0);

      if (isRecurring) {
        // For recurring events, calculate end from duration
        end = new Date(start);
        end.setMinutes(end.getMinutes() + parseInt(duration));
      } else {
        // For single events, use the end date/time fields
        const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

        if (endHours < StartHour || endHours > EndHour) {
          setError(
            `Selected time must be between ${StartHour}:00 and ${EndHour}:00`
          );
          return;
        }

        end.setHours(endHours, endMinutes, 0);
      }
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    if (isBefore(end, start)) {
      setError("End date cannot be before start date");
      return;
    }

    // Validate recurring event settings
    if (isRecurring) {
      if (selectedDays.length === 0) {
        setError("Please select at least one day for recurring events");
        return;
      }
      if (!recurrenceEndDate) {
        setError("Please select an end date for recurring events");
        return;
      }
      if (isBefore(recurrenceEndDate, startDate)) {
        setError("Recurrence end date must be after start date");
        return;
      }
    }

    const eventTitle = title.trim() ? title : "(no title)";

    const eventData = {
      id: event?.id || "",
      title: eventTitle,
      description,
      start,
      end,
      allDay,
      location,
      color,
    };

    if (isRecurring && recurrenceEndDate) {
      onSave(eventData, {
        isRecurring: true,
        selectedDays,
        recurrenceEndDate,
      });
    } else {
      onSave(eventData);
    }
  }, [
    startDate,
    endDate,
    allDay,
    startTime,
    endTime,
    title,
    description,
    location,
    color,
    event?.id,
    isRecurring,
    selectedDays,
    recurrenceEndDate,
    duration,
    onSave,
  ]);

  const handleDelete = useCallback(() => {
    if (event?.id) {
      onDelete(event.id);
    }
  }, [event?.id, onDelete]);

  const handleStartDateChange = useCallback(
    (date: Date) => {
      setStartDate(date);
      if (isBefore(endDate, date)) {
        setEndDate(date);
      }
      setError(null);
    },
    [endDate]
  );

  const handleEndDateChange = useCallback((date: Date) => {
    setEndDate(date);
    setError(null);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{event?.id ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription className="sr-only">
            {event?.id
              ? "Edit the details of this event"
              : "Add a new event to your calendar"}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}
        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Start Date/Time */}
          <div className="flex gap-4">
            <DatePicker
              id="start-date"
              label="Start Date"
              date={startDate}
              onDateChange={handleStartDateChange}
              open={startDateOpen}
              onOpenChange={setStartDateOpen}
            />
            {!allDay && (
              <TimeSelect
                id="start-time"
                label="Start Time"
                value={startTime}
                onChange={setStartTime}
              />
            )}
          </div>

          {/* Conditionally show End Date/Time OR Duration */}
          {!isRecurring && (
            <div className="flex gap-4">
              <DatePicker
                id="end-date"
                label="End Date"
                date={endDate}
                onDateChange={handleEndDateChange}
                disabled={{ before: startDate }}
                open={endDateOpen}
                onOpenChange={setEndDateOpen}
              />
              {!allDay && (
                <TimeSelect
                  id="end-time"
                  label="End Time"
                  value={endTime}
                  onChange={setEndTime}
                />
              )}
            </div>
          )}

          {isRecurring && !allDay && (
            <div className="*:not-first:mt-1.5">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="150">2.5 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* All day checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day">All day</Label>
          </div>

          {/* Location */}
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Recurring Event Section */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <Label htmlFor="recurring">Repeat weekly</Label>
            </div>

            {isRecurring && (
              <>
                <div className="space-y-2 mt-2">
                  <Label>Repeat on</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day, index) => (
                        <Button
                          key={day}
                          type="button"
                          variant={
                            selectedDays.includes(index) ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => {
                            setSelectedDays((prev) =>
                              prev.includes(index)
                                ? prev.filter((d) => d !== index)
                                : [...prev, index].sort()
                            );
                          }}
                        >
                          {day}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex-1 *:not-first:mt-1.5">
                  <Label htmlFor="recurrence-end-date">Repeat until</Label>
                  <Popover
                    open={recurrenceEndDateOpen}
                    onOpenChange={setRecurrenceEndDateOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        id="recurrence-end-date"
                        variant="outline"
                        className={cn(
                          "group bg-background hover:bg-background border-input w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]",
                          !recurrenceEndDate && "text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "truncate",
                            !recurrenceEndDate && "text-muted-foreground"
                          )}
                        >
                          {recurrenceEndDate
                            ? format(recurrenceEndDate, "PPP")
                            : "Pick end date"}
                        </span>
                        <RiCalendarLine
                          size={16}
                          className="text-muted-foreground/80 shrink-0"
                          aria-hidden="true"
                        />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="start">
                      <Calendar
                        mode="single"
                        selected={recurrenceEndDate}
                        defaultMonth={recurrenceEndDate || startDate}
                        disabled={{ before: startDate }}
                        onSelect={(selectedDate) => {
                          if (selectedDate) {
                            setRecurrenceEndDate(selectedDate);
                            setRecurrenceEndDateOpen(false);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>

          {/* Etiquette/Color */}
          <fieldset className="space-y-4">
            <legend className="text-foreground text-sm leading-none font-medium">
              Etiquette
            </legend>
            <RadioGroup
              className="flex gap-1.5"
              value={color}
              onValueChange={(value: EventColor) => setColor(value)}
            >
              {colorOptions.map((colorOption) => (
                <RadioGroupItem
                  key={colorOption.value}
                  id={`color-${colorOption.value}`}
                  value={colorOption.value}
                  aria-label={colorOption.label}
                  className={cn(
                    "size-6 shadow-none",
                    colorOption.bgClass,
                    colorOption.borderClass
                  )}
                />
              ))}
            </RadioGroup>
          </fieldset>
        </div>

        <DialogFooter className="flex-row sm:justify-between">
          {event?.id && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              size="icon"
              onClick={handleDelete}
              aria-label="Delete event"
            >
              <RiDeleteBinLine size={16} aria-hidden="true" />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
