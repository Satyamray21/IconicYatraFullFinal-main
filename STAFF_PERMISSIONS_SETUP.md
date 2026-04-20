# Staff Permissions Management - Setup Guide

## Navigation Methods

### **Method 1: Via Staff Management Page (Recommended)**

#### Step 1: Add Navigation Link in Staff List/Card
In your Staff list component, add a link to open the permission management:

```jsx
// In StaffCard.jsx or Staff list component
import { useNavigate } from "react-router-dom";

const StaffCard = ({ staff }) => {
  const navigate = useNavigate();

  const handleManagePermissions = () => {
    navigate(`/admin/staff/${staff._id}/permissions`, {
      state: { staffData: staff }
    });
  };

  return (
    <Card>
      {/* existing card content */}
      <Button 
        variant="contained" 
        color="success"
        onClick={handleManagePermissions}
      >
        Manage Permissions
      </Button>
    </Card>
  );
};
```

#### Step 2: Create a New Route for Staff Permissions
In your Routes configuration file:

```jsx
// Routes.jsx or routing config
import StaffPermissionPage from "../Pages/Admin/Staff/StaffPermissionPage";

export const routes = [
  // ... other routes
  {
    path: "/admin/staff/:staffId/permissions",
    element: <StaffPermissionPage />,
    name: "Staff Permissions"
  },
];
```

#### Step 3: Create StaffPermissionPage Component

Create file: `dashboard/src/Pages/Admin/Staff/StaffPermissionPage.jsx`

```jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Box, Container, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StaffAccessPermission from "../Profile/components/StaffAccessPermission";

const StaffPermissionPage = () => {
  const { staffId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const staffData = location.state?.staffData;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      {/* Staff Info Header */}
      {staffData && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            {staffData.personalDetails?.fullName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Staff ID: {staffData.staffId}
          </Typography>
        </Box>
      )}

      {/* Permissions Management */}
      <StaffAccessPermission 
        staffId={staffId} 
        staffData={staffData} 
      />
    </Container>
  );
};

export default StaffPermissionPage;
```

---

### **Method 2: Via Company Settings Profile**

The "Access & Permission" tab in Company Settings can be used when navigating from there:

#### In CompanyInfo.jsx (already updated):

```jsx
// When used with staffId prop
<CompanyProfile 
  staffId={staffId}           // Staff MongoDB ID
  staffData={staffData}       // Staff object
/>
```

#### Navigate to it from Staff Details:

```jsx
// In EditStaff.jsx or any staff detail page
const navigate = useNavigate();

const handleAccessPermissions = () => {
  navigate("/admin/profile", {
    state: { 
      staffId: staffId, 
      staffData: staff,
      activeTab: "Access & Permission"
    }
  });
};
```

---

### **Method 3: Direct URL Navigation**

Simply navigate to:
```
/admin/staff/{STAFF_MONGODB_ID}/permissions
```

Or add query parameter:
```
/admin/profile?staffId={STAFF_MONGODB_ID}&tab=Access%20&%20Permission
```

---

## **Complete Staff Edit Flow with Permissions**

Update `EditStaff.jsx` to include permission management:

```jsx
import StaffAccessPermission from "../../../Profile/components/StaffAccessPermission";
import { Tabs, Tab } from "@mui/material";

const EditStaff = () => {
  const { staffId } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  
  const [staffData, setStaffData] = useState(null);

  // ... existing code ...

  return (
    <Box p={3}>
      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
      >
        <Tab label="Staff Details" />
        <Tab label="Access & Permissions" />
      </Tabs>

      {/* Tab 1: Staff Details Form */}
      {activeTab === 0 && (
        <Box mt={3}>
          {/* Existing staff form JSX */}
        </Box>
      )}

      {/* Tab 2: Access & Permissions */}
      {activeTab === 1 && (
        <Box mt={3}>
          <StaffAccessPermission 
            staffId={staffId} 
            staffData={staffData}
          />
        </Box>
      )}
    </Box>
  );
};

export default EditStaff;
```

---

## **Quick Start - 3 Easy Steps**

### **Step 1: Create StaffPermissionPage.jsx**
Copy the code from Method 1, Step 3 above.

### **Step 2: Add Route**
Add this route to your Routes configuration:
```jsx
{
  path: "/admin/staff/:staffId/permissions",
  element: <StaffPermissionPage />
}
```

### **Step 3: Add Button in StaffCard**
Add "Manage Permissions" button in your staff list:
```jsx
<Button 
  onClick={() => navigate(`/admin/staff/${staff._id}/permissions`, 
    { state: { staffData: staff } })}
>
  Manage Permissions
</Button>
```

---

## **API Usage**

Once you set up the navigation, the component will automatically:

1. **Fetch permissions**: `GET /api/v1/staff-permission/:staffId`
2. **Generate credentials**: `POST /api/v1/staff-permission/:staffId/reset-password`
3. **Update permissions**: `PUT /api/v1/staff-permission/:staffId/permissions`
4. **View login history**: `GET /api/v1/staff-permission/:staffId/login-history`

---

## **Environment Variables**

Make sure your frontend has:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## **Features Available**

✅ Generate new credentials  
✅ View/edit permissions by module  
✅ Change/reset passwords  
✅ View complete login history  
✅ Track login attempts by location/IP  
✅ Activate/deactivate staff accounts  

---

## **Troubleshooting**

**Error: "staffId is not defined"**
- Make sure you're passing `staffId` as a prop
- Or use the Route method which extracts it from URL params

**Error: "Permission record not found"**
- Create permissions first: `POST /api/v1/staff-permission/:staffId/create-permission`
- This generates initial credentials and permissions

**Component not loading**
- Check that API_BASE URL is correct in the component
- Check browser console for API errors
