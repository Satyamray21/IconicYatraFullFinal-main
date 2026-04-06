// import React from 'react';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Typography,
//   Box,
//   Pagination,
//   Select,
//   MenuItem,
//   FormControl,
//   Divider
// } from '@mui/material';

// const TransactionSummaryDialog = ({ open, onClose }) => {
//   // Sample data structure - in a real app, this would come from props or API
//   const tableHeaders = [
//     'Sr No.',
//     'Receipt',
//     'Invoice',
//     'Party Name',
//     'Transaction Remark',
//     'Transaction...',
//     'Dr/Cr',
//     'Amount'
//   ];

//   return (
//     <Dialog 
//       open={open} 
//       onClose={onClose}
//       maxWidth="lg"
//       fullWidth
//       PaperProps={{
//         sx: {
//           minHeight: '400px'
//         }
//       }}
//     >
//       <DialogTitle>
//         <Typography variant="h6" component="div" fontWeight="bold">
//           Transaction Summary
//         </Typography>
//       </DialogTitle>
      
//       <DialogContent>
//         {/* Table Container */}
//         <TableContainer 
//           component={Paper} 
//           variant="outlined"
//           sx={{ border: '1px solid #e0e0e0' }}
//         >
//           <Table sx={{ minWidth: 800 }} aria-label="transaction summary table">
//             <TableHead>
//               <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
//                 {tableHeaders.map((header, index) => (
//                   <TableCell 
//                     key={index}
//                     sx={{ 
//                       fontWeight: 'bold',
//                       borderRight: index < tableHeaders.length - 1 ? '1px solid #e0e0e0' : 'none'
//                     }}
//                   >
//                     {header}
//                   </TableCell>
//                 ))}
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {/* Empty state - No data row */}
//               <TableRow>
//                 <TableCell 
//                   colSpan={tableHeaders.length}
//                   align="center"
//                   sx={{ 
//                     height: 120,
//                     color: 'text.secondary',
//                     fontStyle: 'italic'
//                   }}
//                 >
//                   No data
//                 </TableCell>
//               </TableRow>
//             </TableBody>
//           </Table>
//         </TableContainer>

//         {/* Footer Section */}
//         <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           {/* Page Info */}
//           <Typography variant="body2" color="text.secondary">
//             Page 1 of 1 (0 items)
//           </Typography>

//           {/* Pagination and Items Per Page */}
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//             {/* Items per page selector */}
//             <FormControl size="small" variant="outlined">
//               <Select
//                 value={50}
//                 size="small"
//                 sx={{ minWidth: 80 }}
//                 disabled
//               >
//                 <MenuItem value={50}>50</MenuItem>
//                 <MenuItem value={100}>100</MenuItem>
//                 <MenuItem value={200}>200</MenuItem>
//               </Select>
//             </FormControl>

//             <Divider orientation="vertical" flexItem />

//             {/* Pagination */}
//             <Pagination 
//               count={1} 
//               page={1}
//               color="primary"
//               size="small"
//               disabled
//             />
//           </Box>
//         </Box>

//         {/* Items per page options displayed as in the image */}
//         <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
//           <Typography variant="body2" color="text.secondary">50</Typography>
//           <Typography variant="body2" color="text.secondary">100</Typography>
//           <Typography variant="body2" color="text.secondary">200</Typography>
//         </Box>
//       </DialogContent>
//     </Dialog>
//   );
// };

// // Usage example:
// // const App = () => {
// //   const [dialogOpen, setDialogOpen] = useState(false);
// //
// //   return (
// //     <div>
// //       <button onClick={() => setDialogOpen(true)}>Open Transaction Summary</button>
// //       <TransactionSummaryDialog 
// //         open={dialogOpen} 
// //         onClose={() => setDialogOpen(false)} 
// //       />
// //     </div>
// //   );
// // };

// export default TransactionSummaryDialog;