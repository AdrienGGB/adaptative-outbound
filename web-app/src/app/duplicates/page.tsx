'use client';

/**
 * Duplicates Management Page
 * F001: Data Quality & Import System
 *
 * Features:
 * - List all duplicate candidates
 * - Filter by entity type, status, similarity score
 * - Trigger duplicate detection scans
 * - View duplicate statistics
 * - Navigate to detail view for merging
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Search, PlayCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createClient } from '@/lib/supabase/client';
import type { DuplicateCandidate, DuplicateStats } from '@/types/duplicates';

export default function DuplicatesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [stats, setStats] = useState<DuplicateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(80);

  // Fetch workspace ID
  useEffect(() => {
    async function fetchWorkspace() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
        .single();

      if (membership) {
        setWorkspaceId(membership.workspace_id);
      }
    }

    fetchWorkspace();
  }, [supabase, router]);

  // Fetch duplicates and stats
  useEffect(() => {
    if (!workspaceId) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch duplicates
        const params = new URLSearchParams({
          workspace_id: workspaceId,
          status: statusFilter,
          limit: '50',
        });

        if (entityTypeFilter !== 'all') {
          params.append('entity_type', entityTypeFilter);
        }

        if (minScoreFilter > 0) {
          params.append('min_score', minScoreFilter.toString());
        }

        const duplicatesRes = await fetch(`/api/duplicates?${params}`);
        const duplicatesData = await duplicatesRes.json();

        if (!duplicatesRes.ok) {
          throw new Error(duplicatesData.error || 'Failed to fetch duplicates');
        }

        setDuplicates(duplicatesData.duplicates || []);

        // Fetch stats
        const statsParams = new URLSearchParams({ workspace_id: workspaceId });
        if (entityTypeFilter !== 'all') {
          statsParams.append('entity_type', entityTypeFilter);
        }

        const statsRes = await fetch(`/api/duplicates/stats?${statsParams}`);
        const statsData = await statsRes.json();

        if (statsRes.ok && statsData.stats) {
          setStats(statsData.stats);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load duplicates');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [workspaceId, entityTypeFilter, statusFilter, minScoreFilter]);

  const handleScanDuplicates = async () => {
    if (!workspaceId) return;

    setScanning(true);
    try {
      const res = await fetch('/api/duplicates/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          entity_type: entityTypeFilter !== 'all' ? entityTypeFilter : undefined,
          threshold: minScoreFilter,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to trigger duplicate scan');
      }

      alert(`Duplicate scan started! Job ID: ${data.job_id}`);

      // Refresh after a few seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start duplicate scan');
    } finally {
      setScanning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'default',
      merged: 'secondary',
      not_duplicate: 'outline',
      ignored: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getSimilarityBadge = (score: number) => {
    if (score >= 95) return <Badge className="bg-red-500">Very High ({score}%)</Badge>;
    if (score >= 85) return <Badge className="bg-orange-500">High ({score}%)</Badge>;
    return <Badge className="bg-yellow-500">Medium ({score}%)</Badge>;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Duplicate Management</h1>
          <p className="text-muted-foreground mt-2">
            Review and merge duplicate accounts and contacts
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Merged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.merged_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Not Duplicates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.not_duplicate_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Similarity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avg_similarity_score?.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter duplicate candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Entity Type</label>
                <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="account">Accounts</SelectItem>
                    <SelectItem value="contact">Contacts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="merged">Merged</SelectItem>
                    <SelectItem value="not_duplicate">Not Duplicate</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Min Score</label>
                <Select
                  value={minScoreFilter.toString()}
                  onValueChange={(v) => setMinScoreFilter(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="70">70%</SelectItem>
                    <SelectItem value="80">80%</SelectItem>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="95">95%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleScanDuplicates} disabled={scanning}>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {scanning ? 'Scanning...' : 'Scan for Duplicates'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Duplicates List */}
        <Card>
          <CardHeader>
            <CardTitle>Duplicate Candidates ({duplicates.length})</CardTitle>
            <CardDescription>
              Click on a duplicate to review and merge
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : duplicates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No duplicates found</p>
                <p className="text-sm mt-2">Try adjusting your filters or run a new scan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {duplicates.map((duplicate) => (
                  <div
                    key={duplicate.id}
                    onClick={() => router.push(`/duplicates/${duplicate.id}`)}
                    className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{duplicate.entity_type}</Badge>
                          {getStatusBadge(duplicate.status)}
                          {getSimilarityBadge(duplicate.similarity_score)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Matching fields: {duplicate.matching_fields.join(', ')}</p>
                          <p className="text-xs mt-1">
                            Detected: {new Date(duplicate.detected_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
