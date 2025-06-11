import supabase from '../core/supabase';

export class MeetService {
  static async getRandomMeetingLink(): Promise<string | null> {
    try {
      // Fetch all meeting links from the table
      const { data, error } = await supabase
        .from('meeting_links')
        .select('link');

      if (error) {
        console.error('Error fetching meeting links:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn('No meeting links found in the database.');
        return null;
      }

      // Get a random link from the list
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex].link;
    } catch (err) {
      console.error('Unexpected error:', err);
      return null;
    }
  }
}
