import { Button, Card, Select } from '@swig/ui';
import {
  permissionOptions,
  lendingTokenOptions,
  subscriptionTokenOptions,
  tradingTokenOptions,
} from '../data';
import { displayLabels, formatOptions } from '../utils/formatOptions';
import { UserDashboardProps } from '../types/ui';

const UserDashboard: React.FC<UserDashboardProps> = ({
  requestPermission,
  loading,
  selectedLendingPermission,
  selectedSubscriptionPermission,
  selectedTradingPermission,
  lendingSolRequired,
  subscriptionSolRequired,
  tradingSolRequired,
  lendingTokens,
  subscriptionTokens,
  tradingTokens,
  userLendingTokens,
  setUserLendingTokens,
  userSubscriptionTokens,
  setUserSubscriptionTokens,
  userTradingTokens,
  setUserTradingTokens,
  userLendingTokenAmounts,
  handleLendingAmountChange,
  userSubscriptionTokenAmounts,
  handleSubscriptionAmountChange,
  userTradingTokenAmounts,
  handleTradingAmountChange,
  view,
}) => {
  const lendingPermissions = displayLabels(
    permissionOptions,
    selectedLendingPermission
  );
  const subscriptionPermissions = displayLabels(
    permissionOptions,
    selectedSubscriptionPermission
  );
  const tradingPermissions = displayLabels(
    permissionOptions,
    selectedTradingPermission
  );

  const lendingTokensOptions = formatOptions(
    lendingTokenOptions,
    lendingTokens
  );
  const subscriptionTokensOptions = formatOptions(
    subscriptionTokenOptions,
    subscriptionTokens
  );
  const tradingTokensOptions = formatOptions(
    tradingTokenOptions,
    tradingTokens
  );

  return (
    <div className='mt-6 flex flex-row gap-2 items-start'>
      {view === 'lending' && (
        <Card>
          <div>Lending protocol</div>
          <div>Description of the protocol with a cool graphic</div>
          {lendingSolRequired === 0 ? null : (
            <div className='text-sm text-gray-500'>
              <span>SOL Required for transactions fees: </span>
              <span className='text-sm text-gray-800'>
                {lendingSolRequired}
              </span>
            </div>
          )}
          <div className='flex flex-row flex-wrap gap-4'>
            {lendingTokensOptions.length > 0 ? (
              <div className='flex-[2]'>
                <span className='text-sm text-gray-500'>
                  Select the tokens you would like to lend:
                </span>
                <Select
                  multiple
                  value={userLendingTokens}
                  onChange={(value) => setUserLendingTokens(value as string[])}
                  options={lendingTokensOptions}
                />
              </div>
            ) : null}
            <div className='flex-[2]'>
              {userLendingTokens.map((token) => (
                <div key={token} className='mb-2'>
                  <span className='text-sm text-gray-500'>{token}</span>
                  <input
                    type='number'
                    className='w-full border border-gray-300 rounded-md p-2'
                    value={
                      userLendingTokenAmounts.find(
                        (item) => item.token === token
                      )?.amount || ''
                    }
                    onChange={(e) =>
                      handleLendingAmountChange(token, e.target.value)
                    }
                    placeholder={`Enter amount for ${token}`}
                  />
                </div>
              ))}
            </div>
            {lendingPermissions.length > 0 && (
              <div className='flex-[2]'>
                <span className='text-sm text-gray-500'>Permissions</span>
                <div className='mt-2'>
                  <span className='text-sm text-gray-500'>
                    We will need the following permissions from your swig wallet
                    to help you interact with the lending protocol:
                  </span>
                  <div className='text-sm text-gray-800 mt-2'>
                    {lendingPermissions.map((permission) => (
                      <div key={permission}>{permission}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className='flex justify-center'>
            <div className='max-w-[300px]'>
              <Button
                variant='primary'
                onClick={() =>
                  requestPermission(
                    selectedLendingPermission,
                    lendingSolRequired,
                    userLendingTokenAmounts
                  )
                }
                disabled={loading}
              >
                Connect to Swig Wallet
              </Button>
            </div>
          </div>
        </Card>
      )}

      {view === 'subscription' && (
        <Card>
          <div>Subscription protocol</div>
          <div>Description of the protocol with a cool graphic</div>
          {subscriptionSolRequired === 0 ? null : (
            <div className='text-sm text-gray-500'>
              <span>SOL Required for transactions fees: </span>
              <span className='text-sm text-gray-800'>
                {subscriptionSolRequired}
              </span>
            </div>
          )}
          <div className='flex flex-row flex-wrap gap-4'>
            {subscriptionTokensOptions.length > 0 ? (
              <div className='flex-[2]'>
                <span className='text-sm text-gray-500'>
                  Select the tokens you would like to subscribe to:
                </span>
                <Select
                  multiple
                  value={userSubscriptionTokens}
                  onChange={(value) =>
                    setUserSubscriptionTokens(value as string[])
                  }
                  options={subscriptionTokensOptions}
                />
              </div>
            ) : null}
            <div className='flex-[2]'>
              {userSubscriptionTokens.map((token) => (
                <div key={token} className='mb-2'>
                  <span className='text-sm text-gray-500'>{token}</span>
                  <input
                    type='number'
                    className='w-full border border-gray-300 rounded-md p-2'
                    value={
                      userSubscriptionTokenAmounts.find(
                        (item) => item.token === token
                      )?.amount || ''
                    }
                    onChange={(e) =>
                      handleSubscriptionAmountChange(token, e.target.value)
                    }
                    placeholder={`Enter amount for ${token}`}
                  />
                </div>
              ))}
            </div>
            {subscriptionPermissions.length > 0 && (
              <div className='flex-[2]'>
                <span className='text-sm text-gray-500'>Permissions</span>
                <div className='mt-2'>
                  <span className='text-sm text-gray-500'>
                    We will need the following permissions from your swig wallet
                    to help you interact with the subscription protocol:
                  </span>
                  <div className='text-sm text-gray-800 mt-2'>
                    {subscriptionPermissions.map((permission) => (
                      <div key={permission}>{permission}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className='flex justify-center'>
            <div className='max-w-[300px]'>
              <Button
                variant='primary'
                onClick={() =>
                  requestPermission(
                    selectedSubscriptionPermission,
                    subscriptionSolRequired,
                    userSubscriptionTokenAmounts
                  )
                }
                disabled={loading}
              >
                Connect to Swig Wallet
              </Button>
            </div>
          </div>
        </Card>
      )}

      {view === 'trading' && (
        <Card>
          <div>Trading protocol</div>
          <div>Description of the protocol with a cool graphic</div>
          {tradingSolRequired === 0 ? null : (
            <div className='text-sm text-gray-500'>
              <span>SOL Required for transactions fees: </span>
              <span className='text-sm text-gray-800'>
                {tradingSolRequired}
              </span>
            </div>
          )}
          <div className='flex flex-row flex-wrap gap-4'>
            {tradingTokensOptions.length > 0 ? (
              <div className='flex-[2]'>
                <span className='text-sm text-gray-500'>
                  Select the tokens you would like to trade:
                </span>
                <Select
                  multiple
                  value={userTradingTokens}
                  onChange={(value) => setUserTradingTokens(value as string[])}
                  options={tradingTokensOptions}
                />
              </div>
            ) : null}
            <div className='flex-[2]'>
              {userTradingTokens.map((token) => (
                <div key={token} className='mb-2'>
                  <span className='text-sm text-gray-500'>{token}</span>
                  <input
                    type='number'
                    className='w-full border border-gray-300 rounded-md p-2'
                    value={
                      userTradingTokenAmounts.find(
                        (item) => item.token === token
                      )?.amount || ''
                    }
                    onChange={(e) =>
                      handleTradingAmountChange(token, e.target.value)
                    }
                    placeholder={`Enter amount for ${token}`}
                  />
                </div>
              ))}
            </div>
            {tradingPermissions.length > 0 && (
              <div className='flex-[2]'>
                <span className='text-sm text-gray-500'>Permissions</span>
                <div className='mt-2'>
                  <span className='text-sm text-gray-500'>
                    We will need the following permissions from your swig wallet
                    to help you interact with the trading protocol:
                  </span>
                  <div className='text-sm text-gray-800 mt-2'>
                    {tradingPermissions.map((permission) => (
                      <div key={permission}>{permission}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className='flex justify-center'>
            <div className='max-w-[300px]'>
              <Button
                variant='primary'
                onClick={() =>
                  requestPermission(
                    selectedTradingPermission,
                    tradingSolRequired,
                    userTradingTokenAmounts
                  )
                }
                disabled={loading}
              >
                Connect to Swig Wallet
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UserDashboard;
