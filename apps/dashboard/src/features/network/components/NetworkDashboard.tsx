'use client';

import { useState, useEffect } from 'react';
import { TargetCompaniesManager } from './TargetCompaniesManager';
import { WarmLeadCard } from './WarmLeadCard';
import { getNetworkingLeads, NetworkingLeadWithSignal } from '../services/network.service';
import { triggerNetworkingAction } from '@/app/actions';
import toast from 'react-hot-toast';
import pageStyles from '@/app/page.module.css';
import styles from '../network.module.css';

export function NetworkDashboard() {
  const [leads, setLeads] = useState<NetworkingLeadWithSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTriggerNetworkAgent = async () => {
    setIsTriggering(true);
    const loadingToast = toast.loading('Waking up the Network Agent...');
    try {
      const res = await triggerNetworkingAction();
      if (res.success) {
        toast.success('Network Agent triggered!', { id: loadingToast });
      } else {
        toast.error(`Failed to trigger: ${res.error}`, { id: loadingToast });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? `Error: ${e.message}` : 'An unexpected error occurred', {
        id: loadingToast,
      });
    }
    setIsTriggering(false);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    const { data } = await getNetworkingLeads();
    if (data) {
      setLeads(data);
    }
    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h1 className={styles.title}>Networking & Warm Leads</h1>
          <p className={styles.subtitle}>Bypass the cold application black hole.</p>
        </div>
        <div>
          <button
            className={pageStyles.buttonSmall}
            style={
              isTriggering
                ? {
                    opacity: 0.5,
                    border: '1px solid #3ecf8e',
                    color: '#3ecf8e',
                    padding: '6px 12px',
                    background: 'var(--bg-surface)',
                  }
                : {
                    border: '1px solid #3ecf8e',
                    color: '#3ecf8e',
                    padding: '6px 12px',
                    background: 'var(--bg-surface)',
                  }
            }
            onClick={handleTriggerNetworkAgent}
            disabled={isTriggering}
          >
            Network Agent
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <div>
          <TargetCompaniesManager />
        </div>

        <div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Generated Warm Leads</h2>

            <div className={styles.leadList}>
              {loading ? (
                <p>Loading leads...</p>
              ) : leads.length === 0 ? (
                <p className={styles.subtitle}>
                  No warm leads generated yet. Add target companies to start monitoring.
                </p>
              ) : (
                leads.map((lead) => (
                  <WarmLeadCard key={lead.id} lead={lead} onStatusChange={loadLeads} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
