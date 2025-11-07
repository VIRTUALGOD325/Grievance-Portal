# Database Dashboard - Admin Only

## Overview

A comprehensive database management interface that allows administrators to directly view and manage all database tables with CRUD operations.

---

## Access

### **Admin Only** 🔒

- **URL**: `/admin/database`
- **Access Level**: Admin or Superadmin role required
- **Security**: Automatically redirects non-admin users to admin dashboard

### How to Access:

1. **Login as Admin** at `/admin/auth`
2. From **Admin Dashboard**, click the **"Database"** button in the header
3. Or navigate directly to `/admin/database`

---

## Features

### 📊 **Statistics Overview**
Real-time counts of all database records:
- Total Complaints
- Total Departments
- Total Users (Profiles)
- Total User Roles
- Status History Records

### 📑 **5 Tabbed Tables**

#### 1. **Complaints Table**
- View all complaints with full details
- See citizen info, department, status, severity
- **CRUD Operations**:
  - ✅ **Read**: View all complaints
  - ✏️ **Update**: Change status via dropdown (Pending → Assigned → In Progress → Resolved/Rejected)
  - 🗑️ **Delete**: Remove complaint records

#### 2. **Departments Table**
- View all municipal departments
- See contact info and status
- **CRUD Operations**:
  - ✅ **Read**: View all departments
  - ✏️ **Update**: Activate/Deactivate departments
  - 🗑️ **Delete**: Remove department records

#### 3. **Profiles Table**
- View all registered users
- See user details, email, phone, language preference
- **CRUD Operations**:
  - ✅ **Read**: View all user profiles
  - 🗑️ **Delete**: Remove user profiles

#### 4. **User Roles Table**
- View all role assignments
- See who has admin/citizen permissions
- **CRUD Operations**:
  - ✅ **Read**: View all roles
  - 🗑️ **Delete**: Remove role assignments

#### 5. **Status History Table**
- Audit trail of all status changes
- See old status → new status transitions
- Shows last 50 records
- **CRUD Operations**:
  - ✅ **Read**: View history
  - 🗑️ **Delete**: Remove history records

---

## Quick Actions

### Update Complaint Status
```
1. Go to "Complaints" tab
2. Find the complaint
3. Use the dropdown to select new status
4. Status updates automatically
```

### Activate/Deactivate Department
```
1. Go to "Departments" tab
2. Find the department
3. Click "Activate" or "Deactivate" button
4. Status toggles immediately
```

### Delete Records
```
1. Navigate to any tab
2. Find the record you want to delete
3. Click the trash icon (🗑️)
4. Confirm deletion
5. Record is permanently removed
```

### Refresh Data
```
Click "Refresh All" button in header to reload all tables
```

---

## Security Features

### ✅ **Admin-Only Access**
- Checks user role on page load
- Redirects non-admin users automatically
- Requires admin or superadmin role

### ✅ **Confirmation Dialogs**
- Delete operations require confirmation
- Prevents accidental data loss

### ✅ **Row Level Security (RLS)**
- All database operations respect Supabase RLS policies
- Admin role verified at database level

---

## Technical Details

### File Location
```
/src/pages/DatabaseDashboard.tsx
```

### Route
```typescript
<Route path="/admin/database" element={<DatabaseDashboard />} />
```

### Dependencies
- Supabase client for database operations
- shadcn/ui components for UI
- React hooks for state management

### Database Tables Accessed
1. `complaints` - Main grievance records
2. `departments` - Municipal departments
3. `profiles` - User profile information
4. `user_roles` - Role assignments
5. `status_history` - Audit trail

---

## Usage Examples

### Example 1: Update Multiple Complaint Statuses
```
1. Navigate to /admin/database
2. Click "Complaints" tab
3. For each pending complaint:
   - Select "Assigned" from dropdown
   - Status updates immediately
4. Complaints are now assigned
```

### Example 2: Deactivate a Department
```
1. Navigate to /admin/database
2. Click "Departments" tab
3. Find "Electricity" department
4. Click "Deactivate" button
5. Department is now inactive (won't show in complaint forms)
```

### Example 3: View User Activity
```
1. Navigate to /admin/database
2. Click "Status History" tab
3. See all recent status changes
4. Track who changed what and when
```

### Example 4: Clean Up Test Data
```
1. Navigate to /admin/database
2. Go to "Complaints" tab
3. Find test complaints
4. Click trash icon for each
5. Confirm deletion
6. Test data removed
```

---

## Best Practices

### ⚠️ **Use with Caution**
- This is direct database access
- Deletions are permanent
- No undo functionality
- Always confirm before deleting

### 📝 **Recommended Workflow**
1. **View** data first to understand current state
2. **Update** statuses to manage workflow
3. **Delete** only when absolutely necessary
4. **Refresh** after bulk operations

### 🔄 **Regular Maintenance**
- Review status history periodically
- Deactivate unused departments
- Clean up rejected/resolved complaints (if needed)
- Monitor user roles for security

---

## Troubleshooting

### "Access Denied" Error
**Problem**: Not logged in as admin  
**Solution**: Login with admin credentials at `/admin/auth`

### Can't Delete Record
**Problem**: Record has dependencies  
**Solution**: Delete dependent records first (e.g., delete complaints before deleting department)

### Changes Not Showing
**Problem**: Data not refreshed  
**Solution**: Click "Refresh All" button in header

### Page Redirects to Admin Dashboard
**Problem**: User doesn't have admin role  
**Solution**: Contact superadmin to grant admin role

---

## Future Enhancements (Potential)

- [ ] Add Create functionality for new records
- [ ] Add Edit dialogs for detailed updates
- [ ] Export data to CSV/Excel
- [ ] Advanced filtering and search
- [ ] Bulk operations (delete multiple, update multiple)
- [ ] Undo/Redo functionality
- [ ] Activity logs for admin actions
- [ ] Data validation before updates

---

## Related Files

- **Main Component**: `/src/pages/DatabaseDashboard.tsx`
- **Route Config**: `/src/App.tsx`
- **Admin Dashboard**: `/src/pages/AdminDashboard.tsx` (has Database button)
- **Database Utils**: `/src/lib/database.ts`
- **Hooks**: `/src/hooks/use-complaints.ts`, etc.

---

## Summary

The Database Dashboard provides **admin-only direct access** to all database tables with essential CRUD operations. It's designed for:

✅ Quick status updates  
✅ Department management  
✅ User oversight  
✅ Data cleanup  
✅ Audit trail review  

**Access it from the Admin Dashboard by clicking the "Database" button in the header.**

🔒 **Remember**: This is a powerful tool - use responsibly!
