import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BaseResume } from '@job-hunt/types';
import { updateTargetRoles, uploadBaseResume } from '@/features/profile/services/profile';
import { Spinner } from '@/features/core/components/Spinner';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import styles from './PrimaryResumeCard.module.css';

interface PrimaryResumeCardProps {
  resume: BaseResume;
  onDownload: (path: string, fileName: string) => void;
  onView: (id: string) => void;
}

export function PrimaryResumeCard({ resume, onDownload, onView }: PrimaryResumeCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetRoles, setTargetRoles] = useState<string[]>(resume.target_roles || []);
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Track if update came from user to prevent false AI toasts
  const isUserEdit = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  let snapshot = resume.extracted_content?.substring(0, 300) || 'No content available...';
  try {
    if (resume.extracted_content?.trim().startsWith('{')) {
      const parsed = JSON.parse(resume.extracted_content);
      snapshot =
        `Name: ${parsed.name || 'Unknown'}\nEmail: ${parsed.contact?.split('|')[0]?.trim() || ''}\n\nSummary:\n${parsed.summary || ''}`.substring(
          0,
          300
        );
    }
  } catch (_e) {
    // Ignore and fallback to raw text
  }

  const [prevTargetRolesProp, setPrevTargetRolesProp] = useState(resume.target_roles);

  // Sync target roles from props to state (fixes race condition where Edge function finishes before Realtime connects)
  // We use the "derived state during render" pattern to avoid useEffect cascading renders.
  if (resume.target_roles !== prevTargetRolesProp) {
    setPrevTargetRolesProp(resume.target_roles);
    setTargetRoles(resume.target_roles || []);
    if (resume.target_roles && resume.target_roles.length > 0) {
      setIsAiProcessing(false);
    }
  }

  // Subscribe to realtime updates for target_roles from the Edge Function
  useEffect(() => {
    if (!resume.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel('resume-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'base_resumes',
          filter: `id=eq.${resume.id}`,
        },
        (payload) => {
          if (payload.new && payload.new.target_roles !== undefined) {
            setTargetRoles(payload.new.target_roles || []);
            setIsAiProcessing(false);

            if (!isUserEdit.current) {
              if (!payload.new.target_roles || payload.new.target_roles.length === 0) {
                toast.error('AI could not determine target roles. Please add them manually.');
              } else {
                toast.success(
                  'AI has finished analyzing your resume and updated your target roles!',
                  {
                    icon: '🤖',
                    duration: 5000,
                  }
                );
              }
            } else {
              isUserEdit.current = false;
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resume.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setError(null);
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const uploadResponse = await uploadBaseResume(formData);
        if (uploadResponse.error) {
          setError(uploadResponse.error);
        } else {
          if (uploadResponse.contentChanged === false) {
            toast.success('Resume replaced (Content is identical).', { icon: '📄' });
            setIsAiProcessing(false);
          } else {
            setIsAiProcessing(true);
          }
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleSaveRoles = async (rolesToSave: string[]) => {
    isUserEdit.current = true;
    setIsSavingRoles(true);
    setError(null);
    const { error: saveError } = await updateTargetRoles(rolesToSave);
    if (saveError) {
      setError(saveError);
      // Revert if failed
      setTargetRoles(resume.target_roles || []);
    } else {
      setTargetRoles(rolesToSave);
      router.refresh();
    }
    setIsSavingRoles(false);
  };

  const handleAddRole = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newRoleInput.trim()) {
      e.preventDefault();
      const nextRoles = [...targetRoles, newRoleInput.trim()];
      setTargetRoles(nextRoles);
      setNewRoleInput('');
      handleSaveRoles(nextRoles);
    }
  };

  const handleRemoveRole = (roleToRemove: string) => {
    const nextRoles = targetRoles.filter((r) => r !== roleToRemove);
    setTargetRoles(nextRoles);
    handleSaveRoles(nextRoles);
  };

  return (
    <div className={styles.cardPrimary}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.md,.docx"
        style={{ display: 'none' }}
      />

      <div className={styles.badge}>Primary Resume</div>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Master Profile</h3>
          <div className={styles.meta}>
            Last updated: {resume.updated_at ? resume.updated_at.split('T')[0] : 'Unknown'}
          </div>
        </div>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          disabled={isUploading}
          style={{ fontSize: '0.85rem', padding: '6px 12px' }}
        >
          {isUploading ? 'Uploading...' : '🔄 Replace Master Resume'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '4px 0' }}>
          ⚠️ {error}
        </div>
      )}

      <div className={styles.snapshotContainer}>
        {isUploading ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80px',
              gap: '8px',
            }}
          >
            <Spinner width={24} height={24} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Extracting and re-parsing resume...
            </span>
          </div>
        ) : (
          <div className={styles.snapshot}>{snapshot}</div>
        )}
      </div>

      {/* TARGET ROLES SECTION */}
      <div className={styles.rolesSection}>
        <div className={styles.rolesHeader}>
          <span className={styles.rolesTitle}>🎯 Target Scraping Roles</span>
          <button
            className={styles.buttonSecondary}
            style={{
              fontSize: '0.75rem',
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => setIsEditingRoles(!isEditingRoles)}
            disabled={isSavingRoles || isUploading}
          >
            {isEditingRoles ? 'Done' : '✏️ Edit'}
          </button>
        </div>

        <div className={styles.rolesTags}>
          {isAiProcessing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
              <Spinner width={16} height={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                AI is analyzing your resume...
              </span>
            </div>
          ) : (
            targetRoles.map((role) => (
              <div key={role} className={styles.roleTag}>
                {role}
                {isEditingRoles && (
                  <button onClick={() => handleRemoveRole(role)} title="Remove role">
                    ×
                  </button>
                )}
              </div>
            ))
          )}

          {isEditingRoles && (
            <input
              type="text"
              className={styles.roleInput}
              placeholder="Add role & press Enter..."
              value={newRoleInput}
              onChange={(e) => setNewRoleInput(e.target.value)}
              onKeyDown={handleAddRole}
              disabled={isSavingRoles}
            />
          )}

          {targetRoles.length === 0 && !isEditingRoles && !isAiProcessing && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              No target roles defined. Agents will use default roles.
            </span>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={() => onView(resume.id)}
          disabled={isUploading}
        >
          👁️ View Extracted Text
        </button>
        {resume.file_url && (
          <button
            className={`${styles.button} ${styles.buttonPrimary}`}
            onClick={() => onDownload(resume.file_url, `master_resume`)}
            disabled={isUploading}
          >
            📥 Download Original
          </button>
        )}
      </div>
    </div>
  );
}
