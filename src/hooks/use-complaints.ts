/**
 * Custom hook for managing complaints
 * Provides easy access to complaint data with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Fetch all complaints (admin view)
export const useAllComplaints = () => {
  return useQuery({
    queryKey: ['complaints', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          departments (id, name, description),
          profiles!complaints_citizen_id_fkey (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch user's own complaints
export const useMyComplaints = () => {
  return useQuery({
    queryKey: ['complaints', 'my'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          departments (id, name, description)
        `)
        .eq('citizen_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Fetch single complaint with full details
export const useComplaint = (complaintId: string | undefined) => {
  return useQuery({
    queryKey: ['complaints', complaintId],
    queryFn: async () => {
      if (!complaintId) return null;

      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          departments (id, name, description, contact_email),
          profiles!complaints_citizen_id_fkey (full_name, email, phone_number),
          status_history (
            old_status,
            new_status,
            notes,
            created_at
          )
        `)
        .eq('id', complaintId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!complaintId,
  });
};

// Create complaint mutation
export const useCreateComplaint = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newComplaint: {
      description: string;
      location?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      department_id: string;
      summary?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('complaints')
        .insert({
          citizen_id: user.id,
          description: newComplaint.description,
          location: newComplaint.location || '',
          severity: newComplaint.severity,
          department_id: newComplaint.department_id,
          summary: newComplaint.summary || newComplaint.description.substring(0, 100),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast({
        title: 'Success',
        description: 'Complaint created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Update complaint status mutation
export const useUpdateComplaintStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      complaintId,
      newStatus,
    }: {
      complaintId: string;
      newStatus: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
    }) => {
      const { data, error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', complaintId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

// Get complaint statistics
export const useComplaintStats = () => {
  return useQuery({
    queryKey: ['complaints', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('status, severity');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: data?.filter((c) => c.status === 'pending').length || 0,
        assigned: data?.filter((c) => c.status === 'assigned').length || 0,
        in_progress: data?.filter((c) => c.status === 'in_progress').length || 0,
        resolved: data?.filter((c) => c.status === 'resolved').length || 0,
        rejected: data?.filter((c) => c.status === 'rejected').length || 0,
        critical: data?.filter((c) => c.severity === 'critical').length || 0,
        high: data?.filter((c) => c.severity === 'high').length || 0,
        medium: data?.filter((c) => c.severity === 'medium').length || 0,
        low: data?.filter((c) => c.severity === 'low').length || 0,
      };

      return stats;
    },
  });
};
