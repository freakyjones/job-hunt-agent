'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createClient } from '@/utils/supabase/client';
import { updateTargetRoles } from '@/features/profile/services/profile';
import { Spinner } from '@/features/core/components/Spinner';
import styles from './PrimaryResumeCard.module.css';

interface TargetRolesEditorProps {
  resumeId: string;
  initialRoles: string[];
  isAiProcessing: boolean;
  setIsAiProcessing: (processing: boolean) => void;
  isUploading: boolean;
  onError: (error: string | null) => void;
}

export function TargetRolesEditor({
  resumeId,
  initialRoles,
  isAiProcessing,
  setIsAiProcessing,
  isUploading,
  onError,
}: TargetRolesEditorProps) {
  const [targetRoles, setTargetRoles] = useState<string[]>(initialRoles);
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  // Track if update came from user to prevent false AI toasts
  const isUserEdit = useRef(false);
  const router = useRouter();

  // Sync target roles from props to state (derived state pattern)
  const [prevInitialRoles, setPrevInitialRoles] = useState(initialRoles);
  if (initialRoles !== prevInitialRoles) {
    setPrevInitialRoles(initialRoles);
    setTargetRoles(initialRoles);
    if (initialRoles && initialRoles.length > 0) {
      setIsAiProcessing(false);
    }
  }

  // Subscribe to realtime updates for target_roles from the Edge Function
  useEffect(() => {
    if (!resumeId) return;
    const supabase = createClient();
    const channel = supabase
      .channel('resume-updates-editor')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'base_resumes',
          filter: `id=eq.${resumeId}`,
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
  }, [resumeId, setIsAiProcessing]);

  const handleSaveRoles = async (rolesToSave: string[]) => {
    isUserEdit.current = true;
    setIsSavingRoles(true);
    onError(null);
    const { error: saveError } = await updateTargetRoles(rolesToSave);
    if (saveError) {
      onError(saveError);
      // Revert if failed
      setTargetRoles(initialRoles);
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
    <div className={styles.rolesSection}>
      <div className={styles.rolesHeader}>
        <span className={styles.rolesTitle}>🎯 Target Scraping Roles</span>
        <button
          className={`${styles.buttonSecondary} ${styles.editRolesButton}`}
          onClick={() => setIsEditingRoles(!isEditingRoles)}
          disabled={isSavingRoles || isUploading}
        >
          {isEditingRoles ? 'Done' : '✏️ Edit'}
        </button>
      </div>

      <div className={styles.rolesTags}>
        {isAiProcessing ? (
          <div className={styles.aiProcessingContainer}>
            <Spinner width={16} height={16} className={styles.aiProcessingSpinner} />
            <span className={styles.aiProcessingText}>AI is analyzing your resume...</span>
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
          <span className={styles.emptyRolesText}>
            No target roles defined. Agents will use default roles.
          </span>
        )}
      </div>
    </div>
  );
}
