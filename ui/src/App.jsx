import { useState, useEffect } from 'react';
import * as React from "react";
import { id, Interface, Contract, BrowserProvider, parseEther } from "ethers";
import { CertAddr, MyGovernor, GovToken, TimeLock, DEFAULT_ADMIN } from "./contract-data/deployedAddresses.json";
import { abi as Govabi } from "./contract-data/MyGovernor.json";
import { abi as TokenAbi } from "./contract-data/GovToken.json";
import { abi as TimeLockAbi } from "./contract-data/TimeLock.json";
import { abi as Certabi } from "./contract-data/Cert.json";
import './styles/global.css';
import AdminDashboard from './component/AdminDashboard';

import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Container,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Divider,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import MenuIcon from "@mui/icons-material/Menu";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import QueueIcon from '@mui/icons-material/Queue';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import TokenIcon from '@mui/icons-material/Token';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SecurityIcon from '@mui/icons-material/Security';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

function App() {
  const theme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#90caf9',
      },
      secondary: {
        main: '#ce93d8',
      },
      background: {
        default: '#000000',
        paper: '#121212',
      },
      text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            boxShadow: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#121212',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          },
        },
      },
    },
  });

  const [loginState, setLoginState] = useState("Connect");
  const [proposals, setProposals] = useState([]);
  const [pDescription, setPDescription] = useState("");
  const [open, setOpen] = React.useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [votingPower, setVotingPower] = useState("0");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mintAmount, setMintAmount] = useState("");
  const [selectedRole, setSelectedRole] = useState("PROPOSER_ROLE");
  const [roleAddress, setRoleAddress] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [openMintDialog, setOpenMintDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState("issue");
  const [functionDetails, setFunctionDetails] = useState("");
  const [contractAddress, setContractAddress] = useState(CertAddr);
  const [proposalFilter, setProposalFilter] = useState("all");
  const [proposalHistory, setProposalHistory] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  const [openCertificatesDialog, setOpenCertificatesDialog] = useState(false);
  const [totalSupply, setTotalSupply] = useState("0");
  const [currentView, setCurrentView] = useState('main');
  const [provider, setProvider] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  const [contracts, setContracts] = useState(null);

  // Initialize provider and check network
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        try {
          const provider = new BrowserProvider(window.ethereum);
          
          // Check network
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);
          
          // Assuming you're using Sepolia testnet (chainId: 11155111)
          // Change this value if you're using a different network
          const expectedChainId = 11155111;
          
          if (chainId !== expectedChainId) {
            setNetworkError(true);
            console.error(`Please connect to the correct network. Expected chainId: ${expectedChainId}, got: ${chainId}`);
            return;
          }

          await provider.send("eth_requestAccounts", []);
          setProvider(provider);

          // Initialize contracts
          const signer = await provider.getSigner();
          const tokenContract = new Contract(GovToken, TokenAbi, signer);
          const governorContract = new Contract(MyGovernor, Govabi, signer);
          const timelockContract = new Contract(TimeLock, TimeLockAbi, signer);
          const certContract = new Contract(CertAddr, Certabi, signer);

          // Verify contracts are deployed
          const [tokenCode, governorCode, timelockCode, certCode] = await Promise.all([
            provider.getCode(GovToken),
            provider.getCode(MyGovernor),
            provider.getCode(TimeLock),
            provider.getCode(CertAddr)
          ]);

          if (tokenCode === "0x" || governorCode === "0x" || timelockCode === "0x" || certCode === "0x") {
            console.error("One or more contracts are not deployed at the specified addresses");
            return;
          }

          setContracts({
            token: tokenContract,
            governor: governorContract,
            timelock: timelockContract,
            cert: certContract
          });

        } catch (error) {
          console.error("Failed to initialize provider:", error);
        }
      } else {
        console.error("Please install MetaMask!");
      }
    };
    initProvider();
  }, []);

  // Listen for network changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  // Update user info only when provider, contracts and userAddress are available
  useEffect(() => {
    if (provider && contracts && userAddress) {
      updateUserInfo();
      getProposals();
      getCertificates();
      getTotalSupply();
    }
  }, [provider, contracts, userAddress]);

  const updateUserInfo = async () => {
    if (!provider || !contracts || !userAddress) {
      console.error("Provider, contracts, or user address not initialized");
      return;
    }

    try {
      const balance = await contracts.token.balanceOf(userAddress);
      const votes = await contracts.token.getVotes(userAddress);
      const adminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const isUserAdmin = await contracts.timelock.hasRole(adminRole, userAddress);
      
      setTokenBalance(balance.toString());
      setVotingPower(votes.toString());
      setIsAdmin(isUserAdmin || userAddress.toLowerCase() === DEFAULT_ADMIN.toLowerCase());

      if (userAddress.toLowerCase() === DEFAULT_ADMIN.toLowerCase() && !isUserAdmin) {
        try {
          const tx = await contracts.timelock.grantRole(adminRole, DEFAULT_ADMIN);
          await tx.wait();
          console.log("Admin role granted to default admin");
        } catch (error) {
          console.error("Error granting admin role:", error.message);
        }
      }
    } catch (error) {
      console.error("Error updating user info:", error.message);
    }
  };

  const getTotalSupply = async () => {
    if (!provider || !contracts) {
      console.error("Provider or contracts not initialized");
      return;
    }

    try {
      const supply = await contracts.token.totalSupply();
      setTotalSupply(supply.toString());
    } catch (error) {
      console.error("Error getting total supply:", error.message);
    }
  };

  const mintTokens = async () => {
    try {
      const signer = await provider.getSigner();
      const tokenContract = new Contract(GovToken, TokenAbi, signer);
      const tx = await tokenContract.mint(userAddress, parseEther(mintAmount));
      await tx.wait();
      updateUserInfo();
      setOpenMintDialog(false);
    } catch (error) {
      console.error("Error minting tokens:", error);
    }
  };

  const delegateTokens = async () => {
    try {
      const signer = await provider.getSigner();
      const tokenContract = new Contract(GovToken, TokenAbi, signer);
      const tx = await tokenContract.delegate(userAddress);
      await tx.wait();
      updateUserInfo();
    } catch (error) {
      console.error("Error delegating tokens:", error);
    }
  };

  const grantRole = async () => {
    try {
      const signer = await provider.getSigner();
      const timelockContract = new Contract(TimeLock, TimeLockAbi, signer);
      const role = await timelockContract[selectedRole]();
      const tx = await timelockContract.grantRole(role, roleAddress);
      await tx.wait();
      setOpenRoleDialog(false);
    } catch (error) {
      console.error("Error granting role:", error);
    }
  };

  const getProposalState = async (proposalId) => {
    try {
      const signer = await provider.getSigner();
      const govContract = new Contract(MyGovernor, Govabi, signer);
      const state = await govContract.state(proposalId);
      const states = ["Pending", "Active", "Canceled", "Defeated", "Succeeded", "Queued", "Expired", "Executed"];
      return states[state];
    } catch (error) {
      console.error("Error getting proposal state:", error);
      return "Unknown";
    }
  };

  const castVote = async (proposalId, support) => {
    try {
      const signer = await provider.getSigner();
      const govContract = new Contract(MyGovernor, Govabi, signer);
      const tx = await govContract.castVote(proposalId, support);
      await tx.wait();
      getProposals();
    } catch (error) {
      console.error("Error casting vote:", error);
    }
  };

  const queueProposal = async (proposalId) => {
    try {
      const signer = await provider.getSigner();
      const govContract = new Contract(MyGovernor, Govabi, signer);
      const tx = await govContract.queue(proposalId);
      await tx.wait();
      getProposals();
    } catch (error) {
      console.error("Error queueing proposal:", error);
    }
  };

  const executeProposal = async (proposalId) => {
    try {
      const signer = await provider.getSigner();
      const govContract = new Contract(MyGovernor, Govabi, signer);
      const tx = await govContract.execute(proposalId);
      await tx.wait();
      getProposals();
    } catch (error) {
      console.error("Error executing proposal:", error);
    }
  };

  const getCertificates = async () => {
    try {
      const signer = await provider.getSigner();
      const certContract = new Contract(CertAddr, Certabi, signer);
      const filter = certContract.filters.issued();
      const events = await certContract.queryFilter(filter);
      
      // Get certificate details for each event
      const certs = await Promise.all(events.map(async (event) => {
        const cert = await certContract.Certificates(event.args[0]);
        return {
          id: event.args[0].toString(),
          name: cert.name,
          course: cert.course,
          grade: cert.grade,
          date: cert.date
        };
      }));
      
      setCertificates(certs);
    } catch (error) {
      console.error("Error getting certificates:", error);
    }
  };

  const getProposalHistory = async (proposalId) => {
    try {
      const signer = await provider.getSigner();
      const govContract = new Contract(MyGovernor, Govabi, signer);
      
      // Get voting results
      const proposalVotes = await govContract.proposalVotes(proposalId);
      const forVotes = proposalVotes[1].toString();
      const againstVotes = proposalVotes[0].toString();
      const abstainVotes = proposalVotes[2].toString();
      
      // Get proposal deadline
      const deadline = await govContract.proposalDeadline(proposalId);
      const deadlineDate = new Date(deadline.toString() * 1000).toLocaleDateString();
      
      return {
        forVotes,
        againstVotes,
        abstainVotes,
        deadline: deadlineDate
      };
    } catch (error) {
      console.error("Error getting proposal history:", error);
      return null;
    }
  };

  const getProposals = async () => {
    try {
      const signer = await provider.getSigner();
      const govContract = new Contract(MyGovernor, Govabi, signer);
      const filter = govContract.filters.ProposalCreated();
      const events = await govContract.queryFilter(filter);
      
      const proposalPromises = events.map(async (event) => {
        const state = await getProposalState(event.args[0].toString());
        const history = await getProposalHistory(event.args[0].toString());
        const createdAt = new Date(event.args[7].toString() * 1000).toLocaleDateString();
        
        return {
          id: event.args[0].toString(),
          description: event.args[8],
          state,
          createdAt,
          ...history
        };
      });

      const resolvedProposals = await Promise.all(proposalPromises);
      setProposals(resolvedProposals);
    } catch (error) {
      console.error("Error getting proposals:", error);
    }
  };

  const handleSubmit = async (event) => {
    try {
      const signer = await provider.getSigner();
      const Govinstance = new Contract(MyGovernor, Govabi, signer);
      const Certinstance = new Contract(CertAddr, Certabi, signer);

      const paramsArray = [104, "An", "EDP", "A", "25th June"];

      const transferCalldata = Certinstance.interface.encodeFunctionData(
        selectedFunction,
        paramsArray
      );

      const proposeTx = await Govinstance.propose(
        [contractAddress],
        [0],
        [transferCalldata],
        pDescription
      );
      await proposeTx.wait();
      
      // Close the dialog
      handleClose();
      
      // Set filter to pending
      setProposalFilter("pending");
      
      // Refresh the proposals list
      await getProposals();
      
      // Show success message
      setSnackbar({
        open: true,
        message: "Proposal submitted successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error proposing transaction:", error);
      // Show error message
      setSnackbar({
        open: true,
        message: "Error submitting proposal: " + error.message,
        severity: "error"
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  async function connectMetaMask() {
    try {
      if (!window.ethereum) {
        setLoginState("No MetaMask");
        return;
      }
  
      if (!provider) {
        setProvider(new BrowserProvider(window.ethereum));
      }
  
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
      setLoginState("Connected");
      
      // Update user info after connection
      await updateUserInfo();
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      setLoginState("Error");
    }
  }

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handlePDesChange = (event) => {
    setPDescription(event.target.value);
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="app-container" style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)', 
          mb: 4,
          background: 'linear-gradient(180deg, rgba(26,26,26,1) 0%, rgba(0,0,0,1) 100%)'
        }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ height: '90px' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
                <AccountBalanceIcon sx={{ 
                  fontSize: 40, 
                  color: '#90caf9',
                  mr: 1
                }} />
                <Typography 
                  variant="h4" 
                  component="div" 
                  sx={{ 
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #90caf9 30%, #ce93d8 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '1px'
                  }}
                >
                  DAO Governance
                </Typography>
              </Stack>
              <Stack direction="row" spacing={3} alignItems="center">
                {userAddress && (
                  <>
                    <Box sx={{ 
                      px: 3, 
                      py: 1.5, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      gap: 3
                    }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Balance
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#90caf9', fontWeight: 500 }}>
                          {tokenBalance} Tokens
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Voting Power
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#ce93d8', fontWeight: 500 }}>
                          {votingPower}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Button 
                      variant="outlined" 
                      onClick={() => setCurrentView('admin')}
                      startIcon={<SecurityIcon />}
                      sx={{ 
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          borderColor: '#90caf9',
                          backgroundColor: 'rgba(144, 202, 249, 0.08)'
                        }
                      }}
                    >
                      Admin Dashboard
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      onClick={() => setOpenCertificatesDialog(true)}
                      startIcon={<VerifiedUserIcon />}
                      sx={{ 
                        px: 3,
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          borderColor: '#90caf9',
                          backgroundColor: 'rgba(144, 202, 249, 0.08)'
                        }
                      }}
                    >
                      Certificates
                    </Button>
                  </>
                )}
                <Button
                  variant="contained"
                  startIcon={<AccountBalanceWalletIcon />}
                  onClick={connectMetaMask}
                  size="large"
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #90caf9 30%, #ce93d8 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #82b1f5 30%, #ba68c8 90%)',
                    },
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                >
                  {loginState}
                </Button>
              </Stack>
            </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 8 }}>
          {!userAddress ? (
            <Box sx={{ 
              py: 8,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6
            }}>
              <Box sx={{ maxWidth: '800px', mb: 6 }}>
                <Typography variant="h2" component="h1" sx={{ 
                  fontWeight: 700,
                  mb: 3,
                  background: 'linear-gradient(45deg, #90caf9 30%, #ce93d8 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Welcome to DAO Governance
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
                  Participate in decentralized decision-making and shape the future of our organization
                </Typography>
              </Box>

              <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ 
                    p: 4, 
                    height: '100%',
                    background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}>
                    <Box sx={{ mb: 3 }}>
                      <HowToVoteIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Create Proposals
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Submit new proposals and participate in the governance of the organization
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ 
                    p: 4, 
                    height: '100%',
                    background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}>
                    <Box sx={{ mb: 3 }}>
                      <TokenIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Vote with Tokens
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Use your governance tokens to vote on active proposals and make your voice heard
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ 
                    p: 4, 
                    height: '100%',
                    background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}>
                    <Box sx={{ mb: 3 }}>
                      <VerifiedUserIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Manage Certificates
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Issue and verify certificates securely on the blockchain
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                size="large"
                startIcon={<AccountBalanceWalletIcon />}
                onClick={connectMetaMask}
                sx={{ 
                  py: 2,
                  px: 6,
                  fontSize: '1.2rem',
                  borderRadius: 3,
                  background: 'linear-gradient(45deg, #90caf9 30%, #ce93d8 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #82b1f5 30%, #ba68c8 90%)',
                  }
                }}
              >
                Connect Wallet to Start
              </Button>
            </Box>
          ) : (
            <>
              {/* Admin Panel */}
              {isAdmin && (
                <Paper sx={{ 
                  p: 4, 
                  mb: 4, 
                  background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 2
                }}>
                  <Typography variant="h5" sx={{ 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: '#90caf9'
                  }}>
                    <SecurityIcon /> Admin Dashboard
                  </Typography>

                  <Grid container spacing={4}>
                    {/* Token Management */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ 
                        p: 3, 
                        height: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Token Management</Typography>
                        <Stack spacing={2}>
                          <Button
                            variant="contained"
                            onClick={() => setOpenMintDialog(true)}
                            startIcon={<AddCircleOutlineIcon />}
                            fullWidth
                            sx={{
                              py: 1.5,
                              background: 'linear-gradient(45deg, #90caf9 30%, #ce93d8 90%)',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #82b1f5 30%, #ba68c8 90%)',
                              }
                            }}
                          >
                            Mint New Tokens
                          </Button>
                          <Typography variant="body2" color="text.secondary">
                            Total Supply: {totalSupply || '0'} Tokens
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Role Management */}
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ 
                        p: 3, 
                        height: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Role Management</Typography>
                        <Stack spacing={2}>
                          <Button
                            variant="contained"
                            onClick={() => setOpenRoleDialog(true)}
                            startIcon={<PersonAddIcon />}
                            fullWidth
                            sx={{
                              py: 1.5,
                              background: 'linear-gradient(45deg, #90caf9 30%, #ce93d8 90%)',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #82b1f5 30%, #ba68c8 90%)',
                              }
                            }}
                          >
                            Grant Role
                          </Button>
                          <Typography variant="body2" color="text.secondary">
                            Manage Proposer, Executor, and Admin roles
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>

                    {/* Governance Stats */}
                    <Grid item xs={12}>
                      <Paper sx={{ 
                        p: 3,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" sx={{ mb: 3 }}>Governance Statistics</Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" sx={{ color: '#90caf9', mb: 1 }}>
                                {proposals.length}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Total Proposals
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" sx={{ color: '#ce93d8', mb: 1 }}>
                                {proposals.filter(p => p.state === 'Active').length}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Active Proposals
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" sx={{ color: '#4caf50', mb: 1 }}>
                                {proposals.filter(p => p.state === 'Succeeded').length}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Succeeded Proposals
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {/* Rest of the existing code... */}
              {isAdmin && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h5" sx={{ mb: 2 }}>Admin Actions</Typography>
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" onClick={() => setOpenMintDialog(true)}>
                      Mint Tokens
                    </Button>
                    <Button variant="outlined" onClick={() => setOpenRoleDialog(true)}>
                      Grant Role
                    </Button>
                  </Stack>
                </Box>
              )}
              <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h4" component="h1">
                    Proposals
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <FormControl sx={{ minWidth: 120 }}>
                      <InputLabel>Filter</InputLabel>
                      <Select
                        value={proposalFilter}
                        onChange={(e) => setProposalFilter(e.target.value)}
                        label="Filter"
                        size="small"
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="succeeded">Succeeded</MenuItem>
                        <MenuItem value="executed">Executed</MenuItem>
                        <MenuItem value="defeated">Defeated</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={handleClickOpen}
                      size="large"
                    >
                      New Proposal
                    </Button>
                  </Stack>
                </Stack>

                <Grid container spacing={3}>
                  {proposals
                    .filter(proposal => proposalFilter === "all" || proposal.state.toLowerCase() === proposalFilter.toLowerCase())
                    .map((proposal) => (
                      <Grid item xs={12} key={proposal.id}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Proposal #{proposal.id}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                              {proposal.description}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Status: <Chip label={proposal.state} color={
                                  proposal.state === 'Succeeded' ? 'success' :
                                  proposal.state === 'Defeated' ? 'error' :
                                  proposal.state === 'Active' ? 'primary' :
                                  'default'
                                } />
                              </Typography>
                              <Typography variant="subtitle2" gutterBottom>
                                Created: {proposal.createdAt}
                              </Typography>
                              {proposal.deadline && (
                                <Typography variant="subtitle2" gutterBottom>
                                  Deadline: {proposal.deadline}
                                </Typography>
                              )}
                              {proposal.forVotes && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="subtitle2">Votes:</Typography>
                                  <Typography variant="body2">For: {proposal.forVotes}</Typography>
                                  <Typography variant="body2">Against: {proposal.againstVotes}</Typography>
                                  <Typography variant="body2">Abstain: {proposal.abstainVotes}</Typography>
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                              {proposal.state === 'Active' && (
                                <>
                                  <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => castVote(proposal.id, 1)}
                                    startIcon={<ThumbUpIcon />}
                                  >
                                    Vote For
                                  </Button>
                                  <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => castVote(proposal.id, 0)}
                                    startIcon={<ThumbDownIcon />}
                                  >
                                    Vote Against
                                  </Button>
                                </>
                              )}
                              {proposal.state === 'Succeeded' && (
                                <Button
                                  variant="contained"
                                  onClick={() => queueProposal(proposal.id)}
                                  startIcon={<QueueIcon />}
                                >
                                  Queue
                                </Button>
                              )}
                              {proposal.state === 'Queued' && (
                                <Button
                                  variant="contained"
                                  onClick={() => executeProposal(proposal.id)}
                                  startIcon={<PlayArrowIcon />}
                                >
                                  Execute
                                </Button>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
              </Box>

              <Dialog 
                open={openCertificatesDialog} 
                onClose={() => setOpenCertificatesDialog(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                  sx: {
                    bgcolor: '#1a1a1a',
                    backgroundImage: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <DialogTitle>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <VerifiedUserIcon sx={{ color: '#90caf9' }} />
                    <Typography component="div">Issued Certificates</Typography>
                  </Stack>
                </DialogTitle>
                <DialogContent>
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    {certificates.map((cert, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper sx={{ 
                          p: 3,
                          background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 2
                        }}>
                          <Typography variant="h6" sx={{ mb: 1 }}>
                            {cert.name}
                          </Typography>
                          <Divider sx={{ my: 2 }} />
                          <Stack spacing={1}>
                            <Typography variant="body2" color="text.secondary">
                              ID: {cert.id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Course: {cert.course}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Grade: {cert.grade}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Date: {cert.date}
                            </Typography>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </DialogContent>
              </Dialog>

              {/* Mint Tokens Dialog */}
              <Dialog 
                open={openMintDialog} 
                onClose={() => setOpenMintDialog(false)}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>
                  <Typography component="div">Mint DAO Tokens</Typography>
                </DialogTitle>
                <DialogContent>
                  <TextField
                    autoFocus
                    margin="dense"
                    label="Amount"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    sx={{ mt: 2 }}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenMintDialog(false)}>Cancel</Button>
                  <Button onClick={mintTokens} variant="contained">Mint</Button>
                </DialogActions>
              </Dialog>

              {/* Grant Role Dialog */}
              <Dialog 
                open={openRoleDialog} 
                onClose={() => setOpenRoleDialog(false)}
                maxWidth="sm"
                fullWidth
              >
                <DialogTitle>
                  <Typography component="div">Grant Role</Typography>
                </DialogTitle>
                <DialogContent>
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      label="Role"
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
                    variant="outlined"
                    value={roleAddress}
                    onChange={(e) => setRoleAddress(e.target.value)}
                    sx={{ mt: 2 }}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenRoleDialog(false)}>Cancel</Button>
                  <Button onClick={grantRole} variant="contained">Grant</Button>
                </DialogActions>
              </Dialog>

              <Dialog 
                open={open} 
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                  sx: { borderRadius: 2 }
                }}
              >
                <DialogTitle sx={{ pb: 1 }}>
                  <Typography component="div">Create New Proposal</Typography>
                </DialogTitle>
                <DialogContent>
                  <DialogContentText sx={{ mb: 3, color: 'text.secondary' }}>
                    Please fill in the details for your new proposal.
                  </DialogContentText>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Function to Execute"
                        value={selectedFunction}
                        onChange={(e) => setSelectedFunction(e.target.value)}
                        variant="outlined"
                      >
                        <MenuItem value="issue">Issue Certificate</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Details of the Function to Execute"
                        value={functionDetails}
                        onChange={(e) => setFunctionDetails(e.target.value)}
                        variant="outlined"
                        placeholder="Enter the function parameters and any additional details"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address of the Contract"
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                        variant="outlined"
                        placeholder="Enter the contract address"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        multiline
                        rows={3}
                        label="Proposal Description"
                        fullWidth
                        variant="outlined"
                        value={pDescription}
                        onChange={(e) => setPDescription(e.target.value)}
                        helperText="Provide a clear description of the proposal"
                        placeholder="Enter a description for your proposal"
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                  <Button onClick={handleClose} color="inherit">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    variant="contained"
                    disabled={!pDescription || !functionDetails || !contractAddress}
                  >
                    Submit Proposal
                  </Button>
                </DialogActions>
              </Dialog>

              <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                  {snackbar.message}
                </Alert>
              </Snackbar>
            </>
          )}
        </Container>
        {currentView === 'main' ? (
          <Container maxWidth="lg">
            {/* Existing Proposals Grid */}
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" gutterBottom>
                    Proposals
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleClickOpen}
                      startIcon={<AddCircleOutlineIcon />}
                    >
                      New Proposal
                    </Button>
                    {tokenBalance !== "0" && votingPower === "0" && (
                      <Button
                        variant="outlined"
                        onClick={delegateTokens}
                        startIcon={<HowToVoteIcon />}
                      >
                        Delegate Tokens
                      </Button>
                    )}
                  </Stack>
                  
                  {/* Filter Controls */}
                  <FormControl sx={{ minWidth: 200, mb: 3 }}>
                    <InputLabel>Filter Proposals</InputLabel>
                    <Select
                      value={proposalFilter}
                      label="Filter Proposals"
                      onChange={(e) => setProposalFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Proposals</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="succeeded">Succeeded</MenuItem>
                      <MenuItem value="defeated">Defeated</MenuItem>
                      <MenuItem value="queued">Queued</MenuItem>
                      <MenuItem value="executed">Executed</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
              
              {/* Proposals List */}
              {proposals
                .filter(proposal => proposalFilter === 'all' || proposal.state.toLowerCase() === proposalFilter.toLowerCase())
                .map((proposal) => (
                  <Grid item xs={12} key={proposal.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Proposal #{proposal.id}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          {proposal.description}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Status: <Chip label={proposal.state} color={
                              proposal.state === 'Succeeded' ? 'success' :
                              proposal.state === 'Defeated' ? 'error' :
                              proposal.state === 'Active' ? 'primary' :
                              'default'
                            } />
                          </Typography>
                          <Typography variant="subtitle2" gutterBottom>
                            Created: {proposal.createdAt}
                          </Typography>
                          {proposal.deadline && (
                            <Typography variant="subtitle2" gutterBottom>
                              Deadline: {proposal.deadline}
                            </Typography>
                          )}
                          {proposal.forVotes && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="subtitle2">Votes:</Typography>
                              <Typography variant="body2">For: {proposal.forVotes}</Typography>
                              <Typography variant="body2">Against: {proposal.againstVotes}</Typography>
                              <Typography variant="body2">Abstain: {proposal.abstainVotes}</Typography>
                            </Box>
                          )}
                        </Box>
                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          {proposal.state === 'Active' && (
                            <>
                              <Button
                                variant="contained"
                                color="success"
                                onClick={() => castVote(proposal.id, 1)}
                                startIcon={<ThumbUpIcon />}
                              >
                                Vote For
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                onClick={() => castVote(proposal.id, 0)}
                                startIcon={<ThumbDownIcon />}
                              >
                                Vote Against
                              </Button>
                            </>
                          )}
                          {proposal.state === 'Succeeded' && (
                            <Button
                              variant="contained"
                              onClick={() => queueProposal(proposal.id)}
                              startIcon={<QueueIcon />}
                            >
                              Queue
                            </Button>
                          )}
                          {proposal.state === 'Queued' && (
                            <Button
                              variant="contained"
                              onClick={() => executeProposal(proposal.id)}
                              startIcon={<PlayArrowIcon />}
                            >
                              Execute
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
            
            {/* Existing Dialogs */}
            {/* ... Your existing dialogs ... */}
          </Container>
        ) : (
          <AdminDashboard userAddress={userAddress} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;