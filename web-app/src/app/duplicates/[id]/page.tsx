'use client';

/**
 * Duplicate Detail Page
 * F001: Data Quality & Import System
 *
 * Features:
 * - Side-by-side comparison of duplicate entities
 * - Field-by-field selection for merging
 * - Merge action
 * - Mark as not duplicate / ignored
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Merge, XCircle, Ban } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { DuplicateCandidate } from '@/types/duplicates';

interface EntityData {
  id: string;
  [key: string]: any;
}

export default function DuplicateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const duplicateId = params.id as string;

  const [duplicate, setDuplicate] = useState<DuplicateCandidate | null>(null);
  const [entity1, setEntity1] = useState<EntityData | null>(null);
  const [entity2, setEntity2] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Merge state
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);

  // Resolve state
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveAction, setResolveAction] = useState<'not_duplicate' | 'ignored' | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    async function fetchDuplicate() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/duplicates/${duplicateId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch duplicate');
        }

        setDuplicate(data.duplicate);
        setEntity1(data.entity1);
        setEntity2(data.entity2);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load duplicate');
      } finally {
        setLoading(false);
      }
    }

    if (duplicateId) {
      fetchDuplicate();
    }
  }, [duplicateId]);

  const handleMerge = async () => {
    if (!selectedEntity || !duplicate || !entity1 || !entity2) return;

    setMerging(true);
    try {
      const keepEntity = selectedEntity === 'entity1' ? entity1 : entity2;
      const mergeEntity = selectedEntity === 'entity1' ? entity2 : entity1;

      const res = await fetch(`/api/duplicates/${duplicateId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keep_id: keepEntity.id,
          merge_id: mergeEntity.id,
          merged_data: keepEntity, // For now, keep all fields from selected entity
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to merge entities');
      }

      alert('Entities merged successfully!');
      router.push('/duplicates');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to merge entities');
    } finally {
      setMerging(false);
      setShowMergeDialog(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveAction) return;

    setResolving(true);
    try {
      const res = await fetch(`/api/duplicates/${duplicateId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: resolveAction }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resolve duplicate');
      }

      alert(`Marked as ${resolveAction.replace('_', ' ')}`);
      router.push('/duplicates');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resolve duplicate');
    } finally {
      setResolving(false);
      setShowResolveDialog(false);
    }
  };

  const renderFieldComparison = (field: string, label: string) => {
    if (!entity1 || !entity2) return null;

    const value1 = entity1[field];
    const value2 = entity2[field];
    const isDifferent = value1 !== value2;
    const isMatching = duplicate?.matching_fields?.includes(field);

    return (
      <div className="grid grid-cols-2 gap-4 py-3 border-b">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className={`${isMatching ? 'text-green-600 font-medium' : ''}`}>
            {value1 || <span className="text-muted-foreground">—</span>}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className={`${isMatching ? 'text-green-600 font-medium' : ''}`}>
            {value2 || <span className="text-muted-foreground">—</span>}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  if (error || !duplicate || !entity1 || !entity2) {
    return (
      <AppShell>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Duplicate not found'}</AlertDescription>
        </Alert>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/duplicates')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Duplicates
            </Button>
            <h1 className="text-3xl font-bold">Duplicate Review</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{duplicate.entity_type}</Badge>
              <Badge>{duplicate.similarity_score}% match</Badge>
              {duplicate.matching_fields.length > 0 && (
                <Badge variant="secondary">
                  Matching: {duplicate.matching_fields.join(', ')}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setResolveAction('not_duplicate');
                setShowResolveDialog(true);
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Not Duplicate
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResolveAction('ignored');
                setShowResolveDialog(true);
              }}
            >
              <Ban className="mr-2 h-4 w-4" />
              Ignore
            </Button>
          </div>
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-all ${
              selectedEntity === 'entity1' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedEntity('entity1')}
          >
            <CardHeader>
              <CardTitle>Entity 1 (Keep This?)</CardTitle>
              <CardDescription>Click to select as primary entity</CardDescription>
            </CardHeader>
            <CardContent>
              {duplicate.entity_type === 'account' ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{entity1.name}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">Domain</p>
                  <p>{entity1.domain || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">Industry</p>
                  <p>{entity1.industry || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">Location</p>
                  <p>
                    {[entity1.city, entity1.state, entity1.country]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {entity1.first_name} {entity1.last_name}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">Email</p>
                  <p>{entity1.email || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">Title</p>
                  <p>{entity1.title || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">LinkedIn</p>
                  <p>{entity1.linkedin_url || '—'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedEntity === 'entity2' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedEntity('entity2')}
          >
            <CardHeader>
              <CardTitle>Entity 2 (Keep This?)</CardTitle>
              <CardDescription>Click to select as primary entity</CardDescription>
            </CardHeader>
            <CardContent>
              {duplicate.entity_type === 'account' ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{entity2.name}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">Domain</p>
                  <p>{entity2.domain || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">Industry</p>
                  <p>{entity2.industry || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">Location</p>
                  <p>
                    {[entity2.city, entity2.state, entity2.country]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {entity2.first_name} {entity2.last_name}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">Email</p>
                  <p>{entity2.email || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">Title</p>
                  <p>{entity2.title || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-4">LinkedIn</p>
                  <p>{entity2.linkedin_url || '—'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Merge Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => setShowMergeDialog(true)}
            disabled={!selectedEntity || duplicate.status !== 'pending'}
          >
            <Merge className="mr-2 h-5 w-5" />
            Merge Entities
          </Button>
        </div>

        {/* Detailed Field Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Field Comparison</CardTitle>
            <CardDescription>
              Green fields indicate matching data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {duplicate.entity_type === 'account' ? (
              <div>
                {renderFieldComparison('name', 'Name')}
                {renderFieldComparison('domain', 'Domain')}
                {renderFieldComparison('website', 'Website')}
                {renderFieldComparison('industry', 'Industry')}
                {renderFieldComparison('employee_count', 'Employees')}
                {renderFieldComparison('annual_revenue', 'Revenue')}
                {renderFieldComparison('phone', 'Phone')}
                {renderFieldComparison('city', 'City')}
                {renderFieldComparison('state', 'State')}
                {renderFieldComparison('country', 'Country')}
              </div>
            ) : (
              <div>
                {renderFieldComparison('first_name', 'First Name')}
                {renderFieldComparison('last_name', 'Last Name')}
                {renderFieldComparison('email', 'Email')}
                {renderFieldComparison('phone', 'Phone')}
                {renderFieldComparison('title', 'Title')}
                {renderFieldComparison('linkedin_url', 'LinkedIn URL')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Merge Confirmation Dialog */}
      <AlertDialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Merge</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to merge these entities? This action cannot be undone.
              The selected entity will be kept, and the other will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMerge} disabled={merging}>
              {merging ? 'Merging...' : 'Merge Entities'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resolve Confirmation Dialog */}
      <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this as{' '}
              {resolveAction?.replace('_', ' ')}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolve} disabled={resolving}>
              {resolving ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
