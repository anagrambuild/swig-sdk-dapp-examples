import { Select, Card } from '@swig/ui';

interface AdminDashboardProps {
  selectedLendingPermission: string[];
  setSelectedLendingPermission: (permission: string[]) => void;
  selectedDcaPermission: string[];
  setSelectedDcaPermission: (permission: string[]) => void;
  selectedTradingPermission: string[];
  setSelectedTradingPermission: (permission: string[]) => void;
  lendingSolRequired: number;
  setLendingSolRequired: (solRequired: number) => void;
  dcaSolRequired: number;
  setDcaSolRequired: (solRequired: number) => void;
  tradingSolRequired: number;
  setTradingSolRequired: (solRequired: number) => void;
  lendingTokens: string[];
  setLendingTokens: (tokens: string[]) => void;
  dcaTokens: string[];
  setDcaTokens: (tokens: string[]) => void;
  tradingTokens: string[];
  setTradingTokens: (tokens: string[]) => void;
}

const permissionOptions = [
  { id: 0, value: 'view_balance', label: 'View Balance' },
  {
    id: 1,
    value: 'view_transaction_history',
    label: 'View Transaction History',
  },
  { id: 2, value: 'sign_transactions', label: 'Sign Transactions' },
  { id: 3, value: 'create_sub_account', label: 'Create Sub-Account' },
  {
    id: 4,
    value: 'set_up_automatic_subscriptions',
    label: 'Set Up Automatic Subscriptions',
  },
];

const tokenOptions = [
  { id: 0, value: 'SOL', label: 'SOL' },
  { id: 1, value: 'USDC', label: 'USDC' },
  { id: 2, value: 'USDT', label: 'USDT' },
  { id: 3, value: 'BONK', label: 'BONK' },
  { id: 4, value: 'WIF', label: 'WIF' },
  { id: 5, value: 'JUP', label: 'JUP' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  selectedLendingPermission,
  setSelectedLendingPermission,
  selectedDcaPermission,
  setSelectedDcaPermission,
  selectedTradingPermission,
  setSelectedTradingPermission,
  lendingSolRequired,
  setLendingSolRequired,
  dcaSolRequired,
  setDcaSolRequired,
  tradingSolRequired,
  setTradingSolRequired,
  lendingTokens,
  setLendingTokens,
  dcaTokens,
  setDcaTokens,
  tradingTokens,
  setTradingTokens,
}) => {
  return (
    <div>
      <div className='text-lg font-medium text-gray-900'>
        Configure permissions for each protocol
      </div>
      <div className='flex flex-row gap-4'>
        <Card>
          <div>Lending protocol</div>
          <div>
            <span className='text-sm text-gray-500'>
              Select permissions for lending protocol
            </span>
            <Select
              multiple
              value={selectedLendingPermission}
              onChange={(value) =>
                setSelectedLendingPermission(value as string[])
              }
              options={permissionOptions}
              placeholder='Select options'
            />
          </div>
          <div>
            <span className='text-sm text-gray-500'>
              Amount of SOL required for transaction fees
            </span>
            <input
              type='number'
              className='w-full border border-gray-300 rounded-md p-2'
              value={lendingSolRequired}
              onChange={(e) => setLendingSolRequired(Number(e.target.value))}
            />
          </div>
          <div>
            <span className='text-sm text-gray-500'>
              Select possible tokens for lending protocol
            </span>
            <Select
              multiple
              value={lendingTokens}
              onChange={(value) => setLendingTokens(value as string[])}
              options={tokenOptions}
            />
          </div>
        </Card>

        <Card>
          <div>DCA protocol</div>
          <div>
            <span className='text-sm text-gray-500'>
              Select permissions for DCA protocol
            </span>
            <Select
              multiple
              value={selectedDcaPermission}
              onChange={(value) => setSelectedDcaPermission(value as string[])}
              options={permissionOptions}
              placeholder='Select options'
            />
          </div>
          <div>
            <span className='text-sm text-gray-500'>
              Amount of SOL required for transaction fees
            </span>
            <input
              type='number'
              className='w-full border border-gray-300 rounded-md p-2'
              value={dcaSolRequired}
              onChange={(e) => setDcaSolRequired(Number(e.target.value))}
            />
          </div>
          <div>
            <span className='text-sm text-gray-500'>
              Select possible tokens for DCA protocol
            </span>
            <Select
              multiple
              value={dcaTokens}
              onChange={(value) => setDcaTokens(value as string[])}
              options={tokenOptions}
            />
          </div>
        </Card>

        <Card>
          <div>Trading protocol</div>
          <div>
            <span className='text-sm text-gray-500'>
              Select permissions for trading protocol
            </span>
            <Select
              multiple
              value={selectedTradingPermission}
              onChange={(value) =>
                setSelectedTradingPermission(value as string[])
              }
              options={permissionOptions}
              placeholder='Select options'
            />
          </div>
          <div>
            <span className='text-sm text-gray-500'>
              Amount of SOL required for transaction fees
            </span>
            <input
              type='number'
              className='w-full border border-gray-300 rounded-md p-2'
              value={tradingSolRequired}
              onChange={(e) => setTradingSolRequired(Number(e.target.value))}
            />
          </div>
          <div>
            <span className='text-sm text-gray-500'>
              Select possible tokens for trading protocol
            </span>
            <Select
              multiple
              value={tradingTokens}
              onChange={(value) => setTradingTokens(value as string[])}
              options={tokenOptions}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
