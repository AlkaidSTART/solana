export interface MockUserProfile {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Operator" | "Agent" | "Finance";
  avatarUrl?: string;
  tenantName: string;
  walletAddress: string;
  isWalletConnected: boolean;
  solBalance: string;
  usdcBalance: string;
}

export const MOCK_USER_PROFILE: MockUserProfile = {
  id: "usr_sea_demo_01",
  name: "Alex Rivera",
  email: "alex.rivera@solaflow.ai",
  role: "Owner",
  tenantName: "SEA_8892 Store Hub",
  walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  isWalletConnected: true,
  solBalance: "2.450 SOL",
  usdcBalance: "350.00 USDC",
};
