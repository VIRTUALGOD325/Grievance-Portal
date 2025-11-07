/**
 * Database Access Examples
 * 
 * This file contains practical examples of how to interact with your Supabase database.
 * Copy these patterns into your components as needed.
 */

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ============================================================
// 1. FETCH ALL COMPLAINTS
// ============================================================
export const fetchAllComplaints = async () => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching complaints:', error);
    return null;
  }

  return data;
};

// ============================================================
// 2. FETCH COMPLAINTS WITH DEPARTMENT INFO (JOIN)
// ============================================================
export const fetchComplaintsWithDepartments = async () => {
  const { data, error } = await supabase
    .from('complaints')
    .select(`
      *,
      departments (
        id,
        name,
        description,
        contact_email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return null;
  }

  return data;
};

// ============================================================
// 3. FETCH USER'S OWN COMPLAINTS
// ============================================================
export const fetchMyComplaints = async () => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('User not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('complaints')
    .select(`
      *,
      departments (name, description)
    `)
    .eq('citizen_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return null;
  }

  return data;
};

// ============================================================
// 4. CREATE A NEW COMPLAINT
// ============================================================
export const createComplaint = async (complaintData: {
  description: string;
  location?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  department_id: string;
  summary?: string;
}) => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      citizen_id: user.id,
      description: complaintData.description,
      location: complaintData.location || '',
      severity: complaintData.severity,
      department_id: complaintData.department_id,
      summary: complaintData.summary || complaintData.description.substring(0, 100),
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating complaint:', error);
    throw error;
  }

  return data;
};

// ============================================================
// 5. UPDATE COMPLAINT STATUS
// ============================================================
export const updateComplaintStatus = async (
  complaintId: string,
  newStatus: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'rejected'
) => {
  const { data, error } = await supabase
    .from('complaints')
    .update({ status: newStatus })
    .eq('id', complaintId)
    .select()
    .single();

  if (error) {
    console.error('Error updating status:', error);
    throw error;
  }

  return data;
};

// ============================================================
// 6. FETCH ALL DEPARTMENTS
// ============================================================
export const fetchDepartments = async () => {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, description, contact_email')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching departments:', error);
    return null;
  }

  return data;
};

// ============================================================
// 7. GET COMPLAINT STATISTICS
// ============================================================
export const getComplaintStats = async () => {
  // Total complaints
  const { count: total } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true });

  // By status
  const { count: pending } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: resolved } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'resolved');

  const { count: inProgress } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in_progress');

  return {
    total: total || 0,
    pending: pending || 0,
    resolved: resolved || 0,
    inProgress: inProgress || 0,
  };
};

// ============================================================
// 8. SEARCH COMPLAINTS BY KEYWORD
// ============================================================
export const searchComplaints = async (keyword: string) => {
  const { data, error } = await supabase
    .from('complaints')
    .select(`
      *,
      departments (name)
    `)
    .or(`description.ilike.%${keyword}%,location.ilike.%${keyword}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching:', error);
    return null;
  }

  return data;
};

// ============================================================
// 9. FILTER COMPLAINTS BY SEVERITY
// ============================================================
export const fetchComplaintsBySeverity = async (
  severity: 'low' | 'medium' | 'high' | 'critical'
) => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('severity', severity)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return null;
  }

  return data;
};

// ============================================================
// 10. GET USER PROFILE
// ============================================================
export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

// ============================================================
// 11. UPDATE USER PROFILE
// ============================================================
export const updateUserProfile = async (updates: {
  full_name?: string;
  phone_number?: string;
  preferred_language?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
};

// ============================================================
// 12. CHECK USER ROLE
// ============================================================
export const getUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role, department_id')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching role:', error);
    return null;
  }

  return data;
};

// ============================================================
// 13. GET COMPLAINT WITH FULL HISTORY
// ============================================================
export const getComplaintWithHistory = async (complaintId: string) => {
  const { data, error } = await supabase
    .from('complaints')
    .select(`
      *,
      departments (name, description),
      profiles!complaints_citizen_id_fkey (full_name, email),
      status_history (
        old_status,
        new_status,
        notes,
        created_at
      )
    `)
    .eq('id', complaintId)
    .single();

  if (error) {
    console.error('Error:', error);
    return null;
  }

  return data;
};

// ============================================================
// 14. EXAMPLE REACT COMPONENT USING THESE FUNCTIONS
// ============================================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export const ComplaintsListExample = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    const data = await fetchComplaintsWithDepartments();
    if (data) {
      setComplaints(data);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: any) => {
    try {
      await updateComplaintStatus(complaintId, newStatus);
      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });
      loadComplaints(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading complaints...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Complaints</h2>
      {complaints.map((complaint) => (
        <div key={complaint.id} className="border p-4 rounded-lg">
          <h3 className="font-semibold">{complaint.summary || 'No summary'}</h3>
          <p className="text-sm text-muted-foreground">{complaint.description}</p>
          <p className="text-sm">
            Department: {complaint.departments?.name || 'N/A'}
          </p>
          <p className="text-sm">Status: {complaint.status}</p>
          <p className="text-sm">Severity: {complaint.severity}</p>
          
          <div className="flex gap-2 mt-2">
            <Button 
              size="sm" 
              onClick={() => handleStatusUpdate(complaint.id, 'in_progress')}
            >
              Mark In Progress
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleStatusUpdate(complaint.id, 'resolved')}
            >
              Mark Resolved
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// 15. REAL-TIME SUBSCRIPTION EXAMPLE
// ============================================================

export const useComplaintsRealtime = () => {
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    // Initial fetch
    fetchAllComplaints().then(data => {
      if (data) setComplaints(data);
    });

    // Subscribe to changes
    const channel = supabase
      .channel('complaints-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'complaints'
        },
        (payload) => {
          console.log('Change received!', payload);
          
          // Refetch all complaints when any change occurs
          fetchAllComplaints().then(data => {
            if (data) setComplaints(data);
          });
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return complaints;
};
