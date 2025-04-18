export interface AdminDashboardProps {
  selectedLendingPermission: string[];
  setSelectedLendingPermission: (permission: string[]) => void;
  selectedSubscriptionPermission: string[];
  setSelectedSubscriptionPermission: (permission: string[]) => void;
  selectedTradingPermission: string[];
  setSelectedTradingPermission: (permission: string[]) => void;
  lendingSolRequired: number;
  setLendingSolRequired: (solRequired: number) => void;
  subscriptionSolRequired: number;
  setSubscriptionSolRequired: (solRequired: number) => void;
  tradingSolRequired: number;
  setTradingSolRequired: (solRequired: number) => void;
  lendingTokens: string[];
  setLendingTokens: (tokens: string[]) => void;
  subscriptionTokens: string[];
  setSubscriptionTokens: (tokens: string[]) => void;
  tradingTokens: string[];
  setTradingTokens: (tokens: string[]) => void;
  view: 'lending' | 'subscription' | 'trading';
}

export interface UserDashboardProps {
  requestPermission: (
    permissions: string[],
    solRequired: number,
    tokenAmounts: { token: string; amount: number }[]
  ) => void;
  loading: boolean;
  selectedLendingPermission: string[];
  selectedSubscriptionPermission: string[];
  selectedTradingPermission: string[];
  lendingSolRequired: number;
  subscriptionSolRequired: number;
  tradingSolRequired: number;
  lendingTokens: string[];
  subscriptionTokens: string[];
  tradingTokens: string[];
  userLendingTokens: string[];
  setUserLendingTokens: (tokens: string[]) => void;
  userSubscriptionTokens: string[];
  setUserSubscriptionTokens: (tokens: string[]) => void;
  userTradingTokens: string[];
  setUserTradingTokens: (tokens: string[]) => void;
  userLendingTokenAmounts: { token: string; amount: number }[];
  handleLendingAmountChange: (token: string, value: string) => void;
  userSubscriptionTokenAmounts: { token: string; amount: number }[];
  handleSubscriptionAmountChange: (token: string, value: string) => void;
  userTradingTokenAmounts: { token: string; amount: number }[];
  handleTradingAmountChange: (token: string, value: string) => void;
  view: 'lending' | 'subscription' | 'trading';
}
