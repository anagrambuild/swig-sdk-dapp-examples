import { Select, Card } from '@swig/ui';
import {
  permissionOptions,
  lendingTokenOptions,
  subscriptionTokenOptions,
  tradingTokenOptions,
} from '../data';
import { AdminDashboardProps } from '../types/ui';

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  selectedLendingPermission,
  setSelectedLendingPermission,
  selectedSubscriptionPermission,
  setSelectedSubscriptionPermission,
  selectedTradingPermission,
  setSelectedTradingPermission,
  lendingSolRequired,
  setLendingSolRequired,
  subscriptionSolRequired,
  setSubscriptionSolRequired,
  tradingSolRequired,
  setTradingSolRequired,
  lendingTokens,
  setLendingTokens,
  subscriptionTokens,
  setSubscriptionTokens,
  tradingTokens,
  setTradingTokens,
  view,
}) => {
  return (
    <div>
      <div className='text-lg font-medium text-gray-900'>
        Configure permissions for {view} protocol according to swig specs
      </div>
      {view === 'lending' && (
        <div className='flex flex-row gap-4 items-start'>
          <Card>
            <div>Lending protocol</div>
            <div className='flex flex-row flex-wrap gap-4'>
              <div className='flex-[2]'>
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
              <div className='flex-[2]'>
                <span className='text-sm text-gray-500'>
                  Select possible tokens for lending protocol
                </span>
                <Select
                  multiple
                  value={lendingTokens}
                  onChange={(value) => setLendingTokens(value as string[])}
                  options={lendingTokenOptions}
                />
              </div>
              <div className='flex-1'>
                <span className='text-sm text-gray-500'>
                  Amount of SOL required for transaction fees
                </span>
                <input
                  type='number'
                  className='w-full border border-gray-300 rounded-md p-2'
                  value={lendingSolRequired}
                  onChange={(e) =>
                    setLendingSolRequired(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {view === 'subscription' && (
        <div className='flex flex-row gap-4 items-start'>
          <Card>
            <div>Subscription protocol</div>
            <div className='flex flex-row flex-wrap gap-4'>
              <div className='flex-[2]'>
                <span className='text-sm text-gray-500'>
                  Select permissions for subscription protocol
                </span>
                <Select
                  multiple
                  value={selectedSubscriptionPermission}
                  onChange={(value) =>
                    setSelectedSubscriptionPermission(value as string[])
                  }
                  options={permissionOptions}
                  placeholder='Select options'
                />
              </div>
              <div className='flex-[2]'>
                <span className='text-sm text-gray-500'>
                  Select possible tokens for subscription protocol
                </span>
                <Select
                  multiple
                  value={subscriptionTokens}
                  onChange={(value) => setSubscriptionTokens(value as string[])}
                  options={subscriptionTokenOptions}
                />
              </div>
              <div className='flex-1'>
                <span className='text-sm text-gray-500'>
                  Amount of SOL required for transaction fees
                </span>
                <input
                  type='number'
                  className='w-full border border-gray-300 rounded-md p-2'
                  value={subscriptionSolRequired}
                  onChange={(e) =>
                    setSubscriptionSolRequired(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </Card>
        </div>
      )}
      {view === 'trading' && (
        <div className='flex flex-row gap-4 items-start'>
          <Card>
            <div>Trading protocol</div>
            <div className='flex flex-row flex-wrap gap-4'>
              <div className='flex-[2]'>
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
              <div className='flex-[2]'>
                <span className='text-sm text-gray-500'>
                  Select possible tokens for trading protocol
                </span>
                <Select
                  multiple
                  value={tradingTokens}
                  onChange={(value) => setTradingTokens(value as string[])}
                  options={tradingTokenOptions}
                />
              </div>
              <div className='flex-1'>
                <span className='text-sm text-gray-500'>
                  Amount of SOL required for transaction fees
                </span>
                <input
                  type='number'
                  className='w-full border border-gray-300 rounded-md p-2'
                  value={tradingSolRequired}
                  onChange={(e) =>
                    setTradingSolRequired(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
