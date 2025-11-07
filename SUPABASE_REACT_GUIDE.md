# Supabase Database Access in React - Complete Guide

## Your Database is Already Connected! ✅

The Supabase client is configured at: `/src/integrations/supabase/client.ts`

---

## Basic Usage Pattern

```typescript
import { supabase } from "@/integrations/supabase/client";

// All database operations follow this pattern:
const { data, error } = await supabase
  .from('table_name')
  .operation()
  .filters();
```

---

## 1. Reading Data (SELECT)

### Get All Complaints
```typescript
import { supabase } from "@/integrations/supabase/client";

const fetchComplaints = async () => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Complaints:', data);
  return data;
};
```

### Get Complaints with Related Data (JOIN)
```typescript
const fetchComplaintsWithDepartments = async () => {
  const { data, error } = await supabase
    .from('complaints')
    .select(`
      *,
      departments (
        id,
        name,
        description
      ),
      profiles (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });
  
  return data;
};
```

### Get Single Complaint by ID
```typescript
const fetchComplaint = async (complaintId: string) => {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', complaintId)
    .single(); // Returns single object instead of array
  
  return data;
};
```

### Filter Complaints
```typescript
// By status
const { data } = await supabase
  .from('complaints')
  .select('*')
  .eq('status', 'pending');

// By severity
const { data } = await supabase
  .from('complaints')
  .select('*')
  .eq('severity', 'high');

// By current user
const { data: { user } } = await supabase.auth.getUser();
const { data } = await supabase
  .from('complaints')
  .select('*')
  .eq('citizen_id', user.id);

// Multiple filters
const { data } = await supabase
  .from('complaints')
  .select('*')
  .eq('status', 'pending')
  .eq('severity', 'critical')
  .order('created_at', { ascending: false });
```

---

## 2. Creating Data (INSERT)

### Create a New Complaint
```typescript
const createComplaint = async (complaintData: {
  description: string;
  location?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  department_id: string;
}) => {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      citizen_id: user.id,
      description: complaintData.description,
      location: complaintData.location || '',
      severity: complaintData.severity,
      department_id: complaintData.department_id,
      status: 'pending',
    })
    .select() // Return the created record
    .single();

  if (error) throw error;
  
  return data;
};
```

### Create Multiple Records
```typescript
const { data, error } = await supabase
  .from('status_history')
  .insert([
    { complaint_id: 'uuid-1', new_status: 'assigned' },
    { complaint_id: 'uuid-2', new_status: 'in_progress' },
  ])
  .select();
```

---

## 3. Updating Data (UPDATE)

### Update Complaint Status
```typescript
const updateComplaintStatus = async (
  complaintId: string, 
  newStatus: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'rejected'
) => {
  const { data, error } = await supabase
    .from('complaints')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', complaintId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Update User Profile
```typescript
const updateProfile = async (userId: string, updates: {
  full_name?: string;
  phone_number?: string;
  preferred_language?: string;
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  return data;
};
```

---

## 4. Deleting Data (DELETE)

### Delete a Complaint
```typescript
const deleteComplaint = async (complaintId: string) => {
  const { error } = await supabase
    .from('complaints')
    .delete()
    .eq('id', complaintId);

  if (error) throw error;
};
```

---

## 5. Real-Time Subscriptions

### Listen for New Complaints
```typescript
import { useEffect } from 'react';

const ComplaintsList = () => {
  useEffect(() => {
    // Subscribe to INSERT events
    const channel = supabase
      .channel('complaints-insert')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'complaints'
        },
        (payload) => {
          console.log('New complaint:', payload.new);
          // Update your UI here
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <div>Complaints List</div>;
};
```

### Listen for All Changes
```typescript
const channel = supabase
  .channel('complaints-all-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'complaints'
    },
    (payload) => {
      console.log('Change detected:', payload);
    }
  )
  .subscribe();
```

---

## 6. Authentication

### Get Current User
```typescript
const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) throw error;
  return user;
};
```

### Sign Up
```typescript
const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  if (error) throw error;
  return data;
};
```

### Sign In
```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};
```

### Sign Out
```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

---

## 7. Using in React Components with Hooks

### Custom Hook for Fetching Data
```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('complaints')
          .select(`
            *,
            departments (name, description)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setComplaints(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  return { complaints, loading, error };
};

// Usage in component:
const MyComponent = () => {
  const { complaints, loading, error } = useComplaints();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {complaints.map(complaint => (
        <div key={complaint.id}>{complaint.description}</div>
      ))}
    </div>
  );
};
```

### Using React Query (Already installed!)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fetch complaints
export const useComplaintsQuery = () => {
  return useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

// Create complaint mutation
export const useCreateComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newComplaint) => {
      const { data, error } = await supabase
        .from('complaints')
        .insert(newComplaint)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    },
  });
};

