import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const meetingData = await req.json();

    // Generate markdown report
    const markdown = generateMarkdownReport(meetingData);
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `meeting-report-${timestamp}.md`;

    // Return markdown as downloadable file
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting meeting report:', error);
    return NextResponse.json(
      { error: 'Failed to export meeting report' },
      { status: 500 }
    );
  }
}

function generateMarkdownReport(data: any): string {
  const timestamp = new Date().toLocaleString();
  
  return `# Meeting Report
*Generated on ${timestamp}*

## Executive Summary
${data.summary}

## Meeting Metadata
- **Overall Tone:** ${data.meeting_metadata?.overall_tone || 'N/A'}
- **Productivity Level:** ${data.meeting_metadata?.productivity_level || 'N/A'}
- **Total Speakers:** ${data.meeting_metadata?.total_speakers || 'N/A'}

### Main Outcomes
${data.meeting_metadata?.main_outcomes?.map((outcome: string) => `- ${outcome}`).join('\n') || 'No outcomes recorded'}

### Follow-up Required
${data.meeting_metadata?.follow_up_required?.map((item: string) => `- ${item}`).join('\n') || 'No follow-up items'}

## Action Items & Tasks

${data.tasks?.length > 0 
  ? data.tasks.map((task: any) => `
### ${task.action}
- **Assigned to:** ${task.assigned_to}
- **Priority:** ${task.priority}
- **Deadline:** ${task.deadline || 'Not specified'}
- **Context:** ${task.context || 'No additional context'}
`).join('\n')
  : 'No action items identified'}

## Participants Analysis

${data.participants?.map((participant: any) => `
### ${participant.speaker_id}
- **Participation Level:** ${participant.participation_level}
- **Key Contributions:**
${participant.key_contributions?.map((contribution: string) => `  - ${contribution}`).join('\n') || '  - No contributions recorded'}
- **Expertise Areas:**
${participant.expertise_areas?.map((area: string) => `  - ${area}`).join('\n') || '  - No expertise areas identified'}
`).join('\n') || 'No participant analysis available'}

## Topics Discussed

${data.topics?.map((topic: any) => `
### ${topic.topic}
- **Duration/Emphasis:** ${topic.duration_emphasis}

#### Key Points
${topic.key_points?.map((point: string) => `- ${point}`).join('\n') || 'No key points recorded'}

#### Decisions Made
${topic.decisions_made?.map((decision: string) => `- ${decision}`).join('\n') || 'No decisions recorded'}

#### Open Questions
${topic.open_questions?.map((question: string) => `- ${question}`).join('\n') || 'No open questions'}
`).join('\n') || 'No topics analysis available'}

## Full Transcript

\`\`\`
${data.transcript || 'No transcript available'}
\`\`\`

---
*Report generated using KNest Meeting Analysis*
`;
}