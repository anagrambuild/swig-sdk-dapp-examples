import { Button } from '@swig/ui';
interface UserDashboardProps {
  requestPermission: (permission: string) => void;
  loading: boolean;
}

const UserDashboard: React.FC<UserDashboardProps> = ({
  requestPermission,
  loading,
}) => {
  return (
    <div className='mt-6'>
      <Button
        variant='primary'
        onClick={() => requestPermission('view_balance')}
        disabled={loading}
      >
        Request View Balance Permission
      </Button>

      <Button
        variant='secondary'
        onClick={() => requestPermission('sign_transactions')}
        disabled={loading}
      >
        Request Sign Transactions Permission
      </Button>

      <Button
        variant='danger'
        onClick={() => requestPermission('create_sub_account')}
        disabled={loading}
      >
        Request Create Sub-Account Permission
      </Button>
    </div>
  );
};

export default UserDashboard;
