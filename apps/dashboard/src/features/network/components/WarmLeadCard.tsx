'use client';

import { useState } from 'react';
import { NetworkingLeadStatus } from '@job-hunt/types';
import { NetworkingLeadWithSignal, updateNetworkingLeadStatus } from '../services/network.service';
import styles from '../network.module.css';

interface WarmLeadCardProps {
  lead: NetworkingLeadWithSignal;
  onStatusChange: () => void;
}

export function WarmLeadCard({ lead, onStatusChange }: WarmLeadCardProps) {
  const [updating, setUpdating] = useState(false);

  async function handleMarkSent() {
    setUpdating(true);
    await updateNetworkingLeadStatus(lead.id, NetworkingLeadStatus.SENT);
    setUpdating(false);
    onStatusChange();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(lead.draft_message);
    // Optionally trigger a toast here
  }

  return (
    <div className={styles.leadCard}>
      <div className={styles.leadHeader}>
        <div className={styles.leadContact}>
          <span className={styles.contactName}>{lead.contact_name}</span>
          {lead.contact_role && <span className={styles.contactRole}>{lead.contact_role}</span>}
        </div>
        <span
          className={`${styles.badge} ${lead.status === NetworkingLeadStatus.PENDING ? styles.badgePending : styles.badgeSent}`}
        >
          {lead.status}
        </span>
      </div>

      <div className={styles.signalBox}>
        <div className={styles.signalLabel}>Trigger Signal</div>
        <div className={styles.signalTitle}>
          <a href={lead.company_signals.source_url} target="_blank" rel="noopener noreferrer">
            {lead.company_signals.title}
          </a>
        </div>
      </div>

      <div className={styles.draftBox}>{lead.draft_message}</div>

      <div className={styles.actions}>
        <button onClick={copyToClipboard} className={styles.buttonOutline}>
          Copy Draft
        </button>
        {lead.status !== NetworkingLeadStatus.SENT && (
          <button onClick={handleMarkSent} className={styles.button} disabled={updating}>
            {updating ? 'Updating...' : 'Mark as Sent'}
          </button>
        )}
      </div>
    </div>
  );
}