// Usage in component:
const ComplaintsPage = () => {
  const { data: complaints, isLoading } = useComplaintsQuery();
  const createMutation = useCreateComplaint();

  const handleCreate = () => {
    createMutation.mutate({
      description: 'New complaint',
      severity: 'medium',
      // ... other fields
    });
  };

  return <div>...</div>;
};
```

---

## 8. Common Queries for Your App

### Get All Departments
```typescript
const fetchDepartments = async () => {
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, description')
    .eq('is_active', true)
    .order('name');
  
  return data;
};
```

### Get User's Complaints
```typescript
const fetchMyComplaints = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('complaints')
    .select(`
      *,
      departments (name),
      status_history (
        old_status,
        new_status,
        created_at,
        notes
      )
    `)
    .eq('citizen_id', user.id)
    .order('created_at', { ascending: false });
  
  return data;
};
```

### Get Complaint Statistics
```typescript
const getComplaintStats = async () => {
  // Total complaints
  const { count: total } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true });

  // Pending complaints
  const { count: pending } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Resolved complaints
  const { count: resolved } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'resolved');

  return { total, pending, resolved };
};
```

### Check User Role
```typescript
const checkUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, department_id')
    .eq('user_id', user.id)
    .single();
  
  return data?.role; // 'citizen', 'admin', or 'superadmin'
};
```

---

## 9. Error Handling Best Practices

```typescript
const safeQuery = async () => {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*');

    if (error) {
      // Supabase error
      console.error('Database error:', error.message);
      throw error;
    }

    return data;
  } catch (err) {
    // Network or other errors
    console.error('Unexpected error:', err);
    throw err;
  }
};
```

---

## 10. TypeScript Types

Your types are auto-generated at: `/src/integrations/supabase/types.ts`

```typescript
import { Database } from '@/integrations/supabase/types';

type Complaint = Database['public']['Tables']['complaints']['Row'];
type ComplaintInsert = Database['public']['Tables']['complaints']['Insert'];
type ComplaintUpdate = Database['public']['Tables']['complaints']['Update'];

// Use in your functions
const createComplaint = async (
  complaint: ComplaintInsert
): Promise<Complaint> => {
  const { data, error } = await supabase
    .from('complaints')
    .insert(complaint)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

---

## Quick Reference: Your Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `departments` | Municipal departments | `id`, `name`, `description`, `is_active` |
| `user_roles` | User permissions | `user_id`, `role`, `department_id` |
| `profiles` | User profiles | `id`, `full_name`, `email`, `phone_number` |
| `complaints` | Main complaints | `id`, `citizen_id`, `department_id`, `status`, `severity`, `description` |
| `status_history` | Audit trail | `complaint_id`, `old_status`, `new_status`, `changed_by` |

---

## Example: Complete Component

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ComplaintsManager = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch complaints on mount
  useEffect(() => {
    fetchComplaints();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('complaints-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'complaints' },
        () => fetchComplaints() // Refetch on any change
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          departments (name),
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (complaintId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', complaintId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Status updated successfully',
      });

      fetchComplaints(); // Refresh list
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {complaints.map(complaint => (
        <div key={complaint.id}>
          <h3>{complaint.description}</h3>
          <p>Status: {complaint.status}</p>
          <button onClick={() => updateStatus(complaint.id, 'resolved')}>
            Mark Resolved
          </button>
        </div>
      ))}
    </div>
  );
};

export default ComplaintsManager;
```

---

## Testing Your Connection

Run this in any component to test:

```typescript
const testConnection = async () => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .limit(1);
  
  console.log('Connection test:', { data, error });
};
```

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs/reference/javascript
- **Your existing code**: Check `/src/components/ComplaintForm.tsx` for working examples
- **Database schema**: See `/supabase/migrations/20251106084933_368bfcd5-1790-4bae-9a5e-4cc8a6aca92e.sql`
