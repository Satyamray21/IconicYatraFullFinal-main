// sidebarData.js (or define inside Sidebar.js)
import DashboardIcon from '@mui/icons-material/Dashboard';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import HotelIcon from '@mui/icons-material/Hotel';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export const sidebarItems = [
    { label: 'Dashboard', route: '/', icon: <DashboardIcon /> },
    { label: 'Leads', route: '/lead', icon: <LeaderboardIcon /> },
    { label: 'Quotation', route: '/quotation', icon: <FormatQuoteIcon /> },
    { label: 'Hotel', route: '/hotel', icon: <HotelIcon /> },
    { label: 'Package', route: '/tourpackage', icon: <Inventory2Icon /> },
    { label: 'Payments', route: '/payments', icon: <PaymentsIcon /> },
    { label: 'Invoice', route: '/invoice', icon: <ReceiptIcon /> },
    { label: 'Associates', route: '/associates', icon: <PersonIcon /> },
    { label: 'Staff', route: '/staff', icon: <Diversity3Icon /> },

    { divider: true },

    { label: 'Setting', route: '/setting', icon: <SettingsIcon /> },
    { label: 'Profile', route: '/profile', icon: <AccountCircleIcon /> },

];
