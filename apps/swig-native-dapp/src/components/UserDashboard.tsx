import { Button, Card, Select } from '@swig/ui';
import { permissionOptions, tokenOptions } from '../data';
import { displayLabels, formatOptions } from '../utils/formatOptions';
import { UserDashboardProps } from '../types/ui';

const UserDashboard: React.FC<UserDashboardProps> = ({
  requestPermission,
  loading,
  selectedLendingPermission,
  selectedDcaPermission,
  selectedTradingPermission,
  lendingSolRequired,
  dcaSolRequired,
  tradingSolRequired,
  lendingTokens,
  dcaTokens,
  tradingTokens,
  userLendingTokens,
  setUserLendingTokens,
  userDcaTokens,
  setUserDcaTokens,
  userTradingTokens,
  setUserTradingTokens,
  userLendingTokenAmounts,
  handleLendingAmountChange,
  userDcaTokenAmounts,
  handleDcaAmountChange,
  userTradingTokenAmounts,
  handleTradingAmountChange,
}) => {
  const lendingPermissions = displayLabels(
    permissionOptions,
    selectedLendingPermission
  );
  const dcaPermissions = displayLabels(
    permissionOptions,
    selectedDcaPermission
  );
  const tradingPermissions = displayLabels(
    permissionOptions,
    selectedTradingPermission
  );

  const lendingTokensOptions = formatOptions(tokenOptions, lendingTokens);
  const dcaTokensOptions = formatOptions(tokenOptions, dcaTokens);
  const tradingTokensOptions = formatOptions(tokenOptions, tradingTokens);
  console.log('userLendingTokens', userLendingTokens);
  console.log('userLendingTokenAmounts', userLendingTokenAmounts);
  return (
    <div className='mt-6 flex flex-row gap-2'>
      <Card>
        <div className='flex flex-col gap-2'>
          <div>Lending protocol</div>
          <span className='text-sm text-gray-500'>
            We will need the following permissions from your swig wallet to help
            you interact with the lending protocol:
          </span>
        </div>
        <div className='text-sm text-gray-800'>
          {lendingPermissions.map((permission) => (
            <div key={permission}>{permission}</div>
          ))}
        </div>
        {lendingSolRequired === 0 ? null : (
          <div className='text-sm text-gray-500'>
            <span>SOL Required for transactions fees: </span>
            <span className='text-sm text-gray-800'>{lendingSolRequired}</span>
          </div>
        )}
        {lendingTokensOptions.length > 0 ? (
          <div className='flex flex-col gap-1'>
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
        <div className='flex flex-col gap-1'>
          {userLendingTokens.map((token) => (
            <div key={token}>
              <input
                type='number'
                className='w-full border border-gray-300 rounded-md p-2'
                value={
                  userLendingTokenAmounts.find((item) => item.token === token)
                    ?.amount || ''
                }
                onChange={(e) =>
                  handleLendingAmountChange(token, e.target.value)
                }
                placeholder={`Enter amount for ${token}`}
              />
            </div>
          ))}
        </div>
        <Button
          variant='primary'
          onClick={() => requestPermission(selectedLendingPermission)}
          disabled={loading}
        >
          Connect to Swig Wallet
        </Button>
      </Card>

      {/* DCA */}
      <Card>
        <div className='flex flex-col gap-2'>
          <div>DCA protocol</div>
          <span className='text-sm text-gray-500'>
            We will need the following permissions from your swig wallet to help
            you interact with the DCA protocol:
          </span>
        </div>
        <div className='text-sm text-gray-800'>
          {dcaPermissions.map((permission) => (
            <div key={permission}>{permission}</div>
          ))}
        </div>
        {dcaSolRequired === 0 ? null : (
          <div className='text-sm text-gray-500'>
            <span>SOL Required for transactions fees: </span>
            <span className='text-sm text-gray-800'>{dcaSolRequired}</span>
          </div>
        )}
        {dcaTokensOptions.length > 0 ? (
          <div className='flex flex-col gap-1'>
            <span className='text-sm text-gray-500'>
              Select the tokens you would like to DCA:
            </span>
            <Select
              multiple
              value={userDcaTokens}
              onChange={(value) => setUserDcaTokens(value as string[])}
              options={dcaTokensOptions}
            />
          </div>
        ) : null}
        <div className='flex flex-col gap-1'>
          {userDcaTokens.map((token) => (
            <div key={token}>
              <input
                type='number'
                className='w-full border border-gray-300 rounded-md p-2'
                value={
                  userDcaTokenAmounts.find((item) => item.token === token)
                    ?.amount || ''
                }
                onChange={(e) => handleDcaAmountChange(token, e.target.value)}
                placeholder={`Enter amount for ${token}`}
              />
            </div>
          ))}
        </div>
        <Button
          variant='primary'
          onClick={() => requestPermission(selectedDcaPermission)}
          disabled={loading}
        >
          Connect to Swig Wallet
        </Button>
      </Card>

      {/* Trading */}
      <Card>
        <div className='flex flex-col gap-2'>
          <div>Trading protocol</div>
          <span className='text-sm text-gray-500'>
            We will need the following permissions from your swig wallet to help
            you interact with the trading protocol:
          </span>
        </div>
        <div className='text-sm text-gray-800'>
          {tradingPermissions.map((permission) => (
            <div key={permission}>{permission}</div>
          ))}
        </div>
        {tradingSolRequired === 0 ? null : (
          <div className='text-sm text-gray-500'>
            <span>SOL Required for transactions fees: </span>
            <span className='text-sm text-gray-800'>{tradingSolRequired}</span>
          </div>
        )}
        {tradingTokensOptions.length > 0 ? (
          <div className='flex flex-col gap-1'>
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
        <div className='flex flex-col gap-1'>
          {userTradingTokens.map((token) => (
            <div key={token}>
              <input
                type='number'
                className='w-full border border-gray-300 rounded-md p-2'
                value={
                  userTradingTokenAmounts.find((item) => item.token === token)
                    ?.amount || ''
                }
                onChange={(e) =>
                  handleTradingAmountChange(token, e.target.value)
                }
                placeholder={`Enter amount for ${token}`}
              />
            </div>
          ))}
        </div>
        <Button
          variant='primary'
          onClick={() => requestPermission(selectedTradingPermission)}
          disabled={loading}
        >
          Connect to Swig Wallet
        </Button>
      </Card>
    </div>
  );
};

export default UserDashboard;
