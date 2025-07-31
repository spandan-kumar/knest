import { log } from '@/lib/logger';
import type { AnalysisResult } from '../types/meeting.types';

export type MeetingReportData = AnalysisResult;

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

export class ReportExportService {
  generateMarkdownReport(data: MeetingReportData): ExportResult {
    log.debug('📝 Generating markdown report...');
    
    const timestamp = new Date().toLocaleString();
    const isoTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `meeting-report-${isoTimestamp}.md`;
    
    const content = this.buildMarkdownContent(data, timestamp);
    
    log.info({ filename, size: content.length }, '📄 Markdown report generated');
    
    return {
      content,
      filename,
      mimeType: 'text/markdown'
    };
  }

  private buildMarkdownContent(data: MeetingReportData, timestamp: string): string {
    const sections: string[] = [];

    // Header
    sections.push(`# Meeting Report`);
    sections.push(`*Generated on ${timestamp}*`);
    sections.push('');

    // Executive Summary
    sections.push('## Executive Summary');
    sections.push(data.summary);
    sections.push('');

    // Speaker Information (if available and has named speakers)
    if (data.speaker_identification?.speaker_hints) {
      const namedSpeakers = data.speaker_identification.speaker_hints.filter(hint => 
        hint.suggested_name || (hint.role_hints && hint.role_hints.length > 0)
      );
      
      if (namedSpeakers.length > 0) {
        sections.push('## Speaker Information');
        namedSpeakers.forEach(hint => {
          sections.push(`### ${hint.speaker_id}`);
          if (hint.suggested_name) {
            sections.push(`- **Name:** ${hint.suggested_name}`);
          }
          if (hint.role_hints && hint.role_hints.length > 0) {
            sections.push(`- **Role:** ${hint.role_hints.join(', ')}`);
          }
          if (hint.context_clues && hint.context_clues.length > 0) {
            sections.push(`- **Context:** ${hint.context_clues.join(', ')}`);
          }
          sections.push('');
        });
      }
    }

    // Minutes of Meeting (MOM)
    if (data.mom) {
      sections.push('## Minutes of Meeting');
      sections.push('');
      
      sections.push('### Meeting Purpose');
      sections.push(data.mom.meeting_purpose);
      sections.push('');

      if (data.mom.attendees && data.mom.attendees.length > 0) {
        sections.push('### Attendees');
        data.mom.attendees.forEach(attendee => {
          sections.push(`- ${attendee}`);
        });
        sections.push('');
      }

      if (data.mom.key_decisions && data.mom.key_decisions.length > 0) {
        sections.push('### Key Decisions');
        data.mom.key_decisions.forEach(decision => {
          sections.push(`- ${decision}`);
        });
        sections.push('');
      }

      if (data.mom.resolutions && data.mom.resolutions.length > 0) {
        sections.push('### Resolutions');
        data.mom.resolutions.forEach(resolution => {
          sections.push(`- ${resolution}`);
        });
        sections.push('');
      }

      if (data.mom.next_meeting) {
        sections.push('### Next Meeting');
        sections.push(data.mom.next_meeting);
        sections.push('');
      }
    }

    // Meeting Metadata
    if (data.meeting_metadata) {
      sections.push('## Meeting Metadata');
      sections.push(`- **Overall Tone:** ${data.meeting_metadata.overall_tone || 'N/A'}`);
      sections.push(`- **Productivity Level:** ${data.meeting_metadata.productivity_level || 'N/A'}`);
      sections.push(`- **Total Speakers:** ${data.meeting_metadata.total_speakers || 'N/A'}`);
      sections.push('');

      if (data.meeting_metadata.main_outcomes?.length) {
        sections.push('### Main Outcomes');
        sections.push(data.meeting_metadata.main_outcomes.map(outcome => `- ${outcome}`).join('\n'));
        sections.push('');
      }

      if (data.meeting_metadata.follow_up_required?.length) {
        sections.push('### Follow-up Required');
        sections.push(data.meeting_metadata.follow_up_required.map(item => `- ${item}`).join('\n'));
        sections.push('');
      }
    }

    // Action Items & Tasks
    sections.push('## Action Items & Tasks');
    sections.push('');
    
    if (data.tasks?.length) {
      data.tasks.forEach(task => {
        sections.push(`### ${task.action}`);
        sections.push(`- **Assigned to:** ${task.assigned_to}`);
        sections.push(`- **Priority:** ${task.priority || 'Not specified'}`);
        sections.push(`- **Deadline:** ${task.deadline || 'Not specified'}`);
        sections.push(`- **Context:** ${task.context || 'No additional context'}`);
        if (task.deliverable) {
          sections.push(`- **Deliverable:** ${task.deliverable}`);
        }
        sections.push('');
      });
    } else {
      sections.push('No action items identified');
      sections.push('');
    }

    // Participants Analysis
    if (data.participants?.length) {
      sections.push('## Participants Analysis');
      sections.push('');
      
      data.participants.forEach(participant => {
        sections.push(`### ${participant.speaker_id}`);
        sections.push(`- **Participation Level:** ${participant.participation_level}`);
        
        if (participant.key_contributions?.length) {
          sections.push('- **Key Contributions:**');
          sections.push(participant.key_contributions.map(contribution => `  - ${contribution}`).join('\n'));
        } else {
          sections.push('- **Key Contributions:** No contributions recorded');
        }
        
        if (participant.expertise_areas?.length) {
          sections.push('- **Expertise Areas:**');
          sections.push(participant.expertise_areas.map(area => `  - ${area}`).join('\n'));
        } else {
          sections.push('- **Expertise Areas:** No expertise areas identified');
        }
        sections.push('');
      });
    }

    // Topics Discussed
    if (data.topics?.length) {
      sections.push('## Topics Discussed');
      sections.push('');
      
      data.topics.forEach(topic => {
        sections.push(`### ${topic.topic}`);
        sections.push(`- **Duration/Emphasis:** ${topic.duration_emphasis || 'Not specified'}`);
        sections.push('');

        if (topic.key_points?.length) {
          sections.push('#### Key Points');
          sections.push(topic.key_points.map(point => `- ${point}`).join('\n'));
          sections.push('');
        }

        if (topic.decisions_made?.length) {
          sections.push('#### Decisions Made');
          sections.push(topic.decisions_made.map(decision => `- ${decision}`).join('\n'));
          sections.push('');
        }

        if (topic.open_questions?.length) {
          sections.push('#### Open Questions');
          sections.push(topic.open_questions.map(question => `- ${question}`).join('\n'));
          sections.push('');
        }
      });
    }

    // Full Transcript
    if (data.transcript) {
      sections.push('## Full Transcript');
      sections.push('');
      sections.push('```');
      sections.push(data.transcript);
      sections.push('```');
      sections.push('');
    }

    // Footer
    sections.push('---');
    sections.push('*Report generated using KNest Meeting Analysis*');

    return sections.join('\n');
  }
}