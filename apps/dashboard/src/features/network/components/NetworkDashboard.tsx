'use client';

import { useState, useEffect } from 'react';
import { TargetCompaniesManager } from './TargetCompaniesManager';
import { WarmLeadCard } from './WarmLeadCard';
import { getNetworkingLeads, NetworkingLeadWithSignal } from '../services/network.service';
import styles from '../network.module.css';

export function NetworkDashboard() {
  const [leads, setLeads] = useState<NetworkingLeadWithSignal[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className={styles.header}>
        <h1 className={styles.title}>Networking & Warm Leads</h1>
        <p className={styles.subtitle}>Bypass the cold application black hole.</p>
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
