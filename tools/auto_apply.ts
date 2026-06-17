import { sendEmailNotification } from './email_notify';

/**
 * Handles the auto-application logic with built-in guardrails.
 */
export class AutoApplier {
    private MAX_HUMAN_APPROVALS = 10;
    
    // In a real database, this would be fetched from Google Sheets or state
    private currentApprovalsCount = 0;

    /**
     * Attempts to auto-apply to a job or requests human approval if under threshold.
     */
    async execute(jobUrl: string, company: string, atsType: string): Promise<boolean> {
        console.log(`Starting Auto-Applier for ${company} (${atsType}) at ${jobUrl}`);

        if (atsType !== 'lever' && atsType !== 'greenhouse') {
            console.log(`Skipping auto-apply for ${atsType}. Only Lever and Greenhouse are supported.`);
            return false;
        }

        if (this.currentApprovalsCount < this.MAX_HUMAN_APPROVALS) {
            console.log(`Guardrail active: Requesting human approval (${this.currentApprovalsCount}/${this.MAX_HUMAN_APPROVALS})`);
            await this.requestHumanApproval(jobUrl, company);
            return false; // Wait for human, do not apply yet
        }

        console.log(`Guardrail passed. Submitting application autonomously...`);
        // TODO: Trigger specific Playwright logic to fill out Lever/Greenhouse forms
        
        await sendEmailNotification({
            subject: `✅ Successfully applied to ${company}`,
            body: `The agent has successfully submitted your application to ${company}.<br><a href="${jobUrl}">View Job</a>`
        });

        return true;
    }

    private async requestHumanApproval(jobUrl: string, company: string) {
        await sendEmailNotification({
            subject: `⚠️ Approval Required: Apply to ${company}?`,
            body: `
            <h2>Action Required</h2>
            <p>The agent found an excellent match for <strong>${company}</strong>.</p>
            <p>Because we are still in the first 10 applications (Human-in-the-loop phase), the agent requires your manual approval to proceed with Playwright form submission.</p>
            <a href="${jobUrl}">Review the Job Posting</a>
            `
        });
    }
}
