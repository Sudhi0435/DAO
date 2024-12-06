import { useState, useEffect } from "react";
import { Contract, BrowserProvider } from "ethers";
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import { TimeLock, GovToken } from "../contract-data/deployedAddresses.json";
import { abi as TimeLockAbi } from "../contract-data/TimeLock.json";
import { abi as TokenAbi } from "../contract-data/GovToken.json";

const DEFAULT_ADMIN = "0x2586BAa36EB44fEbc6aaD9a777cebCdFF5fBc726";

export default function AdminDashboard({ userAddress }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [openMintDialog, setOpenMintDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [mintAmount, setMintAmount] = useState("");
  const [selectedRole, setSelectedRole] = useState("PROPOSER_ROLE");
  const [roleAddress, setRoleAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const provider = new BrowserProvider(window.ethereum);

  useEffect(() => {
    if (userAddress) {
      checkAdminStatus();
    }
  }, [userAddress]);

  const checkAdminStatus = async () => {
    try {
      if (!window.ethereum) {
        setError("Please install MetaMask");
        return;
      }
  
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const timelockContract = new Contract(TimeLock, TimeLockAbi, signer);
      
      // Use bytes32(0) which is the default admin role in OpenZeppelin's AccessControl
      const adminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const isUserAdmin = await timelockContract.hasRole(adminRole, userAddress);
      
      // Set admin status if either condition is true
      setIsAdmin(isUserAdmin || userAddress.toLowerCase() === DEFAULT_ADMIN.toLowerCase());

      // If user is DEFAULT_ADMIN but doesn't have admin role, grant it
      if (userAddress.toLowerCase() === DEFAULT_ADMIN.toLowerCase() && !isUserAdmin) {
        try {
          const tx = await timelockContract.grantRole(adminRole, DEFAULT_ADMIN);
          await tx.wait();
          console.log("Admin role granted to default admin");
        } catch (error) {
          console.error("Error granting admin role:", error);
        }
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setError("Error checking admin status");
    }
  };

  const mintTokens = async () => {
    if (!isAdmin) {
      setError("Only admin can mint tokens");
      return;
    }
    try {
      const signer = await provider.getSigner();
      const tokenContract = new Contract(GovToken, TokenAbi, signer);
      const tx = await tokenContract.mint(userAddress, parseEther(mintAmount));
      await tx.wait();
      setSuccess("Tokens minted successfully!");
      setOpenMintDialog(false);
      setMintAmount("");
    } catch (error) {
      console.error("Error minting tokens:", error);
      setError("Error minting tokens: " + error.message);
    }
  };

  const grantRole = async () => {
    if (!isAdmin) {
      setError("Only admin can grant roles");
      return;
    }
    try {
      const signer = await provider.getSigner();
      const timelockContract = new Contract(TimeLock, TimeLockAbi, signer);
      const role = timelockContract[selectedRole];
      const tx = await timelockContract.grantRole(role, roleAddress);
      await tx.wait();
      setSuccess("Role granted successfully!");
      setOpenRoleDialog(false);
      setRoleAddress("");
    } catch (error) {
      console.error("Error granting role:", error);
      setError("Error granting role: " + error.message);
    }
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          You don't have admin access. Please connect with an admin account.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Token Management
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => setOpenMintDialog(true)}
                sx={{ mt: 2 }}
              >
                Mint Tokens
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Role Management
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => setOpenRoleDialog(true)}
                sx={{ mt: 2 }}
              >
                Grant Role
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Mint Dialog */}
      <Dialog open={openMintDialog} onClose={() => setOpenMintDialog(false)}>
        <DialogTitle>Mint Tokens</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMintDialog(false)}>Cancel</Button>
          <Button onClick={mintTokens}>Mint</Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={openRoleDialog} onClose={() => setOpenRoleDialog(false)}>
        <DialogTitle>Grant Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              label="Role"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <MenuItem value="PROPOSER_ROLE">Proposer</MenuItem>
              <MenuItem value="EXECUTOR_ROLE">Executor</MenuItem>
              <MenuItem value="TIMELOCK_ADMIN_ROLE">Admin</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Address"
            fullWidth
            value={roleAddress}
            onChange={(e) => setRoleAddress(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoleDialog(false)}>Cancel</Button>
          <Button onClick={grantRole}>Grant</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}