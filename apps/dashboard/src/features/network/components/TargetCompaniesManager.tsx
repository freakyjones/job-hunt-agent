'use client';

import { useState, useEffect } from 'react';
import { TargetCompany } from '@job-hunt/types';
import {
  getTargetCompanies,
  addTargetCompany,
  removeTargetCompany,
} from '../services/network.service';
import styles from '../network.module.css';

export function TargetCompaniesManager() {
  const [companies, setCompanies] = useState<TargetCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCompanies();
  }, []);

  async function loadCompanies() {
    setLoading(true);
    const { data, error } = await getTargetCompanies();
    if (error) {
      setError(error);
    } else if (data) {
      setCompanies(data);
    }
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newUrl) return;

    setIsSubmitting(true);
    const { error } = await addTargetCompany(newName, newUrl);
    if (error) {
      setError(error);
    } else {
      setNewName('');
      setNewUrl('');
      await loadCompanies();
    }
    setIsSubmitting(false);
  }

  async function handleRemove(id: string) {
    const { error } = await removeTargetCompany(id);
    if (error) {
      setError(error);
    } else {
      await loadCompanies();
    }
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Target Companies</h2>
      <p className={styles.subtitle}>Monitor engineering blogs via RSS to find warm leads.</p>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleAdd} className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Company Name</label>
          <input
            type="text"
            className={styles.input}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g., Stripe"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>RSS Feed URL</label>
          <input
            type="url"
            className={styles.input}
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="e.g., https://stripe.com/blog/engineering/rss"
            required
          />
        </div>
        <button type="submit" className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Company'}
        </button>
      </form>

      <div className={styles.companyList}>
        {loading ? (
          <p>Loading...</p>
        ) : companies.length === 0 ? (
          <p className={styles.subtitle}>No target companies added yet.</p>
        ) : (
          companies.map((company) => (
            <div key={company.id} className={styles.companyItem}>
              <div className={styles.companyInfo}>
                <span className={styles.companyName}>{company.company_name}</span>
                <span className={styles.companyUrl}>{company.rss_feed_url}</span>
              </div>
              <button
                onClick={() => handleRemove(company.id)}
                className={styles.buttonOutline}
                style={{ borderColor: 'red', color: 'red' }}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
