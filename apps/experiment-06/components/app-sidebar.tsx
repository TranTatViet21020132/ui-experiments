"use client";

import * as React from "react";
import Link from "next/link";
import { RiCheckLine } from "@remixicon/react";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { useSubjects } from "@/hooks/use-subjects";
import { useMemo } from "react";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import SidebarCalendar from "@/components/sidebar-calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const data = {
  user: {
    name: "Zanchan",
    email: "vhg@example.com",
    avatar:
      "https://res.cloudinary.com/dlzlfasou/image/upload/v1743935337/user-01_l4if9t.png",
  },
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isColorVisible, toggleColorVisibility } = useCalendarContext();
  const { data: subjects = [], isLoading } = useSubjects();

  const { activeSubjects } = useMemo(() => {
    return {
      activeSubjects: subjects,
    };
  }, [subjects]);

  return (
    <Sidebar
      variant="inset"
      {...props}
      className="dark scheme-only-dark max-lg:p-3 lg:pe-1"
    >
      <SidebarHeader>
        <div className="flex justify-between items-center gap-2">
          <Link className="inline-flex" href="/">
            <span className="sr-only">Logo</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
            >
              <path
                fill="#52525C"
                d="m10.661.863-2.339 1.04 5.251 11.794L1.521 9.072l-.918 2.39 12.053 4.627-11.794 5.25 1.041 2.34 11.794-5.252L9.071 30.48l2.39.917 4.626-12.052 5.251 11.793 2.339-1.04-5.251-11.795 12.052 4.627.917-2.39-12.052-4.627 11.794-5.25-1.041-2.34-11.794 5.252L22.928 1.52l-2.39-.917-4.626 12.052L10.662.863Z"
              />
              <path
                fill="#F4F4F5"
                d="M17.28 0h-2.56v12.91L5.591 3.78l-1.81 1.81 9.129 9.129H0v2.56h12.91L3.78 26.409l1.81 1.81 9.129-9.129V32h2.56V19.09l9.128 9.129 1.81-1.81-9.128-9.129H32v-2.56H19.09l9.129-9.129-1.81-1.81-9.129 9.129V0Z"
              />
            </svg>
          </Link>
          <SidebarTrigger className="text-muted-foreground/80 hover:text-foreground/80 hover:bg-transparent!" />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0 mt-3 pt-3 border-t">
        <SidebarGroup className="px-1">
          <SidebarCalendar />
        </SidebarGroup>
        <SidebarGroup className="px-1 mt-3 pt-4 border-t flex-1 min-h-0">
          <SidebarGroupLabel className="uppercase text-muted-foreground/65">
            Calendars
          </SidebarGroupLabel>
          <SidebarGroupContent className="overflow-y-auto max-h-full">
            {isLoading ? (
              <div className="text-muted-foreground text-sm px-2">
                Loading subjects...
              </div>
            ) : subjects.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No subjects yet. Create events to add subjects.
              </div>
            ) : (
              <>
                {activeSubjects.length > 0 && (
                  <TooltipProvider delayDuration={300}>
                    <SidebarMenu>
                      {activeSubjects.map((subject) => (
                        <SidebarMenuItem key={subject.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                className="relative rounded-md [&>svg]:size-auto justify-between has-focus-visible:border-ring has-focus-visible:ring-ring/50 has-focus-visible:ring-[3px]"
                              >
                                <span>
                                  <span className="font-medium flex items-center justify-start gap-3 flex-1 min-w-0">
                                    <Checkbox
                                      id={subject.id}
                                      className="sr-only peer"
                                      checked={isColorVisible(subject.color)}
                                      onCheckedChange={() =>
                                        toggleColorVisibility(subject.color)
                                      }
                                    />
                                    <RiCheckLine
                                      className="peer-not-data-[state=checked]:invisible shrink-0"
                                      size={16}
                                      aria-hidden="true"
                                    />
                                    <label
                                      htmlFor={subject.id}
                                      className="peer-not-data-[state=checked]:line-through peer-not-data-[state=checked]:text-muted-foreground/65 after:absolute after:inset-0 truncate"
                                    >
                                      {subject.name}
                                    </label>
                                  </span>
                                  <span
                                    className="size-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: subject.color }}
                                  />
                                </span>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="font-medium"
                            >
                              {subject.name}
                            </TooltipContent>
                          </Tooltip>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </TooltipProvider>
                )}
              </>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
