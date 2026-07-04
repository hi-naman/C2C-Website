import { apiClient } from '@/lib/api-client';
import { YearTarget } from '@/types';

export interface CalendarEventResponse {
  id: string;
  type: 'SESSION' | 'CONTEST' | 'CAMP' | 'HACKATHON';
  title: string;
  date: string; // ISO date string
  endDate: string | null; // ISO date string
  yearTarget: YearTarget;
}

export const calendarService = {
  /**
   * Retrieves merged schedules (sessions, contests, camps, hackathons)
   * @param year Optional class year filter (1, 2, 3, or 4)
   */
  getEvents: async (year?: number): Promise<CalendarEventResponse[]> => {
    const url = year ? `/api/calendar?year=${year}` : '/api/calendar';
    return apiClient<CalendarEventResponse[]>(url);
  },
};
export default calendarService;
